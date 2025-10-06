# Quick Start - Test Locally

## 🚀 Run This First (Before Workshop)

Test your setup locally **without making any phone calls** to ensure everything works.

### Step 1: Install Dependencies

```bash
cd sense-recruiting-voice-ai
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
```

Fill in these values in `.env`:
```bash
TWILIO_ACCOUNT_SID=ACxxxxx     # From Twilio Console
TWILIO_AUTH_TOKEN=xxxxx         # From Twilio Console (for setup only)
TWILIO_API_KEY=SKxxxxx          # Will be created by setup script
TWILIO_API_SECRET=xxxxx         # Will be created by setup script
DEFAULT_TWILIO_NUMBER=+1xxxxx   # Your Twilio phone number

OPENAI_API_KEY=sk-xxxxx        # From OpenAI Platform

HOSTNAME=your-name.ngrok-free.app  # Your ngrok static domain
```

### Step 3: Run Local Test

```bash
npm run test:local
```

**Expected Output:**
```
[INFO] 🧪 Starting local test...

[INFO] 📋 Step 1: Checking environment variables...
[SUCCESS] ✅ All environment variables present

[INFO] 📋 Step 2: Validating Twilio credentials...
[SUCCESS] ✅ Twilio credentials valid

[INFO] 📋 Step 3: Validating OpenAI API key...
[SUCCESS] ✅ OpenAI API key valid

[INFO] 📋 Step 4: Testing data models...
[SUCCESS] ✅ Candidate model validation passed
[INFO]    Candidate: Justin Smith
[INFO]    Can contact: true

[INFO] 📋 Step 5: Simulating screening conversation...

[INFO] 🤖 AI: Hi Justin! This is Simon from Twilio...
[SUCCESS] 👤 Candidate: Yes, I do!
[INFO] 🤖 AI: Brilliant! Can you tell me about your experience...
[SUCCESS] 👤 Candidate: I have 5 years of experience...
...

✨ Test completed successfully!

🚀 Next steps:
   1. Run: npm run dev
   2. In another terminal: npm run grok
   3. Make a test call to trigger screening
```

### Step 4: What the Test Checks

✅ **Environment Variables** - All required vars are set
✅ **Twilio Auth** - Your Twilio credentials work
✅ **OpenAI Auth** - Your OpenAI API key works
✅ **Data Models** - Candidate validation works
✅ **Conversation Flow** - Simulates a screening call

### ❌ Troubleshooting

**Error: Missing environment variables**
- Check that your `.env` file exists
- Verify all values are filled in (no `xxxxx` placeholders)

**Error: Twilio authentication failed**
- Double-check your Account SID (starts with `AC`)
- Verify Auth Token is correct (32 characters)
- Make sure there are no extra spaces

**Error: OpenAI authentication failed**
- Check your API key starts with `sk-`
- Verify you have credit in your OpenAI account ($5 minimum)
- Try creating a new API key

**Error: Cannot parse candidate**
- This means there's a bug in the code (shouldn't happen)
- Contact workshop support

---

## 📞 Next: Test With Actual Calls (Optional)

Once the local test passes, you can test with real phone calls. **Two options:**

---

### **Option A: Quick Deploy with Twilio Serverless (Recommended)**

Deploy a beautiful admin UI and call routing in one command:

```bash
cd twilio-serverless
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your Twilio credentials

# Deploy to Twilio
twilio serverless:deploy
```

**You'll get a URL like:**
```
✔ Serverless deployment successful!

Service:
   sense-recruiting-voice-ai (ZS...)
Functions:
   https://your-service-XXXX.twil.io/screen-candidate
   https://your-service-XXXX.twil.io/outbound-call-answer
   https://your-service-XXXX.twil.io/call-status
Assets:
   https://your-service-XXXX.twil.io/index.html
```

**Open the Admin UI:**
```
https://your-service-XXXX.twil.io/index.html
```

Fill in the form and click "Start Screening Call" - you'll receive a call instantly!

---

### **Option B: Full Stack Development Setup**

Run the complete application locally with AI logic:

**Step 1: Start the Application**

```bash
# Terminal 1: Start the server
npm run dev
```

Wait for:
```
Server running at http://localhost:3333
Public URL: https://your-domain.ngrok-free.app
```

**Step 2: Start ngrok Tunnel**

```bash
# Terminal 2: Start ngrok
npm run grok
```

Should connect to your static domain.

**Step 3: Trigger a Test Screening Call**

```bash
# Terminal 3: Make an outbound call
curl -X POST http://localhost:3333/screen-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "test-123",
    "phone": "+1YOUR_PHONE_NUMBER",
    "firstName": "Justin",
    "appliedFor": "Senior Software Engineer"
  }'
```

**Replace `+1YOUR_PHONE_NUMBER` with your actual phone number.**

You should receive a call from your Twilio number!

---

## 🎯 What Happens in the Call

1. **AI Answers**: "Hi Justin! This is Simon from Twilio..."
2. **AI Asks Questions**:
   - About your React/Node.js experience
   - Years of experience
   - Salary expectations
   - Remote/hybrid preference
3. **AI Concludes**: "You sound like a great fit!"
4. **Results Logged** to console and (eventually) synced to ATS

---

## 📊 View Call Logs

After the call:

1. **Twilio Console**: https://console.twilio.com/us1/monitor/logs/calls
2. **Local Console**: Check your terminal running `npm run dev`
3. **Recording**: Available in Twilio Console

---

## ✅ Pre-Workshop Checklist

Before the workshop, make sure:

- [ ] `npm run test:local` passes
- [ ] (Optional) Test call works
- [ ] You understand the conversation flow
- [ ] Your `.env` file is configured
- [ ] You've reviewed the workshop agenda

---

## 🆘 Need Help?

- **Workshop Slack**: [link]
- **Email**: workshop-support@sensehq.com
- **Office Hours**: Wednesday 2-3pm PT

**See you at the workshop!** 🎉
