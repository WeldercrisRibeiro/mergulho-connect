/**
 * supabase/functions/send-push/index.ts
 *
 * Edge Function que envia Web Push Notifications para usuários que estão
 * com o app FECHADO (Nível B).
 *
 * Como configurar:
 *  1. Gere as chaves VAPID:
 *       npx web-push generate-vapid-keys
 *
 *  2. Defina os secrets no projeto Supabase:
 *       supabase secrets set VAPID_PUBLIC_KEY="sua_chave_publica"
 *       supabase secrets set VAPID_PRIVATE_KEY="sua_chave_privada"
 *       supabase secrets set VAPID_SUBJECT="mailto:seuemail@dominio.com"
 *
 *  3. Faça deploy da função:
 *       supabase functions deploy send-push
 *
 *  4. Crie um Database Webhook no Supabase:
 *       Tabela: announcements
 *       Evento: INSERT
 *       URL: https://<seu-projeto>.supabase.co/functions/v1/send-push
 *
 * A função recebe o payload do webhook, busca todas as subscriptions dos
 * usuários (exceto o autor) e envia a notificação push via Web Push Protocol.
 *
 * Dependências (importadas via esm.sh — compatível com Deno):
 *   - web-push: assina e envia mensagens para FCM/APNs usando o protocolo VAPID
 */

// @ts-ignore — Deno usa import de URL, não node_modules
import webpush from "https://esm.sh/web-push@3.6.7";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Handler principal ───────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Só aceita POST (vindo do Database Webhook)
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Valida o secret compartilhado para autenticar o webhook
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload = await req.json();

    // O Supabase Webhook envia { type, table, record, old_record, ... }
    const { type, record } = payload;

    // Só age em novos avisos
    if (type !== "INSERT" || !record) {
      return new Response("Ignored", { status: 200 });
    }

    const announcement = record as {
      id: string;
      title: string;
      content?: string;
      created_by: string;
    };

    // ─── Configura web-push com VAPID ────────────────────────────────────
    webpush.setVapidDetails(
      Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com",
      Deno.env.get("VAPID_PUBLIC_KEY") || "",
      Deno.env.get("VAPID_PRIVATE_KEY") || ""
    );

    // ─── Busca todas as subscriptions (exceto a do autor do aviso) ───────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    const { data: subscriptions, error } = await supabase
      .from("user_push_subscriptions")
      .select("user_id, subscription")
      .neq("user_id", announcement.created_by);

    if (error) {
      console.error("Erro ao buscar subscriptions:", error);
      return new Response("DB error", { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response("No subscribers", { status: 200 });
    }

    // ─── Monta o payload da notificação ──────────────────────────────────
    const notificationPayload = JSON.stringify({
      title: "📢 Novo Comunicado!",
      body: announcement.title || "Você recebeu um novo aviso da igreja.",
      icon: "/icons/icon-192x192.png",   // Ajuste para o ícone do seu PWA
      badge: "/icons/badge-72x72.png",   // Ícone monocromático para o badge (Android)
      data: {
        url: "/home",                    // Para onde abrir ao clicar
        announcementId: announcement.id,
      },
    });

    // ─── Envia para cada subscriber em paralelo ───────────────────────────
    const sendResults = await Promise.allSettled(
      subscriptions.map(async ({ user_id, subscription }) => {
        try {
          await webpush.sendNotification(subscription, notificationPayload);
          return { user_id, success: true };
        } catch (err: any) {
          // 410 Gone = subscription expirada → remover do banco
          if (err.statusCode === 410) {
            await supabase
              .from("user_push_subscriptions")
              .delete()
              .eq("user_id", user_id);
            console.log(`Subscription expirada removida para user: ${user_id}`);
          } else {
            console.warn(`Falha ao enviar para ${user_id}:`, err.message);
          }
          return { user_id, success: false };
        }
      })
    );

    const sent = sendResults.filter(
      (r) => r.status === "fulfilled" && (r.value as any).success
    ).length;

    console.log(`Push enviado para ${sent}/${subscriptions.length} usuários`);

    return new Response(
      JSON.stringify({ sent, total: subscriptions.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na Edge Function:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});