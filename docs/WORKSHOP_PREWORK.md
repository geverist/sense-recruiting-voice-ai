# Workshop Pre-Work Guide
## AI-Powered Recruiting Voice Assistant with Twilio

**Welcome!** 👋 You're about to build an intelligent voice AI that can conduct phone screenings, **schedule interviews with recruiters**, and have natural conversations with candidates—just like Retell.ai, but fully customizable and open-source.

**Time to complete:** 45-60 minutes
**Difficulty:** Beginner-friendly (we'll guide you through everything!)

---

## 📚 What You'll Learn

By the end of this workshop, you'll have:

✅ A working AI voice assistant that makes **real phone calls**
✅ **Calendar scheduling** that books interviews with recruiters
✅ **SMS confirmations** sent automatically after scheduling
✅ Customizable prompts, voices, and conversation flows
✅ Real-time transcription with **sentiment analysis**
✅ Your own admin dashboard to manage calls
✅ Full control over the AI's personality and behavior

**No ML/AI experience needed!** If you can copy-paste and follow instructions, you're ready. 🚀

---

## 🎓 Background Reading (Optional but Recommended - 15 min)

Before diving in, familiarize yourself with these Twilio features:

### **Twilio ConversationRelay** (10 min read)
ConversationRelay is Twilio's real-time voice AI infrastructure—it handles the bidirectional audio streaming between phone calls and your AI.

📖 **Read:** [ConversationRelay Documentation](https://www.twilio.com/docs/voice/conversation-relay)

**Key concepts:**
- **Real-time voice streaming** - Low-latency audio between caller and AI
- **WebSocket connection** - Your app receives transcripts and sends AI responses
- **Voice customization** - Choose from 100+ voices (Amazon Polly, Google, ElevenLabs)

### **Conversational Intelligence** (5 min read)
Twilio's AI-powered analytics that provides real-time insights during calls.

📖 **Read:** [Conversational Intelligence Overview](https://www.twilio.com/docs/conversational-intelligence)

**What it does:**
- **Real-time transcription** - Converts speech to text instantly
- **PII redaction** - Automatically removes sensitive data (SSNs, credit cards)
- **Sentiment analysis** - Detects if caller is happy, frustrated, confused
- **Entity extraction** - Identifies names, companies, dates, locations

📖 **Setup Guide:** [Conversational Intelligence Onboarding](https://www.twilio.com/docs/conversational-intelligence/onboarding#create-an-intelligence-service)

---

## 🛠️ Pre-Workshop Setup (Complete BEFORE Workshop Day)

### ✅ Checklist Overview

- [ ] **Step 1:** Create Twilio account & get phone number (15 min)
- [ ] **Step 2:** Get OpenAI API key (5 min)
- [ ] **Step 3:** Set up Google Calendar (Optional - 10 min)
- [ ] **Step 4:** Create ElevenLabs account for premium voices (Optional - 5 min)
- [ ] **Step 5:** Install required tools (10 min)
- [ ] **Step 6:** Clone and deploy the repository (15 min)
- [ ] **Step 7:** Test your deployment (5 min)
- [ ] **Step 8:** Configure Conversational Intelligence (5 min)

**Total time:** ~75 minutes (60 min without optional items)

---

## 📋 Step 1: Create Twilio Account & Get Phone Number

### 1.1 Sign Up for Twilio

**Go to:** https://www.twilio.com/try-twilio

1. Click **"Sign up"**
2. Fill in your information
3. Verify your email
4. Verify your phone number (Twilio will send you a code)

**Free Trial Credits:** You'll get **$15 in free credits** to test with! 💰

### 1.2 Upgrade Your Account (Recommended)

Trial accounts have limitations (can only call verified numbers). To call any phone number:

1. Go to: https://console.twilio.com/us1/billing
2. Add a credit card (**no charge yet**, pay-as-you-go)
3. This removes trial restrictions

**Cost estimate:** ~$0.03/minute for calls (screening call = ~$0.15)

### 1.3 Get Your Account Credentials

You'll need these later:

1. Go to: https://console.twilio.com
2. Click **"Account Info"** (top right)
3. Copy and save these three values:

```
Account SID: AC... (starts with AC)
Auth Token: (click to reveal and copy)
```

📋 **Save these somewhere safe—you'll need them in Step 5!**

### 1.4 Purchase a Phone Number

Your AI needs a phone number to make outbound calls:

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Select **Country:** United States (or your country)
3. Check **"Voice"** and **"SMS"** capabilities
4. Click **"Search"**
5. Click **"Buy"** next to any number you like

**Cost:** $1.15/month (included in free trial credits!)

📋 **Copy your phone number** (format: +15555551234)

---

## 📋 Step 2: Get OpenAI API Key

Your AI uses OpenAI's GPT models to generate intelligent responses.

### 2.1 Sign Up for OpenAI

**Go to:** https://platform.openai.com/signup

1. Create an account (or log in if you have one)
2. Verify your email

### 2.2 Add Payment Method

OpenAI requires a payment method (even for small usage):

1. Go to: https://platform.openai.com/account/billing/overview
2. Click **"Add payment method"**
3. Add a credit card

**Cost estimate:** ~$0.002 per screening call (GPT-4o-mini). **Very cheap!** 💸

### 2.3 Create API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"+ Create new secret key"**
3. Name it: `Recruiting Voice AI`
4. Click **"Create secret key"**
5. **Copy the key immediately** (starts with `sk-proj-...`)

⚠️ **Important:** You can only see this key once! Save it securely.

📋 **Save your API key—you'll need it in Step 5!**

---

## 📋 Step 3: Set up Google Calendar (Optional but Recommended)

Enable your AI to **schedule interviews with recruiters**! This step is optional but makes your AI much more powerful.

### 3.1 Create a Google Cloud Project

**Go to:** https://console.cloud.google.com/

1. Click **"Select a project"** → **"New Project"**
2. Name: `Recruiting Voice AI`
3. Click **"Create"**

### 3.2 Enable Google Calendar API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for: `Google Calendar API`
3. Click on it → Click **"Enable"**

### 3.3 Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: `Recruiting Voice AI`
   - Support email: Your email
   - Click **"Save and Continue"** through all steps
4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: `Recruiting Voice AI`
   - Authorized redirect URIs: `http://localhost:3333/auth/google/callback`
   - Click **"Create"**

5. **Copy and save:**
   - Client ID (looks like: `123456-abc.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123`)

📋 **Save these—you'll need them in Step 5!**

### 3.4 Create a Recruiter Calendar

1. Go to: https://calendar.google.com
2. Create a new calendar called **"Recruiter Availability"**
3. Add some free slots (e.g., tomorrow 2-4pm, Friday 10am-12pm)
4. Copy the Calendar ID:
   - Click the calendar name → Settings
   - Scroll to **"Integrate calendar"**
   - Copy **Calendar ID** (looks like: `abc123@group.calendar.google.com`)

📋 **Save the Calendar ID—you'll need it in Step 5!**

**💡 Why this matters:** Your AI will check this calendar for open slots and book interviews automatically!

---

## 📋 Step 4: Create ElevenLabs Account (Optional but Recommended)

**Want ultra-realistic AI voices?** ElevenLabs provides the most human-sounding voices available—far superior to standard TTS providers.

### 4.1 Sign Up for ElevenLabs

**Go to:** https://elevenlabs.io/sign-up

1. Click **"Get Started Free"**
2. Sign up with email or Google
3. Verify your email

**Free Tier Includes:**
- 10,000 characters per month (~5-10 recruiting calls)
- Access to all 11 premium voices
- No credit card required!

### 4.2 Get Your API Key

1. Log in to: https://elevenlabs.io
2. Click your profile icon (top right) → **"Profile"**
3. Go to **API Keys** tab
4. Click **"+ Create API Key"**
5. Name it: `Recruiting Voice AI`
6. Click **"Create"**
7. **Copy the API key immediately** (starts with a random string like `c5b96792...`)

⚠️ **Important:** Save this key securely. You'll need it in Step 6!

📋 **Save your ElevenLabs API key**

### 4.3 Why ElevenLabs?

**Standard voices (Amazon Polly, Google TTS):**
- ✅ Free with Twilio
- ✅ Reliable
- ❌ Slightly robotic
- ❌ Limited emotional range

**ElevenLabs voices:**
- ✅ **Ultra-realistic** - sound completely human
- ✅ Natural pauses, intonation, emotion
- ✅ Perfect for candidate experience
- ✅ 11 voices with distinct personalities
- ❌ Costs ~$0.30 per 1,000 characters (very affordable)

**💡 Pro Tip:** Use ElevenLabs for your final candidate-facing calls. The improved candidate experience is worth the small cost!

### 4.4 Voice Recommendations

**For Professional Recruiting:**
- **Rachel** (Female, US) - Calm, professional, trustworthy
- **Antoni** (Male, US) - Warm, well-rounded, approachable

**For Executive Recruiting:**
- **Josh** (Male, US) - Deep, authoritative, commanding
- **Daniel** (Male, British) - Deep, authoritative, sophisticated

**For Tech/Startup Recruiting:**
- **Sam** (Male, US) - Youthful, dynamic, energetic
- **Bella** (Female, US) - Soft, pleasant, friendly

**For Traditional/Corporate:**
- **Adam** (Male, US) - Deep, mature, classic professionalism
- **Charlotte** (Female, British) - Professional, elegant

**🎧 Preview voices:** https://elevenlabs.io/voice-library

### 4.5 Cost Estimate

**Free tier:** 10,000 characters/month
- Average screening call: ~1,500 characters
- **You get: 6-7 free calls per month**

**Paid plans** (if you need more):
- **Starter:** $5/month = 30,000 characters (~20 calls)
- **Creator:** $22/month = 100,000 characters (~65 calls)
- **Pro:** $99/month = 500,000 characters (~330 calls)

**For workshop:** Free tier is perfect! ✅

---

## 📋 Step 5: Install Required Tools

### 4.1 Install Node.js

**Check if you already have it:**
```bash
node --version
```

If you see `v18.x.x` or higher, **skip to 4.2**. Otherwise:

**Download:** https://nodejs.org/en/download/

- Click **"LTS"** (recommended)
- Install for your operating system
- Restart your terminal after installation

**Verify:**
```bash
node --version
# Should show: v18.x.x or higher
```

### 4.2 Install Git

**Check if you already have it:**
```bash
git --version
```

If you see a version number, **skip to 4.3**. Otherwise:

**Download:** https://git-scm.com/downloads

- Install for your operating system
- Use default settings

**Verify:**
```bash
git --version
# Should show: git version 2.x.x
```

### 4.3 Install Twilio CLI

The Twilio CLI lets you deploy functions from your terminal:

```bash
npm install -g twilio-cli
```

**Verify:**
```bash
twilio --version
# Should show: twilio-cli/x.x.x
```

**Login to Twilio:**
```bash
twilio login
```

Enter your Account SID and Auth Token from Step 1.3.

### 4.4 Install Twilio Serverless Plugin

```bash
twilio plugins:install @twilio-labs/plugin-serverless
```

**Verify:**
```bash
twilio serverless:list
# Should not show any errors
```

---

## 📋 Step 5: Clone and Deploy the Repository

### 5.1 Clone the Repository

Open your terminal and run:

```bash
# Navigate to where you want to store the project
cd ~/Documents  # or wherever you prefer

# Clone the repository
git clone https://github.com/sensehq/sense-recruiting-voice-ai.git

# Navigate into the project
cd sense-recruiting-voice-ai
```

### 5.2 Install Dependencies

```bash
npm install
```

This will take 1-2 minutes. You'll see a progress bar.

### 5.3 Configure Serverless Environment

Navigate to the Serverless directory:

```bash
cd twilio-serverless
```

Copy the example environment file:

```bash
cp .env.example .env
```

Open the `.env` file in your text editor:

```bash
# macOS/Linux
nano .env

# Windows
notepad .env
```

**Fill in your credentials** from Steps 1-3:

```bash
# Twilio Account Credentials
ACCOUNT_SID=AC...                         # From Step 1.3
AUTH_TOKEN=...                            # From Step 1.3
TWILIO_ACCOUNT_SID=AC...                  # Same as ACCOUNT_SID
TWILIO_AUTH_TOKEN=...                     # Same as AUTH_TOKEN

# Twilio Resources
DEFAULT_TWILIO_NUMBER=+15555551234        # From Step 1.4

# Google Calendar (if you set it up in Step 3)
GOOGLE_CALENDAR_CLIENT_ID=123-abc.apps... # From Step 3.3
GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-...  # From Step 3.3
GOOGLE_CALENDAR_ID=abc@group.calendar...  # From Step 3.4

# Your Main Application WebSocket URL (leave default for now)
HOSTNAME=your-domain.ngrok-free.app
```

**Save the file:**
- nano: Press `Ctrl+X`, then `Y`, then `Enter`
- notepad: File → Save

### 5.4 Deploy to Twilio

Still in the `twilio-serverless` directory:

```bash
npm install
twilio serverless:deploy
```

⏳ **This will take 30-60 seconds.** You'll see:

```
✔ Serverless project successfully deployed

Domain: https://sense-recruiting-voice-ai-XXXX-dev.twil.io
Service:
   sense-recruiting-voice-ai-serverless (ZS...)
Functions:
   [public] https://...twil.io/screen-candidate
   [public] https://...twil.io/outbound-call-answer
   [public] https://...twil.io/call-status
   [public] https://...twil.io/recording-status
Assets:
   https://...twil.io/index.html
   https://...twil.io/advanced.html
```

🎉 **Success!** Your admin UI is now live.

📋 **Copy the Assets URLs** (you'll need these in Step 6)

---

## 📋 Step 6: Test Your Deployment

### 6.1 Open Your Admin Dashboard

From the deployment output, copy the `advanced.html` URL and open it in your browser:

```
https://sense-recruiting-voice-ai-XXXX-dev.twil.io/advanced.html
```

You should see a beautiful purple gradient interface! 💜

### 6.2 Test a Call (Simple Mode)

**Note:** For now, the AI will just leave a pre-recorded message. We'll enable full conversations in the workshop!

1. **Tab 1: Candidate Info**
   - Candidate ID: `test-123`
   - First Name: Your name
   - Phone: Your phone number (E.164 format: `+15555551234`)
   - Job Title: `Software Engineer`

2. Click **"Next: Agent Configuration →"** (you can skip customization for now)

3. Keep clicking "Next" through all tabs until you reach **"Preview"**

4. Click **"🚀 Initiate Screening Call"**

📱 **Your phone should ring!** Answer it and you'll hear a message from "Simon the Recruiter."

✅ **If you got the call, your deployment works!** 🎉

---

## 📋 Step 7: Configure Conversational Intelligence (Optional but Recommended)

Conversational Intelligence gives you **real-time transcription, sentiment analysis, and PII redaction**—essential for production recruiting calls!

### 7.1 Navigate to Main Project Directory

```bash
cd ..  # Go back to main project directory (sense-recruiting-voice-ai)
```

### 7.2 Configure Main App Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and add your credentials:

```bash
nano .env  # or use your preferred editor
```

**Fill in:**
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC...          # From Step 1.3
TWILIO_AUTH_TOKEN=...              # From Step 1.3
DEFAULT_TWILIO_NUMBER=+1555...     # From Step 1.4

# OpenAI Configuration
OPENAI_API_KEY=sk-proj-...         # From Step 2.3

# Google Calendar (if configured)
GOOGLE_CALENDAR_CLIENT_ID=...     # From Step 3.3
GOOGLE_CALENDAR_CLIENT_SECRET=... # From Step 3.3
GOOGLE_CALENDAR_ID=...            # From Step 3.4
```

Save the file.

### 7.3 Create Intelligence Service

Run the automated setup:

```bash
npm run setup:intelligence
```

**Expected output:**
```
🧠 Setting up Twilio Conversational Intelligence...

Creating Intelligence Service...
✅ Intelligence Service created: GAxxxxxxxxxxxxx

📝 Next Steps:

1. Add to your Serverless .env file:
   INTELLIGENCE_SERVICE_SID=GAxxxxxxxxxxxxx

2. Redeploy Serverless functions:
   cd twilio-serverless
   twilio serverless:deploy --force
```

### 7.4 Add to Serverless Environment

Copy the Intelligence Service SID from the output above.

```bash
cd twilio-serverless
nano .env
```

Add this line at the bottom:
```bash
INTELLIGENCE_SERVICE_SID=GAxxxxxxxxxxxxx  # Use YOUR SID from above
```

Save and redeploy:
```bash
twilio serverless:deploy --force
```

🎉 **Conversational Intelligence is now active!** You'll get:
- Real-time transcription
- Sentiment analysis
- PII redaction
- Entity extraction

---

## 🎨 Understanding Your AI (Read Before Workshop!)

Now comes the fun part—making the AI your own! Here's what each configuration option does:

### **📋 Tab 1: Candidate Info**

Who you're calling:
- **Candidate ID**: Unique identifier
- **First Name**: AI uses this for personalization ("Hi Sarah!")
- **Phone Number**: Must be E.164 format (+15555551234)
- **Job Title**: AI mentions this in the call

---

### **🤖 Tab 2: Agent Configuration**

**This is where you teach your AI how to talk!**

#### **Prompt Mode: Stateless vs Stateful**

**Stateless:**
- Each response is independent
- ✅ Faster, cheaper
- ❌ AI doesn't remember earlier parts of conversation

**Stateful (Recommended):**
- AI remembers entire conversation
- Can reference earlier answers
- ✅ More natural, context-aware
- Example: "So with 5 years of React and 3 years of Node, you're well-qualified..."

#### **System Prompt**

This is your AI's "personality and instructions." Pre-built templates:

1. **📋 Screening Agent** - Asks about qualifications
2. **📅 Scheduling Agent** - **Books interviews with recruiters!**
3. **✅ Reference Check Agent** - Conducts reference checks
4. **😊 Casual Tone** - Relaxed, friendly
5. **🎩 Formal Tone** - Professional, corporate

**Example Scheduling Prompt:**
```markdown
You are Alex, a scheduling assistant for Tesla.

Your Goal:
Schedule a follow-up interview with our recruiting team after the candidate completes their phone screen.

Conversation Flow:
1. "Great screening, {{firstName}}! I'd love to get you on the calendar with our team."
2. Use the checkAvailability tool to find open slots
3. "I see we have Tuesday at 2pm or Thursday at 10am. Which works better?"
4. Use scheduleInterview tool to book the slot
5. "Perfect! I'm booking you for [date/time]. You'll get a calendar invite and SMS confirmation."
6. Use sendSMS tool to send confirmation

Rules:
- Offer 2-3 time options
- Confirm timezone
- Send SMS confirmation immediately after booking
```

**Variables:**
- `{{firstName}}` - Candidate's name
- `{{jobTitle}}` - Job title
- `{{agentName}}` - AI's name
- `{{companyName}}` - Your company

---

### **🎤 Tab 3: Voice Settings**

Make your AI sound perfect!

**Voice Providers:**
- Amazon Polly (default, 100+ voices)
- Google TTS (natural-sounding)
- ElevenLabs (ultra-realistic)

**Popular voices:**
- **Joanna** (Female, US) - Clear, professional
- **Matthew** (Male, US) - Authoritative
- **Amy** (Female, British) - Elegant
- **Brian** (Male, British) - Professional British

**💡 Pro Tip:** Use 1.0x - 1.1x speech rate for most natural sound.

---

### **🧠 Tab 4: LLM Configuration**

Control the AI's "brain"!

**Recommended Model:** **GPT-4o-mini** ⭐
- Fast, cheap ($0.002/call)
- High quality
- Perfect for recruiting

**Temperature:** 0.5-0.7 (balanced)
**Max Tokens:** 100-150 (2-3 sentences, perfect for phone calls)

---

### **📚 Tab 5: Knowledge Base**

Give your AI access to company information!

**Example knowledge sources:**
```
Title: Interview Process FAQ
URL: https://company.com/careers/interview-faq

Title: Benefits Overview
URL: https://docs.google.com/document/d/abc123

Title: Team Bios
URL: https://company.com/about/team
```

The AI will reference these docs when answering candidate questions!

---

### **🛠️ Tab 6: Tools & Functions**

Give your AI superpowers!

**Default Tools (Always enabled):**
✅ **recordAnswer** - Save responses to database
✅ **updateCandidateScore** - Rate engagement (0-10)
✅ **concludeScreening** - Finish screening

**Scheduling Tools (Enable for interview scheduling):**
✅ **checkAvailability** - Query Google Calendar for open slots
✅ **scheduleInterview** - Book calendar event
✅ **sendSMS** - Send confirmation text

**How scheduling works:**

1. Candidate passes screening
2. AI says: "Let me check our calendar..."
3. AI calls `checkAvailability()` tool
4. Tool queries Google Calendar API
5. Returns: `["Tuesday 2pm", "Thursday 10am", "Friday 3pm"]`
6. AI offers options: "I see we have Tuesday at 2pm or Thursday at 10am. Which works better?"
7. Candidate chooses: "Thursday at 10am"
8. AI calls `scheduleInterview(datetime="Thursday 10am", candidate="Sarah")` tool
9. Tool creates Google Calendar event
10. Tool invites candidate and recruiter
11. AI calls `sendSMS()` tool
12. Tool sends: "Hi Sarah! Your interview is confirmed for Thursday, Jan 18 at 10am PT. Calendar invite sent to sarah@email.com. See you then!"

**Example SMS confirmation:**
```
Hi Sarah! 🎉

Your interview for Senior Product Manager at Tesla is confirmed:

📅 Thursday, January 18, 2025
🕐 10:00 AM Pacific Time
⏱️ Duration: 45 minutes
👥 With: Alex Chen, Hiring Manager

You'll receive a Google Calendar invite at sarah@email.com.

Need to reschedule? Reply RESCHEDULE.

Good luck!
- Tesla Recruiting Team
```

---

### **👁️ Tab 7: Preview**

Review your entire configuration before making the call. This shows exactly what will be sent to the AI.

---

## 🎯 Workshop Day: What to Expect

### **Hour 1: Full Setup & First AI Call**
- Connect your deployment to the main Express app
- Set up ngrok tunnel for WebSocket
- Make your first **real AI conversation call**
- Test the basic screening flow

### **Hour 2: Add Scheduling & SMS**
- Enable Google Calendar integration
- Configure scheduling tools
- Test end-to-end flow: screening → schedule → SMS confirmation
- Customize prompts for your use case

### **Hour 3: Advanced Features**
- Add Conversational Intelligence for analytics
- View real-time sentiment and transcripts
- Discuss ATS integration (Greenhouse, Lever)
- Production deployment strategies
- Q&A

**By the end:** You'll have a production-ready recruiting voice AI with full scheduling automation! 🎉

---

## ✅ Pre-Workshop Checklist

Before workshop day, make sure you've completed:

- [ ] Created Twilio account and got phone number (with SMS capability)
- [ ] Created OpenAI account and got API key
- [ ] Set up Google Calendar OAuth (optional)
- [ ] Installed Node.js, Git, and Twilio CLI
- [ ] Cloned the repository
- [ ] Deployed to Twilio Serverless successfully
- [ ] Made a test call (heard the pre-recorded message)
- [ ] Set up Conversational Intelligence (optional)
- [ ] Read through the configuration tabs above

**Stuck on any step?** Email us at workshop-support@sensehq.com or join our Slack!

---

## 💡 Pro Tips for Success

### **Before Workshop:**

1. **Test your phone number** - Make sure it has SMS capability
2. **Create test calendar events** - Add some free slots to practice with
3. **Use Google Chrome** - Best compatibility with admin UI
4. **Strong internet** - Required for WebSocket connections
5. **Headphones recommended** - For testing calls

### **During Workshop:**

1. **Ask questions early** - Don't wait!
2. **Test scheduling** - Call yourself and book a fake interview
3. **Share your SMS templates** - We'll have a show-and-tell
4. **Experiment with prompts** - Try different personalities

---

## 🆘 Troubleshooting Common Issues

### **Problem: Calendar integration not working**

**Check:**
1. Did you enable Google Calendar API in Cloud Console?
2. Are your OAuth credentials correct in `.env`?
3. Did you add the redirect URI: `http://localhost:3333/auth/google/callback`?

**Test:**
```bash
npm run dev
# Open: http://localhost:3333/auth/google
# Should redirect to Google OAuth flow
```

---

### **Problem: SMS not sending**

**Check:**
1. Does your Twilio number have SMS capability?
2. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/active
3. Click your number → Check "SMS" is enabled
4. If not, buy a new number with SMS enabled

---

### **Problem: AI can't check calendar**

**In the call, AI says:** "I'm unable to check the calendar right now"

**Solution:**
The `checkAvailability` tool isn't enabled. In advanced UI:
- Go to Tab 6: Tools
- Check ✅ **checkAvailability**
- Check ✅ **scheduleInterview**
- Check ✅ **sendSMS**
- Click "Preview & Launch"

---

## 📞 Need Help?

**Before Workshop:**
- **Email:** workshop-support@sensehq.com
- **Slack:** [Join our workshop Slack]
- **Office Hours:** Wednesday 2-4pm PT (week before workshop)

**During Workshop:**
- Raise your hand—we're here to help!
- Use Slack for quick questions
- Screen share if needed

---

## 🎉 You're Ready!

If you've completed the checklist above, you're all set for an amazing workshop!

**See you soon!** 🚀

---

## 📚 Additional Resources

**Twilio Documentation:**
- ConversationRelay: https://www.twilio.com/docs/voice/conversation-relay
- Conversational Intelligence: https://www.twilio.com/docs/conversational-intelligence
- SMS API: https://www.twilio.com/docs/sms

**Google Calendar API:**
- Quickstart: https://developers.google.com/calendar/api/quickstart/nodejs
- Event creation: https://developers.google.com/calendar/api/v3/reference/events/insert

**OpenAI Documentation:**
- Chat Completions: https://platform.openai.com/docs/guides/chat
- Function Calling: https://platform.openai.com/docs/guides/function-calling

**Sample Prompts:**
- [Screening prompts library]
- [Scheduling conversation flows]
- [SMS templates]

---

**Questions?** We're here to help make this workshop amazing for you! 💜

*Last updated: January 2025*
*Workshop Version: 2.0 (with scheduling & SMS)*
