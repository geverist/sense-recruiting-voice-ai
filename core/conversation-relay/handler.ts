/**
 * ConversationRelay WebSocket Handler
 * Manages the bidirectional communication between Twilio and OpenAI
 */

import { WebSocket } from "ws";
import express from "express";
import OpenAI from "openai";
import { getMakeLogger } from "../../lib/logger.js";
import { OPENAI_API_KEY } from "../../shared/env.js";
import { SessionStore } from "./session-store.js";

const log = getMakeLogger("conversation-relay");

// Initialize OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Session store for stateful conversations
const sessionStore = new SessionStore();

interface ConversationRelayMessage {
  event: string;
  sequenceNumber?: number;
  streamSid?: string;
  callSid?: string;
  transcript?: string;
  parameters?: Record<string, any>;
}

export async function handleConversationRelay(
  ws: WebSocket,
  req: express.Request
): Promise<void> {
  let callSid: string | null = null;
  let streamSid: string | null = null;
  let sessionConfig: any = null;

  ws.on("message", async (data: Buffer) => {
    try {
      const message: ConversationRelayMessage = JSON.parse(data.toString());

      log.info("relay-event", `Event: ${message.event}`);

      switch (message.event) {
        case "start":
          // Connection initialized
          callSid = message.callSid || null;
          streamSid = message.streamSid || null;

          // Parse JSON-stringified parameters from Twilio
          const rawParams = message.parameters || {};
          sessionConfig = {
            ...rawParams,
            agentConfig: rawParams.agentConfig ? JSON.parse(rawParams.agentConfig) : {},
            voiceConfig: rawParams.voiceConfig ? JSON.parse(rawParams.voiceConfig) : {},
            llmConfig: rawParams.llmConfig ? JSON.parse(rawParams.llmConfig) : {},
            knowledgeBase: rawParams.knowledgeBase ? JSON.parse(rawParams.knowledgeBase) : [],
            tools: rawParams.tools ? JSON.parse(rawParams.tools) : [],
          };

          log.success("relay-start", `ConversationRelay started for call ${callSid}`);

          // Initialize session
          if (callSid) {
            sessionStore.createSession(callSid, {
              callSid,
              streamSid,
              config: sessionConfig,
              conversationHistory: [],
            });
          }

          // Send initial greeting
          await sendInitialGreeting(ws, sessionConfig);
          break;

        case "media":
          // Audio data from caller (we don't process raw audio in this implementation)
          break;

        case "transcript":
          // User speech transcription from Twilio
          if (message.transcript && callSid) {
            log.info("transcript", `User: ${message.transcript}`);

            // Process with OpenAI and respond
            await handleUserSpeech(ws, callSid, message.transcript, sessionConfig);
          }
          break;

        case "dtmf":
          // DTMF tone received
          log.info("dtmf", `DTMF received: ${JSON.stringify(message)}`);
          break;

        case "stop":
          // Connection ended
          log.info("relay-stop", `ConversationRelay stopped for call ${callSid}`);

          // Clean up session
          if (callSid) {
            sessionStore.endSession(callSid);
          }
          break;

        default:
          log.info("relay-event", `Unknown event: ${message.event}`);
      }
    } catch (error: any) {
      log.error("relay-error", `Error processing message: ${error.message}`);
    }
  });

  ws.on("close", () => {
    log.info("relay-close", `WebSocket connection closed for call ${callSid}`);
    if (callSid) {
      sessionStore.endSession(callSid);
    }
  });

  ws.on("error", (error) => {
    log.error("relay-error", `WebSocket error: ${error.message}`);
  });
}

async function sendInitialGreeting(ws: WebSocket, config: any): Promise<void> {
  const firstName = config.firstName || "there";
  const jobTitle = config.jobTitle || "position";
  const agentName = config.agentConfig?.name || "Simon";
  const companyName = config.agentConfig?.company || "Twilio";

  const greeting = `Hi ${firstName}! This is ${agentName} from ${companyName}. Thanks so much for your interest in our ${jobTitle} role. Do you have a few minutes to chat?`;

  sendAISpeech(ws, greeting);
}

async function handleUserSpeech(
  ws: WebSocket,
  callSid: string,
  userTranscript: string,
  config: any
): Promise<void> {
  const session = sessionStore.getSession(callSid);

  if (!session) {
    log.error("session", `No session found for call ${callSid}`);
    return;
  }

  // Add user message to conversation history
  session.conversationHistory.push({
    role: "user",
    content: userTranscript,
  });

  // Build messages for OpenAI
  const messages: any[] = [];

  // System prompt
  const systemPrompt = buildSystemPrompt(config);
  messages.push({ role: "system", content: systemPrompt });

  // Conversation history (stateful if enabled)
  const promptMode = config.agentConfig?.promptMode || "stateless";

  if (promptMode === "stateful") {
    // Include conversation history
    const memoryMode = config.agentConfig?.stateful?.conversationMemory || "sliding";
    const memoryWindow = config.agentConfig?.stateful?.memoryWindow || 10;

    if (memoryMode === "sliding") {
      // Only include last N turns
      const recentHistory = session.conversationHistory.slice(-memoryWindow * 2);
      messages.push(...recentHistory);
    } else if (memoryMode === "full") {
      // Include all history
      messages.push(...session.conversationHistory);
    } else if (memoryMode === "summary") {
      // TODO: Implement summarization
      messages.push(...session.conversationHistory.slice(-memoryWindow * 2));
    }
  } else {
    // Stateless: only current message
    messages.push({ role: "user", content: userTranscript });
  }

  try {
    // Call OpenAI
    const llmConfig = config.llmConfig || {};
    const completion = await openai.chat.completions.create({
      model: llmConfig.model || "gpt-4o-mini",
      messages,
      temperature: llmConfig.temperature || 0.7,
      max_tokens: llmConfig.maxTokens || 150,
      top_p: llmConfig.topP || 0.9,
      frequency_penalty: llmConfig.frequencyPenalty || 0.0,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I didn't catch that. Could you repeat?";

    // Add AI response to history
    session.conversationHistory.push({
      role: "assistant",
      content: aiResponse,
    });

    log.info("ai-response", `AI: ${aiResponse}`);

    // Send AI speech back to caller
    sendAISpeech(ws, aiResponse);

    // Update session
    sessionStore.updateSession(callSid, session);
  } catch (error: any) {
    log.error("openai-error", `Error calling OpenAI: ${error.message}`);

    const fallback = "I'm experiencing technical difficulties. Let me transfer you to a team member.";
    sendAISpeech(ws, fallback);
  }
}

function buildSystemPrompt(config: any): string {
  const agentConfig = config.agentConfig || {};

  // Use custom prompt if provided, otherwise default
  if (agentConfig.prompt) {
    return agentConfig.prompt
      .replace(/\{\{firstName\}\}/g, config.firstName || "there")
      .replace(/\{\{jobTitle\}\}/g, config.jobTitle || "the position")
      .replace(/\{\{agentName\}\}/g, agentConfig.name || "Simon")
      .replace(/\{\{companyName\}\}/g, agentConfig.company || "our company");
  }

  // Default prompt
  return `You are ${agentConfig.name || "Simon"}, an AI voice assistant for ${agentConfig.company || "Twilio"}.

You are conducting a phone screening with ${config.firstName || "a candidate"} for the ${config.jobTitle || "position"}.

Keep your responses:
- Brief (1-3 sentences for voice)
- Natural and conversational
- Professional but warm
- Ask one question at a time

Your goal is to assess the candidate's qualifications and interest in the role.`;
}

function sendAISpeech(ws: WebSocket, text: string): void {
  const message = {
    event: "text",
    text: text,
  };

  ws.send(JSON.stringify(message));
}
