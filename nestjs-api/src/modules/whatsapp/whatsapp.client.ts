import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  WASocket,
  AnyMessageContent,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

export type WzStatus = 'disconnected' | 'connecting' | 'qrcode' | 'connected';

export interface SseClient {
  id: string;
  res: any; // Express Response
}

const AUTH_FOLDER = path.join(process.cwd(), 'baileys_auth');
const logger = pino({ level: 'silent' });

let socket: WASocket | null = null;
let currentStatus: WzStatus = 'disconnected';
let currentQrCode: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const sseClients: SseClient[] = [];

// Cria pasta de autenticação local
if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function broadcast(event: object) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const c of sseClients) {
    try { c.res.write(data); } catch { /* cliente desconectou */ }
  }
}

export function setStatus(status: WzStatus, qrCode: string | null = null) {
  currentStatus = status;
  currentQrCode = qrCode;
  broadcast({ type: 'status', status, qrCode });
}

export function getStatus() {
  return { status: currentStatus, qrCode: currentQrCode };
}

export function addSseClient(id: string, res: any) {
  sseClients.push({ id, res });
  res.write(`data: ${JSON.stringify({ type: 'status', status: currentStatus, qrCode: currentQrCode })}\n\n`);
}

export function removeSseClient(id: string) {
  const idx = sseClients.findIndex((c) => c.id === id);
  if (idx !== -1) sseClients.splice(idx, 1);
}

// ─── Socket creation ──────────────────────────────────────────────────────────

export async function startSocket(): Promise<void> {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) { try { socket.end(undefined); } catch {} socket = null; }

  setStatus('connecting');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    let version: [number, number, number];
    try {
      const result = await fetchLatestBaileysVersion();
      version = result.version;
    } catch {
      version = [2, 3000, 1015901307];
      console.warn('[WA] Usando versão fallback do Baileys.');
    }

    socket = makeWASocket({
      version,
      auth: state,
      logger,
      browser: Browsers.ubuntu('Chrome'),
      syncFullHistory: false,
      markOnlineOnConnect: true,
      getMessage: async () => ({ conversation: '' }),
    });

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          setStatus('qrcode', qrDataUrl);
          console.log('[WA] QR Code gerado. Aguardando leitura...');
        } catch (err) {
          console.error('[WA] Erro ao gerar QR:', err);
        }
      }

      if (connection === 'open') {
        console.log('[WA] Conectado com sucesso!');
        setStatus('connected', null);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        console.log(`[WA] Conexão fechada. Código: ${statusCode}`);

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[WA] Logout detectado. Limpando sessão.');
          clearAuthFiles();
          setStatus('disconnected', null);
          socket = null;
          return;
        }

        console.log('[WA] Reconectando em 2s...');
        socket = null;
        setStatus('connecting');
        reconnectTimer = setTimeout(() => {
          startSocket().catch((err) => {
            console.error('[WA] Falha na reconexão:', err);
            setStatus('disconnected', null);
          });
        }, 2000);
      }
    });
  } catch (err) {
    console.error('[WA] Erro ao criar socket:', err);
    setStatus('disconnected', null);
    socket = null;
  }
}

// ─── API pública ─────────────────────────────────────────────────────────────

export async function connectWhatsApp(): Promise<void> {
  if (currentStatus === 'connected') { console.log('[WA] Já está conectado.'); return; }
  if (currentStatus === 'connecting') { console.log('[WA] Já está conectando...'); return; }
  await startSocket();
}

export async function disconnectWhatsApp(): Promise<void> {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  if (socket) {
    try { await socket.logout(); } catch {}
    try { socket.end(undefined); } catch {}
    socket = null;
  }
  clearAuthFiles();
  setStatus('disconnected', null);
  console.log('[WA] Desconectado e sessão removida.');
}

export function isConnected(): boolean {
  return currentStatus === 'connected' && socket !== null;
}

export async function tryAutoConnect(): Promise<void> {
  const files = fs.existsSync(AUTH_FOLDER) ? fs.readdirSync(AUTH_FOLDER) : [];
  if (files.length > 0) {
    console.log('[WA] Sessão prévia encontrada. Reconectando automaticamente...');
    await startSocket();
  }
}

// ─── Envio ────────────────────────────────────────────────────────────────────

export async function sendTextMessage(phone: string, text: string): Promise<void> {
  if (!socket || !isConnected()) throw new Error('WhatsApp não está conectado');
  await socket.sendMessage(formatJid(phone), { text });
}

export async function sendMediaMessage(
  phone: string,
  caption: string | undefined,
  attachment: { type: string; filepath: string; mimetype: string; filename: string; audioBuffer?: Buffer },
): Promise<void> {
  if (!socket || !isConnected()) throw new Error('WhatsApp não está conectado');

  let content: AnyMessageContent;
  switch (attachment.type) {
    case 'image': content = { image: fs.readFileSync(attachment.filepath), caption }; break;
    case 'video': content = { video: fs.readFileSync(attachment.filepath), caption, mimetype: attachment.mimetype }; break;
    case 'audio': {
      const buffer = attachment.audioBuffer ?? fs.readFileSync(attachment.filepath);
      content = { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true };
      break;
    }
    default: content = { document: fs.readFileSync(attachment.filepath), mimetype: attachment.mimetype, fileName: attachment.filename, caption };
  }
  await socket.sendMessage(formatJid(phone), content);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatJid(phone: string): string {
  return `${phone.replace(/\D/g, '')}@s.whatsapp.net`;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  let number = cleaned;
  if (number.startsWith('55') && number.length >= 12) number = number.slice(2);
  if (number.length === 10) return `55${number}`;
  if (number.length === 11) { const ddd = number.slice(0, 2); const rest = number.slice(3); return `55${ddd}${rest}`; }
  throw new Error(`Número inválido (${number.length} dígitos). Esperado: DDD+8 ou DDD+9+8 dígitos.`);
}

function clearAuthFiles() {
  try { fs.readdirSync(AUTH_FOLDER).forEach((f) => fs.unlinkSync(path.join(AUTH_FOLDER, f))); } catch {}
}
