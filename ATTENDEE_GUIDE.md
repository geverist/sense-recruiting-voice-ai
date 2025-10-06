# TalentFlow Workshop - Build AI-Powered Recruiting with Twilio

## 📧 Pre-Workshop Communication for Attendees

**Workshop:** TalentFlow by Sense - AI Recruiting Voice Assistant
**Duration:** 3 Hours
**Date:** [Your Workshop Date]
**Instructor:** [Your Name]

---

## 🎯 What You'll Build

By the end of this hands-on workshop, you'll have built **Simon**, a British AI recruiting assistant that:

- ✅ Makes outbound screening calls to candidates
- ✅ Uses natural conversational AI (via Twilio ConversationRelay + OpenAI)
- ✅ Captures skills, salary expectations, and work preferences
- ✅ Integrates with Segment CDP for candidate tracking
- ✅ Syncs data to Greenhouse ATS
- ✅ Routes qualified candidates to human recruiters in Twilio Flex

**The Problem We're Solving:**
Recruitment teams waste 60-70% of their time on repetitive screening calls. AI automation can handle initial outreach, qualification, and scheduling - freeing recruiters to focus on building relationships with top talent.

**The Solution:**
An end-to-end recruiting engagement platform using:
- **Twilio Voice** - Outbound calling infrastructure
- **ConversationRelay** - Real-time AI conversations
- **OpenAI GPT-4** - Natural language understanding
- **Segment CDP** - Candidate journey tracking
- **Twilio Flex** - Human recruiter handoff
- **Greenhouse ATS** - Applicant tracking

---

## ⏰ Workshop Agenda

### **Hour 1: Setup & Introduction** (0:00 - 1:00)
- **0:00-0:15** Welcome + Demo of complete flow
- **0:15-0:30** Environment setup (Twilio, OpenAI, deploy to Serverless)
- **0:30-0:45** Compliance & Ethics training (EEOC, ADA, forbidden questions)
- **0:45-1:00** ROI Calculator - Calculate your business impact

### **Hour 2: Build Your AI Recruiter** (1:00 - 2:00)
- **1:00-1:20** Customize Simon's personality and interview flow
- **1:20-1:45** Team Competition - Configure different strategies
- **1:45-2:00** Live Calls - Test with real phone calls

### **Hour 3: Production Features** (2:00 - 3:00)
- **2:00-2:15** Real-time Analytics Dashboard
- **2:15-2:30** A/B Testing Framework (test different voices)
- **2:30-2:45** Greenhouse ATS Integration (webhook demo)
- **2:45-3:00** Winner Announcement + Next Steps

---

## 📋 Required Setup (Complete BEFORE Workshop - 60 minutes)

Please complete ALL steps below before attending. This ensures we can start building immediately!

### Step 1: Twilio Account (15 minutes)

1. **Sign up:** https://www.twilio.com/try-twilio
   - Use your work email
   - No credit card required for trial

2. **Verify your phone number**
   - You'll use this for testing calls

3. **Purchase a Twilio phone number:**
   - Console → Phone Numbers → Buy a Number
   - Country: United States
   - Capabilities: Voice ✓ SMS ✓
   - Cost: $1/month (covered by free trial credits)

4. **Get your credentials:**
   - Console → Account → API keys & tokens
   - Copy down:
     - **Account SID** (starts with AC...)
     - **Auth Token** (click to reveal)

5. **Create Sync Service:**
   - Console → Sync → Services → Create
   - Name: "Recruiting Voice AI"
   - Copy the **Service SID** (starts with IS...)

### Step 2: OpenAI API Key (10 minutes)

1. **Sign up:** https://platform.openai.com/signup
   - Use your work email

2. **Add payment method:**
   - Billing → Add payment method
   - **Cost:** ~$5 for entire workshop + testing

3. **Create API key:**
   - API keys → Create new secret key
   - Name: "TalentFlow Workshop"
   - Copy and save immediately (shown only once!)
   - Format: `sk-proj-...`

### Step 3: Install Development Tools (15 minutes)

**Node.js 18+ (Required)**
```bash
# Check if installed:
node --version

# If not installed, download from:
# https://nodejs.org (choose LTS version)
```

**Twilio CLI (Required)**
```bash
# Install:
npm install -g twilio-cli

# Verify:
twilio --version

# Login:
twilio login
# (Enter Account SID and Auth Token from Step 1)
```

**Git (Required)**
```bash
# Check if installed:
git --version

# If not, download from:
# https://git-scm.com/downloads
```

### Step 4: Clone Repository & Install (10 minutes)

```bash
# Clone the repository
git clone https://github.com/your-org/sense-recruiting-voice-ai.git
cd sense-recruiting-voice-ai

# Install dependencies for main app
npm install

# Install dependencies for Twilio Serverless
cd twilio-serverless
npm install
cd ..
```

### Step 5: Configure Environment (10 minutes)

1. **Create .env file in `twilio-serverless/` folder:**

```bash
cd twilio-serverless
cp .env.example .env
```

2. **Edit `.env` file with your credentials:**

```bash
# Twilio Account Credentials
ACCOUNT_SID=AC...your-account-sid...
AUTH_TOKEN=your-auth-token
TWILIO_ACCOUNT_SID=AC...same-as-above...
TWILIO_AUTH_TOKEN=same-as-above

# Twilio Resources
DEFAULT_TWILIO_NUMBER=+1...your-twilio-number...
TWILIO_SYNC_SVC_SID=IS...your-sync-service-sid...

# OpenAI API
OPENAI_API_KEY=sk-proj-...your-openai-key...

# Your main app URL (we'll configure this during workshop)
HOSTNAME=your-domain.ngrok-free.app
```

3. **Save the file**

### Step 6: Deploy to Twilio Serverless (5 minutes)

```bash
# Make sure you're in twilio-serverless folder
cd twilio-serverless

# Deploy
twilio serverless:deploy

# You should see:
# ✔ Serverless project successfully deployed
#
# Your URLs:
# https://your-service-XXXX.twil.io/index.html
# https://your-service-XXXX.twil.io/advanced.html
# ... (and more!)
```

**Save your deployed URL!** You'll need it during the workshop.

---

## ✅ Verify Your Setup

Before the workshop, please verify everything works:

### Test 1: Can you access the UI?
- Open: `https://your-service-XXXX.twil.io/index.html`
- You should see: "TalentFlow - AI Recruiting Assistant"
- **✓ Success!** UI is accessible

### Test 2: Can you access advanced config?
- Open: `https://your-service-XXXX.twil.io/advanced.html`
- You should see tabs: Agent Settings, Voice, LLM, etc.
- **✓ Success!** Advanced UI works

### Test 3: Can you access analytics?
- Open: `https://your-service-XXXX.twil.io/analytics.html`
- You should see: Live Analytics Dashboard
- **✓ Success!** Analytics page loads

### Test 4: Can you access ROI calculator?
- Open: `https://your-service-XXXX.twil.io/roi-calculator.html`
- Try changing input values
- See savings calculate automatically
- **✓ Success!** Calculator works

**If any tests fail:**
1. Check your `.env` file has correct credentials
2. Try redeploying: `twilio serverless:deploy`
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+F5 (Windows)
4. Post in workshop Slack channel for help

---

## 🎓 Optional Enhancements (If you have extra time)

### ElevenLabs Premium Voices (15 minutes - Optional)

Want ultra-realistic voices for Simon? Sign up for ElevenLabs:

1. **Sign up:** https://elevenlabs.io/sign-up
   - Free tier: 10,000 characters/month (~5-7 calls)
   - No credit card required

2. **Get API key:**
   - Profile → API Keys → Create
   - Copy the key

3. **Add to `.env`:**
   ```bash
   ELEVENLABS_API_KEY=your-elevenlabs-key
   ```

4. **Redeploy:**
   ```bash
   twilio serverless:deploy
   ```

**Voices available:**
- Daniel (British Male - Perfect for Simon!)
- Rachel (US Female - Professional)
- Josh (US Male - Authoritative)
- Antoni (US Male - Warm & Friendly)

### Google Calendar Integration (20 minutes - Optional)

Enable Simon to schedule follow-up interviews:

**Setup instructions:** See `docs/GOOGLE_CALENDAR_SETUP.md` (we'll cover this during workshop if time permits)

---

## 📱 What to Bring

- **Laptop** with power adapter
- **Phone** for testing calls (voice + SMS)
- **Headphones** recommended for call testing
- **Questions!** No question is too basic

---

## 💼 What's Included

### Web Applications (8)
- Main screening UI
- Advanced configuration dashboard
- Live analytics with sentiment analysis
- Team competition scoreboard
- ROI calculator
- A/B testing framework
- Compliance & ethics training
- Candidate experience surveys

### Twilio Functions (6)
- Outbound call initiator
- Call routing & ConversationRelay handler
- Call status tracking with auto-surveys
- Recording status handler
- SMS survey sender
- Survey response collector

### Documentation
- Complete setup guide (this document)
- Compliance training materials
- Team competition strategies (6 pre-built configs)
- Greenhouse integration guide
- Golden moments call recording guide

---

## 🏆 Workshop Competition

You'll be divided into teams and compete to build the **best AI recruiter!**

**Judging Criteria (100 points total):**
- Conversation Flow (20 pts) - Natural pacing, smooth transitions
- Voice Quality (20 pts) - Clear, professional, appropriate accent
- Response Time (20 pts) - Low latency, no awkward pauses
- Information Gathering (20 pts) - Asks right questions, captures details
- Candidate Experience (20 pts) - Would you want to work for this company?

**Prize:** Winning team presents their strategy + bragging rights!

---

## 💡 Real-World Business Impact

### ROI Example (You'll calculate yours during workshop!)

**Typical Recruiting Team:**
- Recruiter hourly rate: $45/hr (fully loaded)
- Screening calls per week: 50
- Time per manual call: 15 minutes
- No-show/voicemail rate: 30%

**With AI Automation:**
- Monthly savings: **$6,750**
- Annual savings: **$81,000**
- Hours freed up: **150/month**
- Breakeven: **8 days**
- ROI: **227%**

**AI handles:**
- Initial screening 24/7 (no schedules to coordinate)
- Voicemail messages automatically
- Reference checks
- Scheduling coordination
- Data entry to ATS

**Recruiters focus on:**
- Building relationships with top talent
- Selling company culture
- Strategic hiring decisions
- Closing candidates

---

## ⚖️ Compliance & Legal (Critical!)

We'll cover this in depth during Hour 1, but here's a preview:

### Questions AI Should NEVER Ask:
- ❌ Age or graduation year
- ❌ Marital status or family plans
- ❌ Race, ethnicity, or national origin
- ❌ Religion or religious practices
- ❌ Disabilities or health conditions
- ❌ Genetic information
- ❌ Citizenship (before job offer)

### Questions AI CAN Ask:
- ✅ Work authorization status
- ✅ Relevant skills and experience
- ✅ Salary expectations
- ✅ Availability to start
- ✅ Work schedule preferences
- ✅ Willingness to relocate or travel

**Why This Matters:**
- EEOC violations can cost millions in lawsuits
- NYC Local Law 144 requires annual AI bias audits
- Your company's brand is on the line
- We'll show you how to build compliant AI from day one

---

## 🛠️ Troubleshooting

### "I can't find my Twilio credentials"
- Go to: https://console.twilio.com
- Click "Account" in sidebar
- You'll see Account SID and Auth Token

### "Twilio CLI won't login"
- Make sure you copied Account SID and Auth Token correctly
- Auth Token is hidden - click "Show" to reveal
- Try: `twilio profiles:list` to see if logged in

### "npm install fails"
- Make sure Node.js 18+ is installed: `node --version`
- Try deleting `node_modules/` and `package-lock.json`
- Run `npm install` again

### "Deploy fails with 'unauthorized'"
- Run: `twilio login` again
- Make sure you're in `twilio-serverless/` folder
- Check `.twilio-cli` folder in your home directory exists

### "OpenAI API calls fail"
- Verify API key starts with `sk-proj-`
- Check you added payment method to OpenAI account
- Make sure you have credits: https://platform.openai.com/usage

### "I'm stuck and workshop is tomorrow!"
**Don't panic!** We have backup options:
1. Post in workshop Slack channel (link in welcome email)
2. Email instructor at [your-email]
3. Arrive 30 minutes early for setup help
4. We have pre-configured environments as backup

---

## 📚 Pre-Reading (Optional but Recommended)

Want to come prepared? Check out:

### Quick Reads (10-15 min each)
- [Twilio ConversationRelay Overview](https://www.twilio.com/docs/voice/conversationrelay)
- [Sense Blog: Conversational Voice AI](https://www.sensehq.com/blog/conversational-voice-ai)
- [EEOC: AI and Algorithmic Fairness](https://www.eeoc.gov/ai)

### Videos (5-10 min each)
- [Twilio ConversationRelay Demo](https://www.youtube.com/watch?v=...)
- [Segment CDP for Recruiting](https://segment.com/demos/)

### Our Demo (Watch if you want a preview!)
- [TalentFlow Demo Video](https://your-demo-link.com)

---

## 🎯 Learning Objectives

By the end of this workshop, you will be able to:

### Technical Skills
- ✅ Build production-ready AI voice assistants
- ✅ Integrate Twilio ConversationRelay with OpenAI
- ✅ Configure voice, LLM, and conversation parameters
- ✅ Implement stateful conversation memory
- ✅ Deploy to Twilio Serverless
- ✅ Set up Greenhouse ATS webhooks
- ✅ Track candidates in Segment CDP
- ✅ Route to Flex for human handoff

### Business Skills
- ✅ Calculate ROI for AI recruiting automation
- ✅ Present business case to executives
- ✅ Understand breakeven timeline
- ✅ Measure candidate experience

### Compliance Skills
- ✅ Ensure EEOC/ADA compliance
- ✅ Implement PII redaction
- ✅ Recognize forbidden interview questions
- ✅ Know when to escalate to humans

---

## 🌟 What Makes This Workshop Special

### Not Your Typical "Hello World" Tutorial
- ✅ Production-ready code (6,500+ lines)
- ✅ Real business impact (ROI calculator)
- ✅ Legal compliance built-in
- ✅ Complete end-to-end integration
- ✅ 8 professional web applications
- ✅ Competitive team format (keeps it fun!)

### You'll Leave With
- ✅ Working AI recruiting assistant
- ✅ Code you can deploy Monday morning
- ✅ Business case to present to your team
- ✅ Understanding of legal requirements
- ✅ Network of peers solving similar problems

---

## 📞 Questions Before Workshop?

**Slack Channel:** #talentflow-workshop (link in welcome email)
**Email:** [your-email@company.com]
**Office Hours:** [Day] [Time] (optional drop-in)

---

## 📅 Final Checklist

Please complete by **[Date - 2 days before workshop]:**

- [ ] Twilio account created + phone number purchased
- [ ] OpenAI API key created + payment method added
- [ ] Node.js, Twilio CLI, Git installed
- [ ] Repository cloned + dependencies installed
- [ ] `.env` file configured with credentials
- [ ] Deployed to Twilio Serverless successfully
- [ ] Verified all 4 tests pass
- [ ] (Optional) ElevenLabs account created
- [ ] Joined workshop Slack channel
- [ ] Phone fully charged for workshop day

**Once you've completed all required items, reply to this email with:**
"✅ Ready for TalentFlow Workshop!"

---

## 🚀 See You Soon!

We're excited to have you join us for this hands-on workshop! You're going to build something truly impressive - an AI recruiting assistant that can make real business impact.

**Remember:**
- Complete setup BEFORE workshop (saves us 45 minutes!)
- Bring your phone for testing calls
- Come ready to have fun and learn!

If you get stuck during setup, don't hesitate to reach out. We want everyone starting on Day 1 ready to build!

---

**Workshop Team**
[Your Name & Team]
TalentFlow by Sense

P.S. - The winning competition team gets special recognition (and maybe some swag 😉)
