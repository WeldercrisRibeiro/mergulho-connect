import cron from "node-cron";
import { supabase } from "../lib/supabase";
import { isConnected, sendTextMessage, sendMediaMessage } from "../whatsapp/client";

async function getRecipientPhones(dispatch: {
  type: string;
  target_group_id: string | null;
  target_user_id: string | null;
}): Promise<string[]> {
  const phones: string[] = [];

  if (dispatch.type === "general") {
    const { data } = await supabase
      .from("profiles")
      .select("whatsapp_phone")
      .not("whatsapp_phone", "is", null);
    (data || []).forEach((p: any) => { if (p.whatsapp_phone) phones.push(p.whatsapp_phone); });

  } else if (dispatch.type === "group" && dispatch.target_group_id) {
    const { data: memberData } = await supabase
      .from("member_groups")
      .select("user_id")
      .eq("group_id", dispatch.target_group_id);
    const userIds = (memberData || []).map((m: any) => m.user_id);
    if (userIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("whatsapp_phone")
        .in("user_id", userIds)
        .not("whatsapp_phone", "is", null);
      (data || []).forEach((p: any) => { if (p.whatsapp_phone) phones.push(p.whatsapp_phone); });
    }

  } else if (dispatch.type === "individual" && dispatch.target_user_id) {
    const { data } = await supabase
      .from("profiles")
      .select("whatsapp_phone")
      .eq("user_id", dispatch.target_user_id)
      .single();
    if (data?.whatsapp_phone) phones.push(data.whatsapp_phone);
  }

  return [...new Set(phones)];
}

/**
 * Envia todas as partes de um disparo para um único destinatário.
 * Retorna a lista de erros (array vazio = sucesso total).
 */
async function sendToRecipient(
  phone: string,
  content: string | null,
  attachments: any[]
): Promise<string[]> {
  const errors: string[] = [];

  // 1. Texto sempre como mensagem separada e PRIMEIRA — garante que chegue
  //    mesmo que algum anexo falhe depois.
  if (content && content.trim()) {
    try {
      await sendTextMessage(phone, content.trim());
      await sleep(1200);
    } catch (err: any) {
      errors.push(`Texto: ${err.message}`);
      console.error(`[Scheduler] Falha ao enviar texto para ${phone}:`, err.message);
    }
  }

  // 2. Cada anexo enviado individualmente — falha em um não bloqueia os outros.
  for (const att of attachments) {
    try {
      // Áudio gravado pelo browser chega como audio/webm.
      // Baileys PTT funciona melhor com opus; forçamos o mimetype correto.
      const mimetype =
        att.type === "audio"
          ? "audio/ogg; codecs=opus"
          : att.mimetype;

      await sendMediaMessage(phone, undefined, {
        type: att.type,
        filepath: att.filepath,
        mimetype,
        filename: att.filename,
      });

      await sleep(1500);
    } catch (err: any) {
      errors.push(`Anexo "${att.filename}": ${err.message}`);
      console.error(`[Scheduler] Falha ao enviar anexo "${att.filename}" para ${phone}:`, err.message);
    }
  }

  return errors;
}

async function sendDispatch(dispatch: any): Promise<void> {
  if (!isConnected()) {
    throw new Error("WhatsApp não está conectado no momento do disparo.");
  }

  const phones = await getRecipientPhones(dispatch);
  if (phones.length === 0) {
    throw new Error("Nenhum destinatário com número de WhatsApp cadastrado encontrado.");
  }

  const attachments: any[] = dispatch.attachments || [];
  const logs: { recipient: string; status: string; error: string | null }[] = [];

  console.log(
    `[Scheduler] Enviando "${dispatch.title}" para ${phones.length} destinatário(s). ` +
    `Texto: ${!!dispatch.content} | Anexos: ${attachments.length}`
  );

  for (const phone of phones) {
    const errors = await sendToRecipient(phone, dispatch.content, attachments);

    if (errors.length === 0) {
      logs.push({ recipient: phone, status: "success", error: null });
    } else {
      // Considera sucesso parcial se ao menos algo chegou (texto + alguns anexos)
      const total = (dispatch.content ? 1 : 0) + attachments.length;
      const failed = errors.length;
      const partialSuccess = failed < total;

      logs.push({
        recipient: phone,
        status: partialSuccess ? "success" : "error",
        error: errors.join(" | "),
      });

      if (!partialSuccess) {
        console.error(`[Scheduler] Falha total para ${phone}: ${errors.join(" | ")}`);
      } else {
        console.warn(`[Scheduler] Envio parcial para ${phone}: ${errors.join(" | ")}`);
      }
    }

    // Delay entre destinatários para evitar rate-limit do WhatsApp
    await sleep(2000);
  }

  // Persiste os logs
  await supabase.from("wz_dispatch_logs").insert(
    logs.map((l) => ({
      dispatch_id: dispatch.id,
      recipient: l.recipient,
      status: l.status,
      error: l.error,
    }))
  );

  // Lança erro somente se TODOS os destinatários falharam completamente
  const allFailed = logs.every((l) => l.status === "error");
  if (allFailed) {
    throw new Error("Falha total: nenhum destinatário recebeu as mensagens. Veja os logs.");
  }
}

async function processPendingDispatches(): Promise<void> {
  const now = new Date();

  const { data: pending } = await supabase
    .from("wz_dispatches")
    .select("*, attachments:wz_dispatch_attachments(*)")
    .eq("status", "pending")
    .lte("scheduled_at", now.toISOString());

  if (!pending || pending.length === 0) return;

  console.log(`[Scheduler] ${pending.length} disparo(s) prontos para processar.`);

  for (const dispatch of pending) {
    await supabase
      .from("wz_dispatches")
      .update({ status: "sending" })
      .eq("id", dispatch.id);

    try {
      await sendDispatch(dispatch);

      await supabase
        .from("wz_dispatches")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", dispatch.id);

      console.log(`[Scheduler] ✓ Disparo "${dispatch.title}" concluído.`);
    } catch (err: any) {
      await supabase
        .from("wz_dispatches")
        .update({ status: "error", error_message: err.message })
        .eq("id", dispatch.id);

      console.error(`[Scheduler] ✗ Falha no disparo "${dispatch.title}":`, err.message);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function startScheduler(): void {
  cron.schedule("* * * * *", async () => {
    try {
      await processPendingDispatches();
    } catch (err) {
      console.error("[Scheduler] Erro inesperado:", err);
    }
  });

  console.log("[Scheduler] Iniciado. Verificando disparos a cada minuto.");
}
