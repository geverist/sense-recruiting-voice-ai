# Twilio Serverless Deployment Guide

Complete guide to deploying the Sense Recruiting Voice AI using Twilio Serverless Functions and Assets.

---

## 📖 Overview

This project includes a **Twilio Serverless** deployment option that provides:

✅ **Admin Dashboard UI** - Visual interface to initiate screening calls
✅ **Call Routing Functions** - Handle outbound call initiation and status
✅ **No Server Management** - Fully managed infrastructure by Twilio
✅ **Global CDN** - Fast asset delivery worldwide
✅ **Cost-Effective** - Pay per function execution

---

## 🏗️ Architecture

```
┌──────────────────────┐
│  Admin UI (Asset)    │  ← Deployed to Twilio CDN
│  index.html          │     (https://your-service.twil.io/index.html)
└──────────┬───────────┘
           │ POST /screen-candidate
           ▼
┌──────────────────────────┐
│ Twilio Functions         │  ← Serverless backend
│ - screen-candidate.js    │
│ - outbound-call-answer   │
│ - call-status.js         │
│ - recording-status.js    │
└──────────┬───────────────┘
           │ Initiates call
           ▼
┌──────────────────────────┐
│ Twilio Voice API         │
│ - Places outbound call   │
│ - Detects voicemail      │
│ - Tracks call status     │
└──────────┬───────────────┘
           │ ConversationRelay WebSocket
           ▼
┌──────────────────────────────┐
│ Main Application (Optional)  │  ← Your Express app
│ wss://HOSTNAME/ws            │     (for custom AI logic)
│ - OpenAI integration         │
│ - Session management         │
└──────────────────────────────┘
```

**Two deployment modes:**

1. **Serverless Only** - Functions + UI deployed to Twilio (quick workshop setup)
2. **Hybrid** - Serverless UI + Self-hosted AI logic (production recommended)

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Login to Twilio
twilio login

# Install Serverless plugin
twilio plugins:install @twilio-labs/plugin-serverless
```

### Deploy in 3 Steps

**Step 1: Navigate to serverless directory**

```bash
cd twilio-serverless
```

**Step 2: Configure environment**

```bash
# Copy template
cp .env.example .env

# Edit .env
nano .env
```

Fill in:
```bash
ACCOUNT_SID=ACxxxxxxxxxxxxx
AUTH_TOKEN=xxxxxxxxxxxxxxxx
DEFAULT_TWILIO_NUMBER=+1xxxxxxxxxx
TWILIO_SYNC_SVC_SID=ISxxxxxxxxxxxxx  # Optional: for call tracking
HOSTNAME=your-domain.ngrok-free.app   # Your main app WebSocket URL
```

**Step 3: Deploy**

```bash
npm install
twilio serverless:deploy
```

Expected output:
```
✔ Creating Service
✔ Serverless project successfully deployed

Deployment Details
Domain: https://sense-recruiting-voice-ai-XXXX-dev.twil.io
Service:
   sense-recruiting-voice-ai (ZSxxxxxxxxxxxxx)
Functions:
   [protected] https://...twil.io/screen-candidate
   [protected] https://...twil.io/outbound-call-answer
   [protected] https://...twil.io/call-status
   [protected] https://...twil.io/recording-status
Assets:
   https://...twil.io/index.html
```

**🎉 Done!** Open the Assets URL in your browser.

---

## 🎨 Admin Dashboard Features

The deployed admin UI (`index.html`) provides:

### 1. Screening Call Form
- **Candidate ID**: Unique identifier
- **First Name**: Personalization
- **Phone Number**: E.164 format (+15555551234)
- **Job Title**: Position they applied for

### 2. Recent Calls Tracker
- Shows last 10 calls initiated
- Real-time status updates (initiated, ringing, in-progress, completed)
- Call SID for debugging
- Stored in browser localStorage

### 3. Status Messages
- Success confirmations with Call SID
- Error messages with troubleshooting info

### Screenshots

**Form View:**
```
┌─────────────────────────────────────┐
│ 📞 Initiate Screening Call          │
├─────────────────────────────────────┤
│ Candidate ID: [________________]    │
│ First Name:   [________________]    │
│ Phone Number: [________________]    │
│ Job Title:    [________________]    │
│                                     │
│        [Start Screening Call]       │
│                                     │
│ ✅ Screening call initiated for     │
│    Justin (Call SID: CAxxxxx)       │
└─────────────────────────────────────┘
```

---

## 🔧 Functions Reference

### 1. `screen-candidate.js`

**Purpose**: Initiates outbound screening call

**Input** (JSON):
```json
{
  "candidateId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Justin",
  "phone": "+15555551234",
  "jobTitle": "Senior Software Engineer"
}
```

**Output**:
```json
{
  "success": true,
  "callSid": "CAxxxxxxxxxxxxx",
  "message": "Screening call initiated for Justin"
}
```

**What it does**:
1. Validates input parameters
2. Creates outbound call via Twilio API
3. Stores metadata in Twilio Sync
4. Returns Call SID for tracking

---

### 2. `outbound-call-answer.js`

**Purpose**: Handles when call is answered

**Triggered by**: Twilio when call connects

**Logic**:
```javascript
if (voicemail_detected) {
  // Leave message
  say("Hi {firstName}, this is Simon from recruiting...")
} else {
  // Start AI conversation
  connect.conversationRelay({
    url: "wss://HOSTNAME/ws",
    parameters: { candidateId, firstName, jobTitle }
  })
}
```

**TwiML Output** (live person):
```xml
<Response>
  <Connect>
    <ConversationRelay
      url="wss://your-domain.ngrok-free.app/ws"
      voice="Polly.Joanna"
      language="en-US"
      dtmfDetection="true">
      <Parameter name="candidateId" value="123" />
      <Parameter name="firstName" value="Justin" />
    </ConversationRelay>
  </Connect>
</Response>
```

---

### 3. `call-status.js`

**Purpose**: Tracks call lifecycle events

**Events tracked**:
- `initiated` - Call started
- `ringing` - Phone is ringing
- `in-progress` - Call connected
- `completed` - Call ended
- `failed` / `busy` / `no-answer` - Error states

**What it does**:
1. Receives status webhook from Twilio
2. Updates call metadata in Sync
3. Logs to console for debugging
4. Can trigger additional workflows (e.g., notify ATS)

---

### 4. `recording-status.js`

**Purpose**: Handles call recording completion

**What it does**:
1. Receives recording webhook from Twilio
2. Stores recording URL and duration in Sync
3. (Optional) Can download and archive to S3/GCS for compliance

**Use case**: Required for TCPA compliance and quality assurance

---

## 🔐 Security & Access Control

### Function Protection

By default, Twilio Functions are **protected** - only accessible by:
- Your Twilio account (via API)
- Twilio webhooks
- Direct URL access (if needed)

### Public Assets

Assets (like `index.html`) are **public by default**.

**To add authentication:**

```javascript
// Add to top of index.html <script>
const AUTH_TOKEN = prompt("Enter admin password:");
if (AUTH_TOKEN !== "your-secret-password") {
  document.body.innerHTML = "<h1>Unauthorized</h1>";
}
```

**For production**, implement proper auth:
- Twilio Verify for phone-based auth
- OAuth/SAML for enterprise SSO
- API keys for programmatic access

---

## 📊 Monitoring & Debugging

### View Logs

**Via Twilio Console:**
1. Go to https://console.twilio.com
2. Develop → Functions & Assets → Services
3. Select your service
4. Click "Logs" tab

**Via CLI:**
```bash
twilio serverless:logs
```

### Debug Call Flow

**Twilio Debugger:**
https://console.twilio.com/us1/monitor/logs/debugger

Shows:
- Call initiation
- TwiML responses
- Webhook failures
- API errors

### Monitor Call Status

Check Sync document for real-time status:

```javascript
// Via Twilio Console → Sync → Documents
// Document name: call_{CallSid}

{
  "callSid": "CAxxxxx",
  "candidateId": "550e8400-...",
  "firstName": "Justin",
  "jobTitle": "Senior Software Engineer",
  "status": "in-progress",
  "initiatedAt": "2025-01-15T10:30:00Z",
  "answeredAt": "2025-01-15T10:30:12Z",
  "recording": {
    "sid": "RExxxxx",
    "url": "https://api.twilio.com/...",
    "duration": 247
  }
}
```

---

## 🔄 Updates & Redeployment

### Update Functions

Edit files in `twilio-serverless/functions/`, then:

```bash
twilio serverless:deploy
```

Deployment creates a **new build** - no downtime!

### Update Assets (UI)

Edit `twilio-serverless/assets/index.html`, then:

```bash
twilio serverless:deploy
```

Assets are cached on CDN - may take a few minutes to propagate.

### Environment Variables

Update `.env`, then redeploy:

```bash
# Edit .env
nano .env

# Redeploy
twilio serverless:deploy
```

Environment variables are encrypted at rest.

---

## 💰 Pricing

**Twilio Functions**:
- $0.000025 per invocation (first 10,000/month free)
- $0.00001 per second of execution time (first 10,000 seconds/month free)

**Example Cost** (1,000 screening calls/month):
- `screen-candidate`: 1,000 invocations × $0.000025 = $0.025
- `outbound-call-answer`: 1,000 invocations × $0.000025 = $0.025
- `call-status`: 4,000 invocations (4 events per call) × $0.000025 = $0.10
- **Total**: ~$0.15/month for functions

**Plus**:
- Twilio Voice: $0.013/min per leg (2 legs = $0.026/min)
- Twilio Recording: $0.0025/min
- **Total call cost**: ~$0.10 for 5-min call

---

## 🌍 Production Best Practices

### 1. Use Environment-Specific Deployments

```bash
# Development
twilio serverless:deploy --environment=dev

# Staging
twilio serverless:deploy --environment=staging

# Production
twilio serverless:deploy --environment=production
```

### 2. Enable Error Monitoring

Integrate with external monitoring:

```javascript
// Add to functions
try {
  // ... function logic
} catch (error) {
  // Log to external service
  await fetch('https://your-logging-service.com/errors', {
    method: 'POST',
    body: JSON.stringify({
      service: 'sense-recruiting-voice-ai',
      function: 'screen-candidate',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  });
  throw error;
}
```

### 3. Rate Limiting

Implement rate limiting to prevent abuse:

```javascript
// Use Twilio Sync to track requests
const requests = await syncClient.documents('rate_limit').fetch();
if (requests.data.count > 100) {
  return callback(null, { success: false, error: 'Rate limit exceeded' });
}
```

### 4. Secure Webhooks

Validate Twilio signatures:

```javascript
const twilio = require('twilio');

const requestIsValid = twilio.validateRequest(
  context.AUTH_TOKEN,
  req.headers['x-twilio-signature'],
  `https://${context.DOMAIN_NAME}/screen-candidate`,
  req.body
);

if (!requestIsValid) {
  return callback(null, { success: false, error: 'Invalid signature' });
}
```

---

## 🔗 Integration with Main Application

### Hybrid Architecture (Recommended)

**Serverless handles**:
- UI hosting (admin dashboard)
- Call initiation and routing
- Status tracking
- Recording management

**Main app handles** (Express + OpenAI):
- AI conversation logic
- OpenAI integration
- Complex business logic
- ATS integration

**How they connect**:

1. User clicks "Start Call" on Serverless UI
2. Serverless Function initiates call
3. When answered, ConversationRelay connects to: `wss://HOSTNAME/ws`
4. Main app (Express) handles WebSocket and AI conversation

### Configuration

**Serverless .env**:
```bash
HOSTNAME=your-production-domain.com  # Main app URL
```

**Main app .env**:
```bash
# No changes needed - receives WebSocket connections
```

---

## 🆘 Troubleshooting

### Problem: Deployment fails

**Error**: "Authentication failed"

**Solution**:
```bash
# Check login status
twilio profiles:list

# Re-authenticate
twilio login
```

---

### Problem: Functions can't reach main app

**Error**: "WebSocket connection failed"

**Solution**:
- Verify `HOSTNAME` in Serverless `.env` is correct
- Ensure main app is running and accessible
- Check firewall/security group settings

---

### Problem: Calls not connecting

**Error**: "Unable to create record: The number is unverified"

**Solution**:
- For trial accounts, verify destination phone numbers
- Or upgrade to paid account

---

### Problem: UI shows old version

**Solution**:
- Clear browser cache
- Wait 5-10 minutes for CDN propagation
- Use `?v=timestamp` query param to bust cache

---

## 📚 Additional Resources

- **Twilio Serverless Docs**: https://www.twilio.com/docs/serverless
- **ConversationRelay Guide**: https://www.twilio.com/docs/voice/conversation-relay
- **Twilio CLI Reference**: https://www.twilio.com/docs/twilio-cli
- **Sync API Docs**: https://www.twilio.com/docs/sync

---

## ✅ Deployment Checklist

Before going to production:

- [ ] Environment variables configured for production
- [ ] Error monitoring integrated
- [ ] Rate limiting implemented
- [ ] Webhook signature validation enabled
- [ ] Admin UI authentication added
- [ ] Call recordings archived to long-term storage
- [ ] Tested with production ATS integration
- [ ] Load testing completed
- [ ] Monitoring dashboards configured
- [ ] Incident response plan documented

**Ready to scale!** 🚀
