import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  connectWhatsApp,
  disconnectWhatsApp,
  getStatus,
  addSseClient,
  removeSseClient,
} from "../whatsapp/client";

const router = Router();

// GET /api/whatsapp/status — snapshot do status atual
router.get("/status", (_req: Request, res: Response) => {
  res.json(getStatus());
});

// GET /api/whatsapp/events — SSE stream para atualizações em tempo real
router.get("/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = uuidv4();
  addSseClient(clientId, res);

  // Heartbeat a cada 30s para manter conexão viva
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSseClient(clientId);
  });
});

// POST /api/whatsapp/connect — inicia fluxo de conexão
router.post("/connect", async (_req: Request, res: Response) => {
  try {
    await connectWhatsApp();
    res.json({ ok: true, message: "Iniciando conexão..." });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/whatsapp/disconnect — encerra sessão
router.post("/disconnect", async (_req: Request, res: Response) => {
  try {
    await disconnectWhatsApp();
    res.json({ ok: true, message: "Desconectado com sucesso." });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
