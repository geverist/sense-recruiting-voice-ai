# Twilio Serverless Deployment

This directory contains Twilio Functions and Assets for easy deployment of the UI and call routing logic.

## 📁 Structure

```
twilio-serverless/
├── functions/              # Twilio Functions (backend API endpoints)
│   ├── screen-candidate.js        # Initiate screening call
│   ├── outbound-call-answer.js    # Handle call answer
│   ├── call-status.js             # Track call lifecycle
│   └── recording-status.js        # Handle recording completion
├── assets/                 # Static assets (served publicly)
│   └── index.html                 # Admin dashboard UI
├── .env.example           # Environment variables template
└── package.json           # Dependencies
```

## 🚀 Quick Start

### 1. Install Twilio CLI

```bash
npm install -g twilio-cli
twilio login
```

### 2. Install Serverless Plugin

```bash
twilio plugins:install @twilio-labs/plugin-serverless
```

### 3. Configure Environment

```bash
cd twilio-serverless
cp .env.example .env
```

Edit `.env` and add:
- `ACCOUNT_SID` - Your Twilio Account SID
- `AUTH_TOKEN` - Your Twilio Auth Token
- `DEFAULT_TWILIO_NUMBER` - Your Twilio phone number
- `TWILIO_SYNC_SVC_SID` - Your Twilio Sync Service SID
- `HOSTNAME` - Your main app domain (e.g., `your-domain.ngrok-free.app`)

### 4. Deploy to Twilio

```bash
cd twilio-serverless
npm install
twilio serverless:deploy
```

This will deploy:
- Functions to handle outbound calls
- Admin dashboard UI at `https://your-service-XXXX.twil.io/index.html`

### 5. Test Locally

```bash
twilio serverless:start
```

Then visit: http://localhost:3000/index.html

## 🎯 How It Works

### Initiating a Screening Call

**Via UI:**
1. Open the admin dashboard: `https://your-service-XXXX.twil.io/index.html`
2. Fill in candidate details
3. Click "Start Screening Call"

**Via API:**
```bash
curl -X POST https://your-service-XXXX.twil.io/screen-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Justin",
    "phone": "+15555551234",
    "jobTitle": "Senior Software Engineer"
  }'
```

### Call Flow

1. **screen-candidate.js** - Initiates outbound call with Twilio API
2. **outbound-call-answer.js** - Handles when call is answered
   - If voicemail: Leaves message
   - If live person: Starts AI conversation via ConversationRelay
3. **call-status.js** - Tracks call lifecycle events
4. **recording-status.js** - Stores recording metadata

### AI Conversation

The ConversationRelay connects to your **main application's WebSocket server** at:
```
wss://HOSTNAME/ws
```

This is where your Express app with the screening agent logic runs (see main repo).

## 🔐 Security

- Functions are **protected** - only callable from your Twilio account
- Assets (like `index.html`) are **public** by default
- To protect the admin UI, add custom authentication in the HTML/JS

## 📊 Monitoring

View logs in Twilio Console:
1. Go to https://console.twilio.com
2. Functions & Assets → Services → Your Service
3. Logs

Or via CLI:
```bash
twilio serverless:logs
```

## 🔄 Architecture

```
┌─────────────┐
│ Admin UI    │
│ (Assets)    │
└──────┬──────┘
       │ POST /screen-candidate
       ▼
┌─────────────────────┐
│ screen-candidate.js │  ← Twilio Function
│ - Validate params   │
│ - Create call       │
│ - Store in Sync     │
└──────┬──────────────┘
       │ Outbound Call
       ▼
┌───────────────────────────┐
│ Candidate's Phone         │
│ (Ringing...)              │
└──────┬────────────────────┘
       │ Answered
       ▼
┌──────────────────────────────┐
│ outbound-call-answer.js      │  ← Twilio Function
│ - Detect voicemail?          │
│ - Start ConversationRelay    │
└──────┬───────────────────────┘
       │ WebSocket
       ▼
┌────────────────────────────────┐
│ Main App (Express + OpenAI)    │  ← Your main application
│ wss://HOSTNAME/ws              │
│ - Screening agent logic        │
│ - OpenAI integration           │
│ - Session management           │
└────────────────────────────────┘
```

## 💡 Benefits

✅ **Easy Deployment** - One command to deploy UI and call routing
✅ **Scalable** - Twilio handles infrastructure
✅ **Cost-Effective** - Pay per execution
✅ **No Server Management** - Fully managed
✅ **Fast CDN** - Assets served globally

## 🔗 Integration with Main App

The Serverless Functions handle:
- Call initiation and routing
- Voicemail detection
- Call status tracking
- Recording management

Your main Express app (in parent directory) handles:
- AI conversation logic (OpenAI integration)
- WebSocket connection
- Session management
- ATS integration

## 📚 Learn More

- [Twilio Functions Docs](https://www.twilio.com/docs/serverless/functions-assets)
- [ConversationRelay Docs](https://www.twilio.com/docs/voice/conversation-relay)
- [Twilio CLI Docs](https://www.twilio.com/docs/twilio-cli)

## 🆘 Troubleshooting

**Problem:** Deployment fails
**Solution:** Make sure you're logged in: `twilio profiles:list`

**Problem:** Functions can't reach main app
**Solution:** Update `HOSTNAME` in `.env` to your ngrok/production domain

**Problem:** Calls not connecting
**Solution:** Check Twilio Console → Debugger for detailed error logs

**Problem:** "Missing required parameters" error
**Solution:** Verify all fields in the form/API call are filled correctly
