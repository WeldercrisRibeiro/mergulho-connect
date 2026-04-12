// routes/eventDispatch.ts
// Adicionar esta rota no seu server (app.use("/api/events", eventDispatchRouter))

import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { isConnected, sendTextMessage, sendMediaMessage } from "../whatsapp/client";
import https from "https";
import http from "http";
import path from "path";
import os from "os";
import fs from "fs";

const router = Router();

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  let number = cleaned;
  if (number.startsWith("55")) number = number.slice(2);
  if (number.length !== 11) throw new Error(`Número inválido: ${phone}`);
  const ddd = number.slice(0, 2);
  const rest = number.slice(3);
  return `55${ddd}${rest}`;
}

/**
 * Baixa uma imagem de uma URL pública para um arquivo temporário.
 * Retorna o caminho do arquivo temporário ou null se falhar.
 */
function downloadImageToTemp(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const ext = path.extname(new URL(url).pathname).split("?")[0] || ".jpg";
      const tmpPath = path.join(os.tmpdir(), `event-banner-${Date.now()}${ext}`);
      const file = fs.createWriteStream(tmpPath);
      const client = url.startsWith("https") ? https : http;

      const req = client.get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          resolve(null);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(tmpPath);
        });
      });

      req.on("error", () => {
        file.close();
        try { fs.unlinkSync(tmpPath); } catch {}
        resolve(null);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        file.close();
        try { fs.unlinkSync(tmpPath); } catch {}
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

function formatEventMessage(event: {
  title: string;
  event_date: string;
  location?: string | null;
  description?: string | null;
  event_type: string;
  speakers?: string | null;
  price?: number;
  groups?: { name: string } | null;
  is_general: boolean;
}): string {
  const typeEmoji: Record<string, string> = {
    simple: "📅",
    course: "📚",
    conference: "🎤",
  };
  const typeLabel: Record<string, string> = {
    simple: "Compromisso",
    course: "Curso",
    conference: "Conferência",
  };

  const date = new Date(event.event_date);
  const formatted = date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const emoji = typeEmoji[event.event_type] || "📅";
  const label = typeLabel[event.event_type] || "Evento";
  const scope = event.is_general ? "Geral" : (event.groups?.name || "Departamento");

  let msg = `${emoji} *${label} — ${event.title}*\n`;
  msg += `\n🗓 *Data:* ${formatted}`;

  if (event.location) {
    msg += `\n📍 *Local:* ${event.location}`;
  }

  if (event.speakers) {
    msg += `\n🎙 *Palestrante(s):* ${event.speakers}`;
  }

  if (event.price && event.price > 0) {
    msg += `\n💰 *Valor:* R$ ${Number(event.price).toFixed(2)}`;
  }

  if (event.description) {
    msg += `\n\n📝 ${event.description}`;
  }

  msg += `\n\n👥 *Público:* ${scope}`;
  msg += `\n\n Querido membro, sua presença é muito importante para nós! Não Falte! `;
  msg += `\n\n_Aviso enviado pelo sistema da igreja._`;

  return msg;
}

// POST /api/events/:id/notify — envia aviso de evento via WhatsApp imediatamente
router.post("/:id/notify", async (req: Request, res: Response) => {
  try {
    if (!isConnected()) {
      res.status(503).json({
        ok: false,
        error: "WhatsApp não está conectado.",
        needsConnection: true,
      });
      return;
    }

    const eventId = req.params.id;

    // Busca o evento
    const { data: event, error: eventError } = await (supabase as any)
      .from("events")
      .select("*, groups(name)")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      res.status(404).json({ ok: false, error: "Evento não encontrado." });
      return;
    }

    // Determina destinatários
    let phones: string[] = [];

    if (event.is_general) {
      // Envia para todos com whatsapp_phone cadastrado
      const { data: profiles } = await supabase
        .from("profiles")
        .select("whatsapp_phone")
        .not("whatsapp_phone", "is", null);

      (profiles || []).forEach((p: any) => {
        if (p.whatsapp_phone) {
          try {
            phones.push(formatPhoneNumber(p.whatsapp_phone));
          } catch {
            // número inválido, ignora
          }
        }
      });
    } else if (event.group_id) {
      // Envia somente para membros do grupo
      const { data: memberData } = await supabase
        .from("member_groups")
        .select("user_id")
        .eq("group_id", event.group_id);

      const userIds = (memberData || []).map((m: any) => m.user_id);

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("whatsapp_phone")
          .in("user_id", userIds)
          .not("whatsapp_phone", "is", null);

        (profiles || []).forEach((p: any) => {
          if (p.whatsapp_phone) {
            try {
              phones.push(formatPhoneNumber(p.whatsapp_phone));
            } catch {
              // número inválido, ignora
            }
          }
        });
      }
    }

    // Remove duplicatas
    phones = [...new Set(phones)];

    if (phones.length === 0) {
      res.status(400).json({
        ok: false,
        error: "Nenhum destinatário com número de WhatsApp cadastrado encontrado.",
      });
      return;
    }

    const message = formatEventMessage(event);

    // Tenta baixar o banner se existir
    let bannerTmpPath: string | null = null;
    if (event.banner_url) {
      console.log(`[EventNotify] Baixando banner: ${event.banner_url}`);
      bannerTmpPath = await downloadImageToTemp(event.banner_url);
      if (!bannerTmpPath) {
        console.warn("[EventNotify] Falha ao baixar banner — enviará só texto.");
      }
    }

    let successCount = 0;
    let failCount = 0;

    for (const phone of phones) {
      try {
        if (bannerTmpPath) {
          // Envia imagem com o texto como legenda
          const ext = path.extname(bannerTmpPath).toLowerCase();
          const mimetype = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          await sendMediaMessage(phone, message, {
            type: "image",
            filepath: bannerTmpPath,
            mimetype,
            filename: `banner${ext}`,
          });
        } else {
          // Sem banner, envia só texto
          await sendTextMessage(phone, message);
        }
        successCount++;
        await sleep(1500);
      } catch (err: any) {
        console.error(`[EventNotify] Falha ao enviar para ${phone}:`, err.message);
        failCount++;
      }
    }

    // Limpa arquivo temporário do banner
    if (bannerTmpPath) {
      try { fs.unlinkSync(bannerTmpPath); } catch {}
    }

    console.log(
      `[EventNotify] Aviso do evento "${event.title}" enviado: ${successCount} ok, ${failCount} falhas.`
    );

    if (successCount === 0) {
      res.status(500).json({
        ok: false,
        error: `Falha ao enviar para todos os ${phones.length} destinatários.`,
      });
      return;
    }

    res.json({
      ok: true,
      sent: successCount,
      failed: failCount,
      total: phones.length,
    });
  } catch (err: any) {
    console.error("[EventNotify] Erro:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;