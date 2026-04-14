import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  WASocket,
  AnyMessageContent,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { Response } from "express";
import { useSupabaseAuthState } from "./supabaseAuthState";

export type WzStatus = "disconnected" | "connecting" | "qrcode" | "connected";

interface SseClient {
  id: string;
  res: Response;
}

let socket: WASocket | null = null;
let currentStatus: WzStatus = "disconnected";
let currentQrCode: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let currentClearState: (() => Promise<void>) | null = null;

const sseClients: SseClient[] = [];
const AUTH_FOLDER = path.join(process.cwd(), "baileys_auth"); // Mantido apenas para dev local
const logger = pino({ level: "silent" });

// Cria pasta local apenas em desenvolvimento
if (process.env.NODE_ENV !== "production" && !fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function broadcast(event: object) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((c) => {
    try { c.res.write(data); } catch { /* cliente desconectou */ }
  });
}

function setStatus(status: WzStatus, qrCode: string | null = null) {
  currentStatus = status;
  currentQrCode = qrCode;
  broadcast({ type: "status", status, qrCode });
}

export function addSseClient(id: string, res: Response) {
  sseClients.push({ id, res });
  res.write(`data: ${JSON.stringify({ type: "status", status: currentStatus, qrCode: currentQrCode })}\n\n`);
}

export function removeSseClient(id: string) {
  const idx = sseClients.findIndex((c) => c.id === id);
  if (idx !== -1) sseClients.splice(idx, 1);
}

export function getStatus() {
  return { status: currentStatus, qrCode: currentQrCode };
}

// ─── Socket creation (função interna, sem guards de status) ──────────────────

async function startSocket(): Promise<void> {
  // Cancela timer de reconexão pendente
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  // Destrói socket anterior se existir
  if (socket) {
    try { socket.end(undefined); } catch { /* ignora */ }
    socket = null;
  }

  setStatus("connecting");

  try {
    // Em produção: usa Supabase Storage (sessão sobrevive a restarts)
    // Em dev: mantém comportamento original com disco local via useMultiFileAuthState
    const { state, saveCreds, clearState: supabaseClearState } = process.env.NODE_ENV === "production"
      ? await useSupabaseAuthState()
      : await (async () => {
          const { useMultiFileAuthState } = await import("@whiskeysockets/baileys");
          const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
          return { state, saveCreds, clearState: async () => clearAuthFiles() };
        })();

    // Armazena a função clearState para uso no disconnectWhatsApp
    currentClearState = supabaseClearState;

    let version: [number, number, number];
    try {
      const result = await fetchLatestBaileysVersion();
      version = result.version;
    } catch {
      version = [2, 3000, 1015901307]; // fallback seguro
      console.warn("[WA] Não foi possível buscar versão mais recente. Usando fallback.");
    }

    socket = makeWASocket({
      version,
      auth: state,
      logger,
      // printQRInTerminal removido (deprecated) — QR é transmitido via SSE
      browser: Browsers.ubuntu("Chrome"),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      // Necessário para alguns casos de reconexão
      getMessage: async () => ({ conversation: "" }),
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code recebido — converte para imagem e broadcast
      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          setStatus("qrcode", qrDataUrl);
          console.log("[WA] QR Code gerado. Aguardando leitura...");
        } catch (err) {
          console.error("[WA] Erro ao gerar QR:", err);
        }
      }

      if (connection === "open") {
        console.log("[WA] Conectado com sucesso!");
        setStatus("connected", null);
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        console.log(`[WA] Conexão fechada. Código: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          // Logout explícito — limpa sessão e não reconecta
          console.log("[WA] Logout detectado. Limpando sessão.");
          // Em produção usa currentClearState (Supabase Storage).
          // Em dev usa clearAuthFiles (disco local).
          // IMPORTANTE: clearAuthFiles() NÃO apaga a sessão do Supabase!
          if (currentClearState) {
            await currentClearState().catch((e) =>
              console.error("[WA] Erro ao limpar sessão no Supabase:", e)
            );
          } else {
            clearAuthFiles();
          }
          currentClearState = null;
          setStatus("disconnected", null);
          socket = null;
          return;
        }

        // Para qualquer outro motivo (incluindo restartRequired após scan do QR),
        // reconecta automaticamente
        console.log("[WA] Reconectando em 2s...");
        socket = null;
        setStatus("connecting");

        reconnectTimer = setTimeout(() => {
          startSocket().catch((err) => {
            console.error("[WA] Falha na reconexão:", err);
            setStatus("disconnected", null);
          });
        }, 2000);
      }
    });
  } catch (err) {
    console.error("[WA] Erro ao criar socket:", err);
    setStatus("disconnected", null);
    socket = null;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

export async function connectWhatsApp(): Promise<void> {
  // Evita múltiplas tentativas simultâneas
  if (currentStatus === "connected") {
    console.log("[WA] Já está conectado.");
    return;
  }
  if (currentStatus === "connecting") {
    console.log("[WA] Já está conectando...");
    return;
  }
  await startSocket();
}

export async function disconnectWhatsApp(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  if (socket) {
    try { await socket.logout(); } catch { /* ignora */ }
    try { socket.end(undefined); } catch { /* ignora */ }
    socket = null;
  }

  // Limpa a sessão: Supabase Storage em produção, disco local em dev
  if (currentClearState) {
    await currentClearState();
  } else {
    clearAuthFiles();
  }
  setStatus("disconnected", null);
  console.log("[WA] Desconectado e sessão removida.");
}

export function isConnected(): boolean {
  return currentStatus === "connected" && socket !== null;
}

export async function tryAutoConnect(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // Em produção: verifica se há credenciais salvas no Supabase Storage
    const { supabase } = await import("../lib/supabase");
    const { data: files } = await supabase.storage
      .from("baileys-auth")
      .list("session");
    if (files && files.length > 0) {
      console.log("[WA] Sessão prévia encontrada no Supabase. Reconectando...");
      await startSocket();
    }
  } else {
    // Em desenvolvimento: usa disco local
    const files = fs.existsSync(AUTH_FOLDER) ? fs.readdirSync(AUTH_FOLDER) : [];
    if (files.length > 0) {
      console.log("[WA] Sessão prévia encontrada. Reconectando automaticamente...");
      await startSocket();
    }
  }
}

// ─── Envio de mensagens ───────────────────────────────────────────────────────

export async function sendTextMessage(phone: string, text: string): Promise<void> {
  if (!socket || !isConnected()) throw new Error("WhatsApp não está conectado");
  await socket.sendMessage(formatJid(phone), { text });
}

export async function sendMediaMessage(
  phone: string,
  caption: string | undefined,
  attachment: {
    type: string;
    filepath: string;
    mimetype: string;
    filename: string;
    audioBuffer?: Buffer;   // Buffer pré-convertido para áudio PTT (OGG/Opus)
  }
): Promise<void> {
  if (!socket || !isConnected()) throw new Error("WhatsApp não está conectado");

  let content: AnyMessageContent;

  switch (attachment.type) {
    case "image": {
      const buffer = fs.readFileSync(attachment.filepath);
      content = { image: buffer, caption };
      break;
    }
    case "video": {
      const buffer = fs.readFileSync(attachment.filepath);
      content = { video: buffer, caption, mimetype: attachment.mimetype };
      break;
    }
    case "audio": {
      // Usa o buffer já convertido (OGG/Opus) se disponível,
      // caso contrário lê o arquivo (fallback).
      const buffer = attachment.audioBuffer ?? fs.readFileSync(attachment.filepath);
      content = {
        audio: buffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      };
      break;
    }
    default: {
      // document
      const buffer = fs.readFileSync(attachment.filepath);
      content = {
        document: buffer,
        mimetype: attachment.mimetype,
        fileName: attachment.filename,
        caption,
      };
    }
  }

  await socket.sendMessage(formatJid(phone), content);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJid(phone: string): string {
  return `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
}

function clearAuthFiles() {
  try {
    fs.readdirSync(AUTH_FOLDER).forEach((f) => fs.unlinkSync(path.join(AUTH_FOLDER, f)));
  } catch { /* ignora */ }
}
