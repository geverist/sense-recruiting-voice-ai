/**
 * Simple WebSocket ConversationRelay Example
 * Minimal implementation of outbound calling with AI conversation
 */

const express = require('express');
const expressWs = require('express-ws');
const twilio = require('twilio');

// Configuration - Replace with your values
const config = {
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PORT: process.env.PORT || 3000,
  HOSTNAME: process.env.HOSTNAME || 'localhost:3000' // e.g., 'your-domain.ngrok-free.app'
};

// Initialize Express with WebSocket support
const { app } = expressWs(express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Twilio client
const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);

// Store active conversations
const conversations = new Map();

// =============================================================================
// WEBSOCKET ENDPOINT - Handles ConversationRelay events
// =============================================================================

app.ws('/ws', (ws, req) => {
  console.log('🔌 WebSocket connection established');

  let callSid = null;
  let conversationHistory = [];

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received event:', message.event);

      switch (message.event) {
        case 'start':
          // Call started - initialize conversation
          callSid = message.callSid;
          console.log(`🎬 Conversation started for call: ${callSid}`);

          // Save conversation
          conversations.set(callSid, { history: [] });

          // Send initial greeting
          const greeting = "Hi! This is Simon calling from Twilio. I'm an AI assistant helping with recruiting. Is now a good time to chat for a few minutes?";
          sendSpeech(ws, greeting);
          break;

        case 'transcript':
          // User spoke - we got the transcript
          const userSaid = message.transcript;
          console.log(`👤 User said: ${userSaid}`);

          // Store in history
          conversationHistory.push({ role: 'user', content: userSaid });

          // Generate AI response (simple for now - we'll add OpenAI next)
          const response = await generateResponse(userSaid, conversationHistory);
          console.log(`🤖 AI response: ${response}`);

          // Store AI response
          conversationHistory.push({ role: 'assistant', content: response });

          // Send response back to caller
          sendSpeech(ws, response);
          break;

        case 'stop':
          // Call ended
          console.log(`📞 Call ended: ${callSid}`);
          conversations.delete(callSid);
          break;

        default:
          console.log('❓ Unknown event:', message.event);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
    if (callSid) conversations.delete(callSid);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Helper: Send speech to caller
function sendSpeech(ws, text) {
  const message = {
    event: 'text',
    text: text
  };
  ws.send(JSON.stringify(message));
}

// Simple response generator (replace with OpenAI for production)
async function generateResponse(userSaid, history) {
  const lower = userSaid.toLowerCase();

  // Simple rule-based responses
  if (lower.includes('yes') && history.length < 4) {
    return "Great! Can you tell me about your experience with React or Node.js?";
  } else if (lower.includes('react') || lower.includes('node') || lower.includes('javascript')) {
    return "That sounds excellent! How many years of experience do you have?";
  } else if (lower.match(/\d+\s*year/)) {
    return "Perfect! What's your salary expectation for this role?";
  } else if (lower.includes('no') && history.length < 4) {
    return "No problem! When would be a better time? Feel free to call us back. Thanks!";
  } else {
    return "Thanks for sharing! Let me schedule a follow-up call with our hiring manager. Have a great day!";
  }
}

// =============================================================================
// HTTP ENDPOINT - Initiates outbound call
// =============================================================================

app.post('/make-call', async (req, res) => {
  const { phone, name } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  console.log(`📞 Initiating call to ${name || phone}...`);

  try {
    const call = await client.calls.create({
      to: phone,
      from: config.TWILIO_PHONE_NUMBER,
      url: `https://${config.HOSTNAME}/answer`,
      method: 'POST',
      statusCallback: `https://${config.HOSTNAME}/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'DetectMessageEnd'
    });

    console.log(`✅ Call initiated: ${call.sid}`);

    res.json({
      success: true,
      callSid: call.sid,
      message: `Call initiated to ${phone}`
    });
  } catch (error) {
    console.error('❌ Error making call:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// TWILIO WEBHOOK - Call answered
// =============================================================================

app.post('/answer', (req, res) => {
  const { CallSid, AnsweredBy } = req.body;
  console.log(`📞 Call ${CallSid} answered by: ${AnsweredBy}`);

  const twiml = new twilio.twiml.VoiceResponse();

  // Handle voicemail
  if (AnsweredBy === 'machine_start') {
    twiml.say({ voice: 'Polly.Joanna' },
      "Hi! This is Simon from Twilio. Please call us back when you're available. Thanks!");
    return res.type('text/xml').send(twiml.toString());
  }

  // Live person - connect to ConversationRelay
  const connect = twiml.connect();
  connect.conversationRelay({
    url: `wss://${config.HOSTNAME}/ws`,
    voice: 'Polly.Brian', // British male voice
    language: 'en-US',
    transcriptionProvider: 'twilio',
    ttsProvider: 'amazon-polly',
    dtmfDetection: false
  });

  console.log(`🎙️ Connected to ConversationRelay: wss://${config.HOSTNAME}/ws`);

  res.type('text/xml').send(twiml.toString());
});

// =============================================================================
// TWILIO WEBHOOK - Call status updates
// =============================================================================

app.post('/status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  console.log(`📊 Call ${CallSid} status: ${CallStatus}`);
  res.sendStatus(200);
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Simple WebSocket ConversationRelay',
    endpoints: {
      makeCall: 'POST /make-call',
      websocket: 'WS /ws'
    },
    example: {
      curl: `curl -X POST http://localhost:${config.PORT}/make-call \\
  -H "Content-Type: application/json" \\
  -d '{"phone": "+15555551234", "name": "Test"}'`
    }
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(config.PORT, () => {
  console.log('\n🚀 Simple WebSocket ConversationRelay Server Started');
  console.log('=====================================');
  console.log(`📡 HTTP Server: http://localhost:${config.PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${config.PORT}/ws`);
  console.log(`🌍 Public URL: https://${config.HOSTNAME}`);
  console.log('=====================================\n');
  console.log('📝 Make a test call:');
  console.log(`curl -X POST http://localhost:${config.PORT}/make-call \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"phone": "+15555551234", "name": "Test"}'`);
  console.log('\n');
});
