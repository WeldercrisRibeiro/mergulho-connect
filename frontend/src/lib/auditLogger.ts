import { supabase } from "@/integrations/supabase/client";

/**
 * Registra uma ação de auditoria no banco de dados.
 * Chamado automaticamente em operações CRUD das rotinas.
 * O acesso à tela de auditoria é exclusivo para ADM CCM.
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

    // Captura a role do usuário para contexto no log
    const { data: roleData } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const userRole = roleData?.role || "membro";
    const deviceInfo = navigator.userAgent.substring(0, 200);

    await (supabase as any).from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email || "",
      user_name: user.user_metadata?.full_name || user.email || "Desconhecido",
      action,
      routine,
      details: {
        ...(details || {}),
        user_role: userRole,
        local_time: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      },
      ip_address: "", // IP disponível apenas no servidor
      device_info: deviceInfo,
    });
  } catch (err) {
    console.warn("[Audit] Falha ao registrar log:", err);
  }
}
