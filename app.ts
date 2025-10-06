/**
 * Main Application Server
 * Express server with WebSocket support for Twilio ConversationRelay
 */

import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";
import { getMakeLogger } from "./lib/logger.js";
import { HOSTNAME, PORT } from "./shared/env.js";
import { handleConversationRelay } from "./core/conversation-relay/handler.js";

const log = getMakeLogger("app");

// Initialize Express with WebSocket support
const { app } = expressWs(express());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  log.info("request", `${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// WebSocket endpoint for ConversationRelay
app.ws("/ws", async (ws: WebSocket, req: express.Request) => {
  log.info("websocket", "New ConversationRelay connection established");

  try {
    await handleConversationRelay(ws, req);
  } catch (error: any) {
    log.error("websocket", `Error handling ConversationRelay: ${error.message}`);
    ws.close();
  }
});

// Outbound call initiation endpoint (alternative to Serverless)
app.post("/screen-candidate", async (req, res) => {
  const { candidateId, firstName, phone, jobTitle, agentConfig } = req.body;

  log.info("screen-candidate", `Initiating screening call for ${firstName}`);

  // Validation
  if (!candidateId || !firstName || !phone || !jobTitle) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: candidateId, firstName, phone, jobTitle",
    });
  }

  // TODO: Implement outbound call logic
  // For now, return success
  res.json({
    success: true,
    message: `Screening call will be initiated for ${firstName}`,
    candidateId,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  log.error("error", `Server error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
const server = app.listen(PORT, () => {
  log.success("server", `🚀 Server running on http://localhost:${PORT}`);
  log.success("server", `📡 WebSocket endpoint: ws://localhost:${PORT}/ws`);
  if (HOSTNAME) {
    log.success("server", `🌍 Public URL: https://${HOSTNAME}`);
  } else {
    log.yellow("⚠️  HOSTNAME not set - remember to configure for production");
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  log.info("shutdown", "SIGTERM received, closing server...");
  server.close(() => {
    log.success("shutdown", "Server closed gracefully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  log.info("shutdown", "SIGINT received, closing server...");
  server.close(() => {
    log.success("shutdown", "Server closed gracefully");
    process.exit(0);
  });
});

export default app;
