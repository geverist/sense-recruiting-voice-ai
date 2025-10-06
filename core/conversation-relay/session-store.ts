/**
 * Session Store
 * Manages conversation state for stateful interactions
 */

import { getMakeLogger } from "../../lib/logger.js";

const log = getMakeLogger("session-store");

interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Session {
  callSid: string;
  streamSid: string | null;
  config: any;
  conversationHistory: ConversationMessage[];
  startedAt: Date;
  lastActivityAt: Date;
}

export class SessionStore {
  private sessions: Map<string, Session>;

  constructor() {
    this.sessions = new Map();

    // Clean up old sessions every 5 minutes
    setInterval(() => this.cleanupSessions(), 5 * 60 * 1000);
  }

  createSession(callSid: string, data: Partial<Session>): Session {
    const session: Session = {
      callSid,
      streamSid: data.streamSid || null,
      config: data.config || {},
      conversationHistory: data.conversationHistory || [],
      startedAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.sessions.set(callSid, session);

    log.info("session-create", `Created session for call ${callSid}`);

    return session;
  }

  getSession(callSid: string): Session | null {
    const session = this.sessions.get(callSid);

    if (session) {
      session.lastActivityAt = new Date();
    }

    return session || null;
  }

  updateSession(callSid: string, updates: Partial<Session>): void {
    const session = this.sessions.get(callSid);

    if (!session) {
      log.error("session-update", `Session not found for call ${callSid}`);
      return;
    }

    Object.assign(session, updates);
    session.lastActivityAt = new Date();

    log.info("session-update", `Updated session for call ${callSid}`);
  }

  endSession(callSid: string): void {
    const session = this.sessions.get(callSid);

    if (!session) {
      return;
    }

    // TODO: Persist session data to database/Sync if needed
    const duration = Date.now() - session.startedAt.getTime();
    const turnCount = session.conversationHistory.length;

    log.info(
      "session-end",
      `Ended session for call ${callSid} - Duration: ${Math.round(duration / 1000)}s, Turns: ${turnCount}`
    );

    this.sessions.delete(callSid);
  }

  private cleanupSessions(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    let cleaned = 0;

    for (const [callSid, session] of this.sessions.entries()) {
      const age = now - session.lastActivityAt.getTime();

      if (age > maxAge) {
        this.sessions.delete(callSid);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log.info("session-cleanup", `Cleaned up ${cleaned} stale sessions`);
    }
  }

  // Get all active sessions (for monitoring)
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  // Get session count
  getSessionCount(): number {
    return this.sessions.size;
  }
}
