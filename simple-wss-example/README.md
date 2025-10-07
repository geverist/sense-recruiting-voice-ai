# Simple WebSocket ConversationRelay Example

**Minimal implementation of outbound calling with AI conversation using Twilio ConversationRelay over WebSocket.**

This is the simplest possible example - just 200 lines of code to make an outbound call and have an AI conversation!

## What It Does

1. **Makes an outbound call** to any phone number
2. **Connects to WebSocket** when call is answered
3. **Has AI conversation** with the person who answers
4. **Uses speech-to-text** (Twilio automatic transcription)
5. **Uses text-to-speech** (Amazon Polly voices)

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Your       │  POST   │   Express    │  wss:// │   Twilio     │
│   Browser    │────────▶│   Server     │◀────────│   Phone Call │
│              │         │   :3000      │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
                              /ws endpoint
                         Simple conversation
                         logic (no OpenAI yet)
```

## Quick Start

### 1. Install Dependencies

```bash
cd simple-wss-example
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
nano .env  # Add your Twilio credentials
```

### 3. Start ngrok (Required for WebSocket)

```bash
# In a separate terminal
ngrok http 3000
```

Copy the ngrok URL (e.g., `abc123.ngrok-free.app`) and add to `.env`:
```bash
HOSTNAME=abc123.ngrok-free.app
```

### 4. Start the Server

```bash
npm start
```

You should see:
```
🚀 Simple WebSocket ConversationRelay Server Started
=====================================
📡 HTTP Server: http://localhost:3000
🔌 WebSocket: ws://localhost:3000/ws
🌍 Public URL: https://abc123.ngrok-free.app
=====================================
```

### 5. Make a Test Call

1. Open browser: http://localhost:3000
2. Enter your phone number (E.164 format: +15555551234)
3. Click "📞 Make Call"
4. Answer your phone and talk to Simon!

## How It Works

### **Step 1: Initiate Call**
Browser → POST `/make-call` → Twilio API creates outbound call

### **Step 2: Call Answered**
Twilio → POST `/answer` → Returns TwiML with `<Connect><ConversationRelay>`

```xml
<Response>
  <Connect>
    <ConversationRelay
      url="wss://your-domain.ngrok-free.app/ws"
      voice="Polly.Brian"
      transcriptionProvider="twilio"
      ttsProvider="amazon-polly"
    />
  </Connect>
</Response>
```

### **Step 3: WebSocket Connection**
Twilio establishes WebSocket connection to `wss://your-domain/ws`

### **Step 4: Conversation Events**

#### **Event: "start"**
- Call connected
- Send initial greeting: "Hi! This is Simon..."

#### **Event: "transcript"**
- User spoke
- Received transcript: "Yes, I have experience"
- Generate response (simple rules for now)
- Send back: `{ event: "text", text: "Great! Tell me more..." }`

#### **Event: "stop"**
- Call ended
- Clean up conversation

## Simple Conversation Logic

Currently uses rule-based responses (no OpenAI):

```javascript
async function generateResponse(userSaid, history) {
  const lower = userSaid.toLowerCase();

  if (lower.includes('yes') && history.length < 4) {
    return "Great! Can you tell me about your experience?";
  }
  // ... more rules
}
```

## Upgrade to OpenAI (Optional)

To add real AI responses, replace `generateResponse()` with:

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateResponse(userSaid, history) {
  const messages = [
    { role: 'system', content: 'You are Simon, an AI recruiter...' },
    ...history
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
    max_tokens: 150
  });

  return completion.choices[0].message.content;
}
```

## File Structure

```
simple-wss-example/
├── server.js           # Main server (200 lines)
├── package.json        # Dependencies
├── .env.example        # Environment template
└── README.md          # This file
```

## API Endpoints

### **POST /make-call**
Initiates an outbound call.

**Body:**
```json
{
  "phone": "+15555551234",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "message": "Call initiated to +15555551234"
}
```

### **POST /answer**
Twilio webhook when call is answered. Returns TwiML.

### **POST /status**
Twilio status callback for call events.

### **WS /ws**
WebSocket endpoint for ConversationRelay.

**Events received:**
- `start` - Call started
- `transcript` - User speech transcribed
- `stop` - Call ended

**Events sent:**
- `text` - AI response to speak to caller

## Testing Tips

1. **Test with your own phone first** - Make sure you answer!
2. **Check ngrok is running** - The public URL must be accessible
3. **Watch the console** - All events are logged
4. **Try different responses** - Say "yes", "no", talk about React

## Common Issues

**"WebSocket connection failed"**
- Make sure ngrok is running
- Verify HOSTNAME in .env matches ngrok URL
- Check ngrok URL doesn't have `https://` prefix in .env

**"Call not connecting"**
- Verify phone number is E.164 format (+1234567890)
- Check Twilio credentials are correct
- Make sure you have a Twilio phone number

**"No response from AI"**
- Check server logs for errors
- Verify WebSocket connection established
- Make sure you're speaking clearly (Twilio transcription)

## Next Steps

Once this works, you can:
- ✅ Add OpenAI for real AI responses
- ✅ Implement function calling (schedule interviews, send SMS)
- ✅ Add Conversational Intelligence (sentiment, PII redaction)
- ✅ Store conversation history in database
- ✅ Integrate with ATS (Greenhouse, Lever)

## Comparison: Simple vs Full App

| Feature | This Example | Full App (main repo) |
|---------|-------------|----------------------|
| Lines of code | 200 | 6,590 |
| AI responses | Rule-based | OpenAI GPT-4o-mini |
| Conversation memory | In-memory Map | SessionStore + Twilio Sync |
| Voice options | Polly.Brian only | 11 ElevenLabs voices |
| Configuration UI | None | Full web UI |
| Tool calling | No | Yes (schedule, SMS, ATS) |
| CI integration | No | Yes (sentiment, PII, entities) |

This example is perfect for understanding the core WebSocket flow before diving into the full implementation!

## Resources

- [Twilio ConversationRelay Docs](https://www.twilio.com/docs/voice/twiml/connect/conversation-relay)
- [ngrok Download](https://ngrok.com/download)
- [Twilio Console](https://console.twilio.com)

## License

MIT
