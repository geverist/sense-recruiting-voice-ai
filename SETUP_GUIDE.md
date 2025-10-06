# Complete Setup Guide - Connect Main App to Serverless

This guide will walk you through connecting your main Express app (with AI conversation logic) to the Twilio Serverless UI.

---

## 🎯 Architecture Overview

```
┌─────────────────────────┐
│ Serverless Admin UI     │  ← Beautiful UI for initiating calls
│ (Twilio CDN)            │
└──────────┬──────────────┘
           │ POST /screen-candidate
           ▼
┌─────────────────────────┐
│ Serverless Functions    │  ← Call routing and status tracking
│ (Twilio Infrastructure) │
└──────────┬──────────────┘
           │ Initiates call via Twilio API
           ▼
┌─────────────────────────┐
│ Candidate's Phone       │  ← Receives the call
│ (Rings...)              │
└──────────┬──────────────┘
           │ Answers
           ▼
┌─────────────────────────┐
│ ConversationRelay       │  ← Twilio's voice relay service
│ (WebSocket)             │
└──────────┬──────────────┘
           │ wss://YOUR-DOMAIN/ws
           ▼
┌─────────────────────────┐
│ Your Main App           │  ← Express + OpenAI + Your Logic
│ (localhost:3333)        │
│ via ngrok tunnel        │
└─────────────────────────┘
```

---

## ✅ Prerequisites

Before starting, make sure you have:

- [x] Twilio Serverless functions deployed
- [x] OpenAI API key
- [x] ngrok account with static domain
- [x] Node.js 18+ installed

---

## 📝 Step-by-Step Setup

### Step 1: Get Your ngrok Static Domain

1. **Sign up for ngrok**:
   ```
   https://dashboard.ngrok.com/signup
   ```

2. **Get your auth token**:
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

3. **Get a free static domain**:
   - Go to: https://dashboard.ngrok.com/domains
   - Copy your domain (e.g., `your-name-12345.ngrok-free.app`)

### Step 2: Update Environment Variables

**In your main app `.env` file:**

```bash
# Update this with your ngrok domain
HOSTNAME=your-name-12345.ngrok-free.app

# Make sure these are set
OPENAI_API_KEY=sk-proj-...
PORT=3333
```

**In your Serverless `.env` file:**

```bash
cd twilio-serverless

# Update HOSTNAME to match your ngrok domain
HOSTNAME=your-name-12345.ngrok-free.app
```

Then redeploy Serverless:
```bash
twilio serverless:deploy --force
```

### Step 3: Start Your Main App

Open **Terminal 1**:

```bash
cd sense-recruiting-voice-ai
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3333
📡 WebSocket endpoint: ws://localhost:3333/ws
🌍 Public URL: https://your-name-12345.ngrok-free.app
```

### Step 4: Start ngrok Tunnel

Open **Terminal 2**:

```bash
npm run grok
```

**Expected output:**
```
🚇 Starting ngrok tunnel to localhost:3333...
📡 Domain: your-name-12345.ngrok-free.app

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://your-name-12345.ngrok-free.app -> http://localhost:3333
```

✅ **Your WebSocket is now publicly accessible!**

### Step 5: Test the Connection

Open **Terminal 3**:

```bash
# Test WebSocket connectivity
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: your-name-12345.ngrok-free.app" \
  -H "Origin: https://your-name-12345.ngrok-free.app" \
  https://your-name-12345.ngrok-free.app/ws
```

**Expected response:**
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

✅ **WebSocket is working!**

---

## 🚀 Make Your First AI Call

### Open the Advanced UI

```
https://sense-recruiting-voice-ai-serverless-4437-dev.twil.io/advanced.html
```

### Configure Your Call

**Tab 1: Candidate Info**
- Candidate ID: `550e8400-e29b-41d4-a716-446655440000`
- First Name: Your name
- Phone: Your phone number (E.164: `+15555551234`)
- Job Title: `Senior Software Engineer`

**Tab 2: Agent Configuration**
- Click "📋 Screening Agent" preset
- Or write your own prompt
- **Toggle "Stateful" mode** to enable conversation memory

**Tab 3: Voice Settings**
- Voice Provider: Amazon Polly
- Voice: Joanna (Female, US)
- Language: en-US

**Tab 4: LLM Configuration**
- Provider: OpenAI
- Model: gpt-4o-mini (recommended)
- Temperature: 0.7

**Tab 5: Knowledge Base**
- (Optional) Add company docs

**Tab 6: Tools**
- Check: recordAnswer, updateScore, concludeScreening

**Tab 7: Preview & Launch**
- Review configuration
- Click **"🚀 Initiate Screening Call"**

---

## 📞 What Happens When You Call

1. **Serverless Function** initiates call via Twilio API
2. **Your phone rings** 📱
3. **You answer** → Twilio detects live person (not voicemail)
4. **ConversationRelay connects** to your WebSocket (`wss://your-domain/ws`)
5. **Your Express app receives** connection event
6. **AI sends greeting**: "Hi [Name]! This is Simon from Twilio..."
7. **You respond** → Twilio transcribes your speech → Sends to your app
8. **Your app calls OpenAI** with your configuration
9. **OpenAI responds** → Your app sends back to Twilio
10. **Twilio speaks** the AI's response to you
11. **Conversation continues** (stateful if enabled - AI remembers context!)

---

## 🔍 Monitor the Conversation

### In Terminal 1 (Main App):
```
[INFO] relay-event Event: start
[SUCCESS] relay-start ConversationRelay started for call CA123...
[INFO] transcript User: Yes, I'm interested!
[INFO] ai-response AI: Brilliant! Can you tell me about your experience...
```

### In ngrok Web Interface:
```
http://127.0.0.1:4040
```
See all WebSocket messages in real-time!

### In Twilio Console:
```
https://console.twilio.com/us1/monitor/logs/calls
```
See call recordings and transcripts

---

## 🎛️ Stateful vs Stateless Comparison

### **Stateless Mode** (Default)
```
User: "I have 5 years of React experience"
AI: "That's great! What about Node.js?"
User: "3 years"
AI: "Excellent! What salary range are you targeting?"
```
❌ AI doesn't remember "React experience" answer

### **Stateful Mode** (Memory Enabled)
```
User: "I have 5 years of React experience"
AI: "That's great! What about Node.js?"
User: "3 years"
AI: "Excellent! So with 5 years of React and 3 years of Node, you're well-qualified. What salary range are you targeting?"
```
✅ AI remembers and references previous answers!

---

## 🐛 Troubleshooting

### Problem: "An application error has occurred"

**Check 1: Is your main app running?**
```bash
curl http://localhost:3333/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Check 2: Is ngrok running?**
```bash
curl https://your-name-12345.ngrok-free.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

**Check 3: Is HOSTNAME set in Serverless?**
```bash
cd twilio-serverless
cat .env | grep HOSTNAME
# Should show: HOSTNAME=your-name-12345.ngrok-free.app
```

If not, update and redeploy:
```bash
echo "HOSTNAME=your-name-12345.ngrok-free.app" >> .env
twilio serverless:deploy --force
```

---

### Problem: "WebSocket connection failed"

**Check ngrok web interface:**
```
http://127.0.0.1:4040
```

Look for:
- HTTP 101 (WebSocket upgrade successful) ✅
- HTTP 400/404 (WebSocket upgrade failed) ❌

**Check Twilio logs:**
```
https://console.twilio.com/us1/monitor/logs/debugger
```

---

### Problem: "OpenAI API key invalid"

**Test your key:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

Should list available models. If error, create new key:
```
https://platform.openai.com/api-keys
```

---

## 🎯 Success Checklist

Before sharing with workshop participants:

- [ ] Main app starts without errors
- [ ] ngrok tunnel connects successfully
- [ ] WebSocket health check passes
- [ ] Made test call and heard AI greeting
- [ ] AI responded to your speech
- [ ] Conversation flowed naturally
- [ ] Stateful mode remembers context (if enabled)
- [ ] Call recorded in Twilio Console
- [ ] Twilio Sync document updated

---

## 📚 Next Steps

### For Workshop Participants:

**Option A: Serverless Only** (Simplest)
- Use the simple UI with scripted message
- No local development needed

**Option B: Full Stack** (Advanced)
- Clone the repo
- Set up ngrok
- Configure environment
- Run main app + ngrok
- Full AI conversations with OpenAI

### For Production:

1. **Deploy main app** to cloud (Heroku, AWS, Railway)
2. **Update HOSTNAME** to production domain
3. **Add authentication** to admin UI
4. **Enable ATS sync** (Greenhouse integration)
5. **Add analytics** and monitoring
6. **Scale** based on call volume

---

## 🆘 Need Help?

- **Check logs**: Terminal 1 (main app) and ngrok web UI
- **Review Twilio Console**: Call logs and debugger
- **Test components**: WebSocket, OpenAI API, Twilio credentials
- **Workshop support**: [Your support channel]

---

## 🎉 You're Ready!

Your complete AI recruiting voice assistant is now live:

✅ Beautiful admin UI (Serverless)
✅ Intelligent call routing (Serverless Functions)
✅ AI conversation engine (Your main app + OpenAI)
✅ Stateful memory (Session store)
✅ Full configuration control (Voice, LLM, tools, knowledge base)

**Make a test call and experience the magic!** 🎙️✨
