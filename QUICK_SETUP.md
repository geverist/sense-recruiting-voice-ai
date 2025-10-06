# Quick Setup Guide

Get the Sense Recruiting Voice AI running in 15 minutes.

## Prerequisites

- [Twilio Account](https://www.twilio.com/try-twilio) (free trial works)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- Node.js 18+ installed

## Setup Steps

### 1. Clone & Install

```bash
git clone https://github.com/geverist/sense-recruiting-voice-ai.git
cd sense-recruiting-voice-ai/twilio-serverless
npm install
```

### 2. Configure Twilio CLI

```bash
# Install Twilio CLI (if not already installed)
npm install -g twilio-cli

# Login to Twilio
twilio login

# Install Serverless plugin
twilio plugins:install @twilio-labs/plugin-serverless
```

### 3. Get Your Twilio Credentials

Visit [Twilio Console](https://console.twilio.com):
- **Account SID**: Copy from dashboard
- **Auth Token**: Click "Show" and copy
- **Phone Number**: Get one at [Phone Numbers → Buy a Number](https://console.twilio.com/us1/develop/phone-numbers/manage/search)

### 4. Create Twilio Sync Service

```bash
# Create Sync service
twilio api:sync:v1:services:create --friendly-name "Sense Recruiting AI"

# Copy the Service SID (starts with "ZS...")
```

### 5. Create Environment File

```bash
# Copy example file
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

Add your credentials:
```bash
ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AUTH_TOKEN=your_auth_token_here
DEFAULT_TWILIO_NUMBER=+1234567890
TWILIO_SYNC_SVC_SID=ZSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. Deploy to Twilio

```bash
twilio serverless:deploy
```

Copy the domain URL from output (e.g., `https://your-app-1234-dev.twil.io`)

### 7. Open the UI

Visit: `https://your-app-1234-dev.twil.io/advanced.html`

**Done!** 🎉

## Make a Test Call

1. In the UI, enter:
   - **Phone Number**: Your mobile number (E.164 format: +15555551234)
   - **First Name**: Test
   - **Job Title**: Software Engineer
2. Navigate through tabs to configure voice and agent settings
3. Click **Preview** tab
4. Click **🚀 Initiate Screening Call**
5. Answer your phone and talk to Simon!
6. View call history in the **📞 Call History** tab

## Optional: ElevenLabs Voices

1. Sign up at [ElevenLabs](https://elevenlabs.io)
2. Get API key from Settings → API Keys
3. Add to `.env`:
   ```bash
   ELEVENLABS_API_KEY=your_key_here
   ```
4. Redeploy: `twilio serverless:deploy --override-existing-project`

## Troubleshooting

**Call not connecting?**
- Check phone number is in E.164 format (+1234567890)
- Verify Twilio phone number is voice-enabled
- Check Twilio Console → Monitor → Logs for errors

**OpenAI not working?**
- Verify OPENAI_API_KEY is valid
- Check you have billing enabled on OpenAI account
- View function logs: `twilio serverless:logs --service-sid ZSxxx`

**Call History empty?**
- Make at least one test call first
- Click the **🔄 Refresh** button
- Check browser console for JavaScript errors

## Architecture

```
┌─────────────────┐
│   Twilio        │
│   Serverless    │  ← You deploy here
│   Functions     │
└────────┬────────┘
         │
         ├─ /simple-screening-call      (Initiates call)
         ├─ /handle-screening-answer    (TwiML for answering)
         ├─ /ai-process-response        (OpenAI integration)
         ├─ /get-call-history           (Fetch call data)
         └─ /advanced.html              (UI)
```

## Next Steps

- Customize agent personality in **Agent Configuration** tab
- Add custom tools/functions
- Integrate with your ATS (see `docs/GREENHOUSE_INTEGRATION.md`)
- Review compliance features in **Compliance** tab

## Support

- 📚 [Full Documentation](./docs/)
- 🐛 [Report Issues](https://github.com/geverist/sense-recruiting-voice-ai/issues)
- 💬 [Twilio Docs](https://www.twilio.com/docs)
