import { supabase } from "@/integrations/supabase/client";

/**
 * Registra uma ação de auditoria no banco de dados.
 * Chamado automaticamente em operações CRUD das rotinas.
 */
export async function logAudit(
  action: "login" | "access" | "create" | "update" | "delete",
  routine: string,
  details?: Record<string, any>
) {
  try {
    const IS_DEBUG_ADMIN = localStorage.getItem("debug_admin") === "true";
    if (IS_DEBUG_ADMIN) {
      console.log("[Audit] Skipping logAudit in Debug Admin mode.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const deviceInfo = `${navigator.userAgent.substring(0, 120)}`;

    const { error } = await (supabase as any).from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email || "",
      user_name: user.user_metadata?.full_name || user.email || "Desconhecido",
      action,
      routine,
      details: details || {},
      ip_address: "", // IP is only available server-side
      device_info: deviceInfo,
    });
  } catch (err) {
    console.warn("[Audit] Falha ao registrar log:", err);
  }
}
