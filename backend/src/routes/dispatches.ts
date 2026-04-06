import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
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
    const dispatches = await prisma.wzDispatch.findMany({
      include: { attachments: true, logs: { orderBy: { created_at: "desc" } } },
      orderBy: { created_at: "desc" },
    });
    res.json(dispatches);
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

    const dispatch = await prisma.wzDispatch.create({
      data: {
        title,
        content: content || null,
        type: type || "general",
        priority: priority || "normal",
        target_group_id: target_group_id || null,
        target_user_id: target_user_id || null,
        status: "pending",
        scheduled_at: new Date(scheduled_at),
        created_by: created_by || null,
        attachments: {
          create: files.map((file) => ({
            type: getAttachmentType(file.mimetype),
            filename: file.originalname,
            filepath: file.path,
            mimetype: file.mimetype,
          })),
        },
      },
      include: { attachments: true, logs: true },
    });

    res.status(201).json(dispatch);
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

    const existing = await prisma.wzDispatch.findUnique({ where: { id } });
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
    await prisma.wzDispatchAttachment.deleteMany({
      where: {
        dispatch_id: id,
        id: { notIn: keptIds }
      }
    });

    const newAttachments = files.map((file) => ({
      type: getAttachmentType(file.mimetype),
      filename: file.originalname,
      filepath: file.path,
      mimetype: file.mimetype,
    }));

    const dispatch = await prisma.wzDispatch.update({
      where: { id },
      data: {
        title,
        content: content || null,
        type: type || "general",
        priority: priority || "normal",
        target_group_id: target_group_id || null,
        target_user_id: target_user_id || null,
        status: "pending",
        error_message: null,
        scheduled_at: new Date(scheduled_at),
        attachments: {
          create: newAttachments
        }
      },
      include: { attachments: true, logs: true },
    });

    res.json(dispatch);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/dispatches/:id — cancela/remove um disparo
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const dispatch = await prisma.wzDispatch.findUnique({ where: { id } });
    if (!dispatch) {
      res.status(404).json({ error: "Disparo não encontrado." });
      return;
    }
    if (dispatch.status === "sending") {
      res.status(409).json({ error: "Não é possível excluir um disparo em andamento." });
      return;
    }
    await prisma.wzDispatch.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/dispatches/:id/retry — recoloca disparo com erro na fila
router.post("/:id/retry", async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const dispatch = await prisma.wzDispatch.findUnique({ where: { id } });
    if (!dispatch) {
      res.status(404).json({ error: "Disparo não encontrado." });
      return;
    }
    if (dispatch.status !== "error") {
      res.status(409).json({ error: "Somente disparos com erro podem ser recolocados na fila." });
      return;
    }
    const updated = await prisma.wzDispatch.update({
      where: { id },
      data: { status: "pending", error_message: null, scheduled_at: new Date() },
      include: { attachments: true, logs: true },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
