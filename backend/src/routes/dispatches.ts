import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { upload } from "../middleware/upload";
import path from "path";

const router = Router();

function getAttachmentType(mimetype: string): "image" | "video" | "audio" | "document" {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
}

// GET /api/dispatches — lista todos os disparos
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data: dispatches, error } = await supabase
      .from("wz_dispatches")
      .select("*, attachments:wz_dispatch_attachments(*), logs:wz_dispatch_logs(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Ordena logs manualmente pois o Supabase não suporta order by em nested select de forma simples
    const formatted = (dispatches || []).map(d => ({
      ...d,
      logs: (d.logs || []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dispatches — cria novo disparo agendado (multipart/form-data)
router.post("/", upload.array("files"), async (req: Request, res: Response) => {
  try {
    const { title, content, type, priority, target_group_id, target_user_id, scheduled_at, created_by } = req.body;

    if (!title) {
      res.status(400).json({ error: "Título é obrigatório." });
      return;
    }
    if (!scheduled_at) {
      res.status(400).json({ error: "Data/hora de agendamento é obrigatória." });
      return;
    }
    if (!content && (!req.files || (req.files as Express.Multer.File[]).length === 0)) {
      res.status(400).json({ error: "É necessário pelo menos uma mensagem de texto ou um anexo." });
      return;
    }

    const files = (req.files as Express.Multer.File[]) || [];

    const { data: dispatch, error: dError } = await supabase
      .from("wz_dispatches")
      .insert({
        title,
        content: content || null,
        type: type || "general",
        priority: priority || "normal",
        target_group_id: target_group_id || null,
        target_user_id: target_user_id || null,
        status: "pending",
        scheduled_at: new Date(scheduled_at).toISOString(),
        created_by: created_by || null,
      })
      .select()
      .single();

    if (dError) throw dError;

    if (files.length > 0) {
      const { error: aError } = await supabase.from("wz_dispatch_attachments").insert(
        files.map((file) => ({
          dispatch_id: dispatch.id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
        }))
      );
      if (aError) throw aError;
    }

    // Busca o objeto completo para retornar (com attachments e logs vazios)
    const { data: fullDispatch } = await supabase
      .from("wz_dispatches")
      .select("*, attachments:wz_dispatch_attachments(*), logs:wz_dispatch_logs(*)")
      .eq("id", dispatch.id)
      .single();

    res.status(201).json(fullDispatch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/dispatches/:id — atualiza disparo agendado (multipart/form-data)
router.put("/:id", upload.array("files"), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { title, content, type, priority, target_group_id, target_user_id, scheduled_at } = req.body;
    let kept_attachments = req.body.kept_attachments;

    if (!title || !scheduled_at) {
      res.status(400).json({ error: "Título e Data de agendamento são obrigatórios." });
      return;
    }

    const { data: existing, error: eError } = await supabase
      .from("wz_dispatches")
      .select("*")
      .eq("id", id)
      .single();

    if (!existing) {
      res.status(404).json({ error: "Disparo não encontrado." });
      return;
    }
    if (existing.status === "sending") {
      res.status(409).json({ error: "Não é possível editar um disparo já em andamento." });
      return;
    }

    let keptIds: string[] = [];
    if (kept_attachments) {
      try { keptIds = JSON.parse(kept_attachments); } 
      catch { keptIds = Array.isArray(kept_attachments) ? kept_attachments : [kept_attachments]; }
    }

    const files = (req.files as Express.Multer.File[]) || [];
    
    if (!content && files.length === 0 && keptIds.length === 0) {
      res.status(400).json({ error: "É necessário pelo menos texto ou um anexo." });
      return;
    }

    // Exclui os anexos que não vieram na lista de kept_attachments
    await supabase.from("wz_dispatch_attachments").delete().eq("dispatch_id", id).not("id", "in", `(${keptIds.join(",")})`);
    // Se a lista de mantidos for vazia, exclui todos
    if (keptIds.length === 0) {
      await supabase.from("wz_dispatch_attachments").delete().eq("dispatch_id", id);
    } else {
      await supabase.from("wz_dispatch_attachments").delete().eq("dispatch_id", id).not("id", "in", `(${keptIds.join(",")})`);
    }

    const { error: uError } = await supabase
      .from("wz_dispatches")
      .update({
        title,
        content: content || null,
        type: type || "general",
        priority: priority || "normal",
        target_group_id: target_group_id || null,
        target_user_id: target_user_id || null,
        status: "pending",
        error_message: null,
        scheduled_at: new Date(scheduled_at).toISOString(),
      })
      .eq("id", id);

    if (uError) throw uError;

    if (files.length > 0) {
      const { error: aError } = await supabase.from("wz_dispatch_attachments").insert(
        files.map((file) => ({
          dispatch_id: id,
          type: getAttachmentType(file.mimetype),
          filename: file.originalname,
          filepath: file.path,
          mimetype: file.mimetype,
        }))
      );
      if (aError) throw aError;
    }

    // Busca atualizado
    const { data: updated } = await supabase
      .from("wz_dispatches")
      .select("*, attachments:wz_dispatch_attachments(*), logs:wz_dispatch_logs(*)")
      .eq("id", id)
      .single();

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dispatches/:id — cancela/remove um disparo
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { data: dispatch } = await supabase
      .from("wz_dispatches")
      .select("status")
      .eq("id", id)
      .single();

    if (!dispatch) {
      res.status(404).json({ error: "Disparo não encontrado." });
      return;
    }
    if (dispatch.status === "sending") {
      res.status(409).json({ error: "Não é possível excluir um disparo em andamento." });
      return;
    }
    await supabase.from("wz_dispatches").delete().eq("id", id);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dispatches/:id/retry — recoloca disparo com erro na fila
router.post("/:id/retry", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { data: dispatch } = await supabase
      .from("wz_dispatches")
      .select("status")
      .eq("id", id)
      .single();

    if (!dispatch) {
      res.status(404).json({ error: "Disparo não encontrado." });
      return;
    }
    if (dispatch.status !== "error") {
      res.status(409).json({ error: "Somente disparos com erro podem ser recolocados na fila." });
      return;
    }
    const { error: uError } = await supabase
      .from("wz_dispatches")
      .update({ status: "pending", error_message: null, scheduled_at: new Date().toISOString() })
      .eq("id", id);

    if (uError) throw uError;

    const { data: updated } = await supabase
      .from("wz_dispatches")
      .select("*, attachments:wz_dispatch_attachments(*), logs:wz_dispatch_logs(*)")
      .eq("id", id)
      .single();

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
