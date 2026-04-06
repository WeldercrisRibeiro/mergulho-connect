import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import whatsappRouter from "./routes/whatsapp";
import dispatchesRouter from "./routes/dispatches";
import { startScheduler } from "./scheduler";
import { tryAutoConnect } from "./whatsapp/client";

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:8080";

// Middlewares
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve arquivos de upload
app.use("/api/uploads", express.static(path.join(process.cwd(), "uploads")));

// Rotas
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/dispatches", dispatchesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Start
app.listen(PORT, async () => {
  console.log(`[Server] Rodando em http://localhost:${PORT}`);
  startScheduler();
  await tryAutoConnect();
});
