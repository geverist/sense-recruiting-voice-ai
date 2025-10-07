#!/usr/bin/env node
/**
 * STANDALONE WEBSOCKET CONVERSATIONRELAY EXAMPLE
 * Single file - just run: node standalone.js
 *
 * Makes outbound calls with AI conversation over WebSocket.
 * No UI, no dependencies on other files - everything in one place!
 *
 * Setup:
 * 1. npm install express express-ws twilio
 * 2. Set environment variables (see below)
 * 3. Start ngrok: ngrok http 3000
 * 4. node standalone.js
 * 5. curl -X POST http://localhost:3000/make-call \
 *      -H "Content-Type: application/json" \
 *      -d '{"phone": "+15555551234"}'
 */

const express = require('express');
const expressWs = require('express-ws');
const twilio = require('twilio');

// =============================================================================
// CONFIGURATION - Set via environment variables
// =============================================================================

const config = {
  // Required
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'your_auth_token',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '+1234567890',

  // Server
  PORT: process.env.PORT || 3000,
  HOSTNAME: process.env.HOSTNAME || 'localhost:3000', // Set to your ngrok URL
};

// Validate configuration
if (config.TWILIO_ACCOUNT_SID === 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
  console.error('❌ ERROR: Set TWILIO_ACCOUNT_SID environment variable');
  console.error('   export TWILIO_ACCOUNT_SID=ACxxxxx...');
  process.exit(1);
}

// =============================================================================
// INITIALIZE
// =============================================================================

const { app } = expressWs(express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
const conversations = new Map();

// =============================================================================
// WEBSOCKET ENDPOINT - This is where the magic happens!
// =============================================================================

app.ws('/ws', (ws, req) => {
  console.log('🔌 WebSocket connected');

  let callSid = null;
  let conversationHistory = [];

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.event) {
        // Call started
        case 'start':
          callSid = message.callSid;
          console.log(`🎬 Call started: ${callSid}`);

          conversations.set(callSid, { history: [] });

          // Send greeting
          sendSpeech(ws, "Hi! This is Simon from Twilio. I'm calling about a job opportunity. Is now a good time to chat?");
          break;

        // User spoke - we got transcript
        case 'transcript':
          const userSaid = message.transcript;
          console.log(`👤 User: ${userSaid}`);

          conversationHistory.push({ role: 'user', content: userSaid });

          // Generate response
          const response = generateResponse(userSaid, conversationHistory);
          console.log(`🤖 AI: ${response}`);

          conversationHistory.push({ role: 'assistant', content: response });

          // Send to caller
          sendSpeech(ws, response);
          break;

        // Call ended
        case 'stop':
          console.log(`📞 Call ended: ${callSid}`);
          conversations.delete(callSid);
          break;
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket closed');
    if (callSid) conversations.delete(callSid);
  });
});

// Helper: Send speech to caller
function sendSpeech(ws, text) {
  ws.send(JSON.stringify({ event: 'text', text: text }));
}

// Simple conversation logic (replace with OpenAI for production)
function generateResponse(userSaid, history) {
  const lower = userSaid.toLowerCase();

  if (lower.includes('yes') && history.length < 4) {
    return "Great! Can you tell me about your experience with React or Node.js?";
  }

  if (lower.includes('react') || lower.includes('node') || lower.includes('javascript')) {
    return "That sounds excellent! How many years of experience do you have?";
  }

  if (lower.match(/\d+\s*year/)) {
    return "Perfect! What's your salary expectation for this role?";
  }

  if (lower.includes('no') && history.length < 4) {
    return "No problem! When would be a better time? Feel free to call us back. Thanks!";
  }

  return "Thanks for sharing! Let me schedule a follow-up call with our hiring manager. Have a great day!";
}

// =============================================================================
// MAKE OUTBOUND CALL
// =============================================================================

app.post('/make-call', async (req, res) => {
  const { phone, name } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  console.log(`📞 Calling ${name || phone}...`);

  try {
    const call = await client.calls.create({
      to: phone,
      from: config.TWILIO_PHONE_NUMBER,
      url: `https://${config.HOSTNAME}/answer`,
      method: 'POST',
      machineDetection: 'DetectMessageEnd'
    });

    console.log(`✅ Call initiated: ${call.sid}`);

    res.json({
      success: true,
      callSid: call.sid,
      message: `Calling ${phone}...`
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// CALL ANSWERED - Connect to WebSocket
// =============================================================================

app.post('/answer', (req, res) => {
  const { CallSid, AnsweredBy } = req.body;
  console.log(`📞 Call ${CallSid} answered by: ${AnsweredBy}`);

  const twiml = new twilio.twiml.VoiceResponse();

  // Voicemail detection
  if (AnsweredBy === 'machine_start') {
    twiml.say('Hi! This is Simon from Twilio. Please call us back. Thanks!');
    return res.type('text/xml').send(twiml.toString());
  }

  // Live person - connect to WebSocket
  const connect = twiml.connect();
  connect.conversationRelay({
    url: `wss://${config.HOSTNAME}/ws`,
    voice: 'Polly.Brian',
    language: 'en-US',
    transcriptionProvider: 'twilio',
    ttsProvider: 'amazon-polly',
    dtmfDetection: false
  });

  console.log(`🎙️ Connected to WebSocket: wss://${config.HOSTNAME}/ws`);

  res.type('text/xml').send(twiml.toString());
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'WebSocket ConversationRelay',
    websocket: `wss://${config.HOSTNAME}/ws`,
    makeCall: {
      method: 'POST',
      url: `/make-call`,
      body: { phone: '+15555551234', name: 'optional' }
    }
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(config.PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 WEBSOCKET CONVERSATIONRELAY SERVER');
  console.log('='.repeat(60));
  console.log(`📡 Server: http://localhost:${config.PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${config.PORT}/ws`);
  console.log(`🌍 Public URL: https://${config.HOSTNAME}`);
  console.log('='.repeat(60));
  console.log('\n📝 To make a test call:\n');
  console.log(`curl -X POST http://localhost:${config.PORT}/make-call \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"phone": "+15555551234", "name": "Test"}'`);
  console.log('\n' + '='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));

// =============================================================================
// DONE! That's it - under 200 lines of code for WebSocket voice AI!
// =============================================================================
