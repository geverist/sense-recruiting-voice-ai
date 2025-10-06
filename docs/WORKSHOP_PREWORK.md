# Sense Voice AI Workshop - Pre-Work & Prerequisites

## 🎯 Workshop Success Criteria

For attendees to successfully build a working AI recruiting voice agent in 3 hours, they must complete **ALL** pre-work items below **BEFORE** the workshop starts.

⏰ **Estimated Pre-Work Time**: 30-45 minutes

---

## ✅ REQUIRED PRE-WORK (Must Complete Before Workshop)

### 1. Create Twilio Account & Get Phone Number

**Time**: ~10 minutes
**Cost**: Free trial ($15 credit) covers workshop + testing

**Steps**:
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your work email
3. Verify your phone number
4. **Important**: When asked "What do you want to build?", select **"Voice & Video"**
5. After signup, you'll land in the Twilio Console

**Get a Phone Number**:
1. In Twilio Console, go to: **Phone Numbers → Manage → Buy a number**
2. Select your country (US recommended for workshop)
3. Check **"Voice"** capability
4. Click **"Search"**
5. Choose any number and click **"Buy"**
6. ✅ **Write down this number** - you'll need it later

**Get Your Credentials**:
1. Go to: **Account → API keys & tokens**
2. Copy your **Account SID** (starts with `AC...`)
3. Copy your **Auth Token** (click "eye" icon to reveal)
4. ✅ **Save these securely** (paste into a note file)

**Verification**:
- [ ] I have a Twilio phone number
- [ ] I have my Account SID and Auth Token saved

---

### 2. Create OpenAI Account & Get API Key

**Time**: ~5 minutes
**Cost**: $5 minimum deposit (workshop uses ~$2-3)

**Steps**:
1. Go to https://platform.openai.com/signup
2. Sign up with your email
3. Verify your email address
4. **Add Payment Method**:
   - Go to: **Settings → Billing**
   - Click **"Add payment method"**
   - Add credit card and deposit at least $5
5. **Create API Key**:
   - Go to: **API keys** (left sidebar)
   - Click **"Create new secret key"**
   - Name it: `sense-workshop`
   - Click **"Create secret key"**
   - ✅ **Copy the key immediately** (you can't see it again!)
   - Format: `sk-proj-...` (long string)

**Verification**:
- [ ] I have an OpenAI API key starting with `sk-`
- [ ] I have at least $5 credit in my account

---

### 3. Get ngrok Static Domain

**Time**: ~5 minutes
**Cost**: FREE

**Why needed**: Twilio needs a public URL to send webhooks. ngrok creates a tunnel from the internet to your laptop.

**Steps**:
1. Go to https://dashboard.ngrok.com/signup
2. Sign up (Google/GitHub login works)
3. **Get Your Static Domain** (FREE feature):
   - After signup, go to: **Domains → New Domain**
   - Or visit: https://dashboard.ngrok.com/domains/new
   - Click **"Start a tunnel"** → **"Free static domain"**
   - You'll get a domain like: `yourname-unique-12345.ngrok-free.app`
   - ✅ **Copy this domain** (you'll need it for `.env`)
4. **Get Your Auth Token**:
   - Go to: **Your Authtoken** (left sidebar)
   - Copy the authtoken
   - ✅ **Save this** (you'll run `ngrok config add-authtoken YOUR_TOKEN` during workshop)

**Verification**:
- [ ] I have an ngrok static domain (format: `xxxx.ngrok-free.app`)
- [ ] I have my ngrok authtoken

---

### 4. Install Required Software

**Time**: ~10 minutes

#### A. Node.js (v18 or higher)

**Check if already installed**:
```bash
node --version
```

If you see `v18.x.x` or higher, ✅ **skip to next section**

**If not installed or version < 18**:

**Mac**:
```bash
# Using Homebrew (recommended)
brew install node

# Or download from: https://nodejs.org (choose LTS version)
```

**Windows**:
1. Download from: https://nodejs.org (choose LTS version)
2. Run the installer
3. Restart your terminal/command prompt

**Linux**:
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

**Verification**:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### B. Git

**Check if installed**:
```bash
git --version
```

If you see `git version 2.x.x`, ✅ **skip to next section**

**If not installed**:

**Mac**: `brew install git` or download from https://git-scm.com
**Windows**: Download from https://git-scm.com/download/win
**Linux**: `sudo apt-get install git`

**Verification**:
```bash
git --version  # Should show git version 2.x.x
```

#### C. Code Editor (VS Code recommended)

**If you don't have a code editor**:
1. Download VS Code: https://code.visualstudio.com/
2. Install it
3. ✅ You're good!

**Verification**:
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] Code editor ready (VS Code, Sublime, etc.)

---

### 5. Clone Workshop Repository & Install Dependencies

**Time**: ~5 minutes

**Steps**:
```bash
# 1. Clone the repo
git clone https://github.com/sensehq/sense-recruiting-voice-ai.git
cd sense-recruiting-voice-ai

# 2. Install dependencies (this will take 2-3 minutes)
npm install

# 3. Verify installation succeeded
npm run check-setup
```

If you see: ✅ **"Setup check passed! You're ready for the workshop!"** → Great!

If you see errors, check the troubleshooting section below.

**Verification**:
- [ ] Repository cloned successfully
- [ ] `npm install` completed without errors
- [ ] `npm run check-setup` passed

---

### 6. Configure Environment Variables

**Time**: ~5 minutes

**Steps**:
```bash
# 1. Copy the example environment file
cp .env.example .env

# 2. Open .env in your code editor
code .env  # (or use your preferred editor)
```

**Fill in these values** (from steps 1-3 above):

```bash
# Copy from Step 1 (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
DEFAULT_TWILIO_NUMBER=+1234567890

# Copy from Step 2 (OpenAI)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Copy from Step 3 (ngrok)
HOSTNAME=your-unique-name.ngrok-free.app

# Leave these as defaults for workshop
PORT=3333
NODE_ENV=development
```

**Save the file**.

**Verification**:
- [ ] `.env` file exists
- [ ] All 5 required variables are filled in
- [ ] No placeholder text like `ACxxxxx` remains

---

### 7. Test Your Setup

**Time**: ~5 minutes

**Run the setup verification**:
```bash
npm run setup:verify
```

This will test:
- ✅ Twilio credentials are valid
- ✅ OpenAI API key works
- ✅ Phone number is configured
- ✅ All dependencies installed correctly

**Expected output**:
```
🔍 Verifying Twilio credentials...        ✅ PASS
🔍 Verifying OpenAI API key...            ✅ PASS
🔍 Checking phone number...               ✅ PASS (+1234567890)
🔍 Testing dependencies...                ✅ PASS

✨ All checks passed! You're ready for the workshop! ✨
```

**If you see ❌ FAIL**:
- Double-check your `.env` file
- Make sure you copied the full values (no spaces, no quotes)
- See troubleshooting section below

**Verification**:
- [ ] All setup checks passed

---

## 🎓 OPTIONAL (Recommended but not required)

### 8. Familiarize Yourself with Twilio Console

**Time**: 5 minutes

**Why**: You'll be more comfortable during the workshop if you know where things are.

**Quick tour**:
1. Log into Twilio Console: https://console.twilio.com
2. Visit these sections:
   - **Phone Numbers → Manage** (see your number)
   - **Develop → API Keys** (where credentials live)
   - **Monitor → Logs → Calls** (you'll see calls here during workshop)

### 9. Watch ConversationRelay Overview Video

**Time**: 10 minutes

**Optional video**: https://www.twilio.com/docs/voice/conversationrelay

This gives you context on the technology powering the AI agent.

### 10. Review Sample Recruiting Prompts

**Time**: 5 minutes

**File**: Look at `recruiting-agents/screening-agent/instructions/en-US.md`

This shows you what an AI agent prompt looks like. During the workshop, you'll customize this!

---

## 📋 PRE-WORKSHOP CHECKLIST

Print this or keep it open. Check off each item as you complete it:

### Required (Must complete)
- [ ] Twilio account created
- [ ] Twilio phone number purchased
- [ ] Twilio Account SID & Auth Token saved
- [ ] OpenAI account created
- [ ] OpenAI API key created (starts with `sk-`)
- [ ] OpenAI account has $5+ credit
- [ ] ngrok account created
- [ ] ngrok static domain obtained
- [ ] ngrok authtoken saved
- [ ] Node.js v18+ installed
- [ ] Git installed
- [ ] Code editor installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Setup verification passed (`npm run setup:verify`)

### Optional (Recommended)
- [ ] Familiarized with Twilio Console
- [ ] Watched ConversationRelay video
- [ ] Reviewed sample agent prompts

**If ALL required items are checked**, you're ready! 🎉

---

## 🐛 TROUBLESHOOTING

### Issue: "npm install" fails

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install

# If still fails, delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Twilio credentials invalid"

**Solution**:
- Make sure you copied the **entire** Account SID (starts with `AC`, 34 characters)
- Make sure you copied the Auth Token (32 characters)
- No extra spaces before/after the values
- No quotes around the values

### Issue: "OpenAI API key invalid"

**Solution**:
- Make sure key starts with `sk-proj-` or `sk-`
- Copy the full key (very long string)
- Make sure you have credit in your OpenAI account (check Billing)

### Issue: "Port 3333 already in use"

**Solution**:
```bash
# Change port in .env file
PORT=3334  # or any other port
```

### Issue: ngrok not working

**Solution**:
```bash
# Install ngrok globally
npm install -g ngrok

# Add your authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN

# Test it
ngrok http 3333
```

---

## 📞 GET HELP

**If you're stuck on pre-work**:

1. **Check Troubleshooting** section above first
2. **Workshop Slack Channel**: [link to be provided]
3. **Office Hours**: Wednesday 2-3pm PT (day before workshop)
4. **Email**: workshop-support@sensehq.com

**⚠️ IMPORTANT**: Complete pre-work **at least 24 hours before workshop**. This gives you time to get help if needed.

---

## 🚀 DAY-OF-WORKSHOP CHECKLIST

On the day of the workshop, make sure you have:

### Before Workshop Starts (15 min early)
- [ ] Laptop fully charged (or bring charger)
- [ ] Stable internet connection (test by loading twilio.com)
- [ ] Phone nearby (for testing calls)
- [ ] `.env` file with all credentials
- [ ] VS Code (or your editor) open
- [ ] Terminal window open
- [ ] Twilio Console open in browser (logged in)
- [ ] Workshop Slack/chat open

### Have Ready
- [ ] Pen and paper for notes
- [ ] Headphones (recommended for call testing)
- [ ] Water/coffee ☕

### Mental Readiness
- [ ] Excited to build cool AI stuff! 🎉
- [ ] Ready to ask questions
- [ ] Willing to help fellow attendees

---

## 💡 WHAT YOU'LL BUILD

In this 3-hour workshop, you will:

1. ✅ Configure an AI voice agent to call candidates
2. ✅ Customize the agent's personality and questions
3. ✅ Add a custom tool (e.g., check LinkedIn profile)
4. ✅ Test your agent by making real phone calls
5. ✅ View analytics on call performance
6. ✅ Leave with a working prototype you can deploy!

**By the end**, you'll have:
- Working AI recruiting assistant
- Understanding of how to customize agents
- Code you can deploy to production
- Confidence to build more advanced features

---

## 📚 RESOURCES

### Documentation
- Twilio ConversationRelay: https://www.twilio.com/docs/voice/conversationrelay
- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- Repository Docs: `./docs/`

### Support
- Workshop Slack: [link]
- Instructor: [name/email]
- TA: [name/email]

---

**Questions?** Reach out on Slack or email workshop-support@sensehq.com

**See you at the workshop!** 🎉
