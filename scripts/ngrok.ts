/**
 * ngrok Tunnel Script
 * Starts ngrok tunnel for local development
 */

import { spawn } from "child_process";
import { getMakeLogger } from "../lib/logger.js";
import { HOSTNAME, PORT } from "../shared/env.js";

const log = getMakeLogger("ngrok");

// Check if HOSTNAME is configured
if (!HOSTNAME || HOSTNAME === "your-domain.ngrok-free.app") {
  log.error("config", "❌ HOSTNAME not configured in .env");
  log.yellow("\n💡 To set up ngrok:");
  log.yellow("   1. Sign up at https://dashboard.ngrok.com");
  log.yellow("   2. Get your static domain (e.g., your-name.ngrok-free.app)");
  log.yellow("   3. Update HOSTNAME in .env");
  log.yellow("   4. Run: ngrok config add-authtoken YOUR_TOKEN\n");
  process.exit(1);
}

log.info("ngrok", `🚇 Starting ngrok tunnel to localhost:${PORT}...`);
log.info("ngrok", `📡 Domain: ${HOSTNAME}\n`);

// Start ngrok
const ngrok = spawn("ngrok", ["http", `--domain=${HOSTNAME}`, `${PORT}`], {
  stdio: "inherit",
});

ngrok.on("error", (error) => {
  log.error("ngrok", `Failed to start ngrok: ${error.message}`);
  log.yellow("\n💡 Make sure ngrok is installed:");
  log.yellow("   brew install ngrok  (macOS)");
  log.yellow("   Or download from: https://ngrok.com/download\n");
  process.exit(1);
});

ngrok.on("close", (code) => {
  if (code !== 0) {
    log.error("ngrok", `ngrok exited with code ${code}`);
  }
  process.exit(code || 0);
});

// Handle cleanup
process.on("SIGINT", () => {
  log.info("ngrok", "\n🛑 Stopping ngrok...");
  ngrok.kill();
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("ngrok", "\n🛑 Stopping ngrok...");
  ngrok.kill();
  process.exit(0);
});
