import api from "@/lib/api";

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

    const deviceInfo = navigator.userAgent.substring(0, 200);

    await api.post("/audit-logs", {
      action,
      routine,
      details: {
        ...(details || {}),
        local_time: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      },
      deviceInfo,
    });
  } catch (err) {
    console.warn("[Audit] Falha ao registrar log:", err);
  }
}
