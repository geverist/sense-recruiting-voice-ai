# Test Locally - Complete Guide

## ✅ You're Ready to Test!

Everything is set up. Here's how to test the system locally before sharing with workshop participants.

---

## 🎯 Testing Steps

### Step 1: Configure Environment

```bash
cd /Users/geverist/Documents/Twilio\ Dev/sense-recruiting-voice-ai

# Copy the template
cp .env.example .env

# Edit .env with your credentials
code .env  # or nano .env, or vim .env
```

Fill in these values:
```bash
# Your Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
DEFAULT_TWILIO_NUMBER=+1234567890

# Your OpenAI API Key
OPENAI_API_KEY=sk-your-key-here

# Your ngrok static domain
HOSTNAME=your-name.ngrok-free.app

# These will be created by setup script (leave blank for now)
TWILIO_API_KEY=
TWILIO_API_SECRET=
TWILIO_SYNC_SVC_SID=
```

### Step 2: Run Local Validation Test

```bash
npm run test:local
```

**This test validates:**
- ✅ All environment variables are set
- ✅ Twilio credentials work
- ✅ OpenAI API key works
- ✅ Data models parse correctly
- ✅ Simulates a screening conversation

**Expected output:**
```
🧪 Starting local test...

📋 Step 1: Checking environment variables...
✅ All environment variables present

📋 Step 2: Validating Twilio credentials...
✅ Twilio credentials valid

📋 Step 3: Validating OpenAI API key...
✅ OpenAI API key valid

📋 Step 4: Testing data models...
✅ Candidate model validation passed
   Candidate: Justin Smith
   Can contact: true

📋 Step 5: Simulating screening conversation...
🤖 AI: Hi Justin! This is Simon from Twilio...
👤 Candidate: Yes, I do!
...

✨ Test completed successfully!
```

If this passes, you're ready for live testing!

---

## 🎬 What's Working So Far

✅ **Project Structure** - All directories created
✅ **Dependencies** - 603 packages installed
✅ **Data Models** - Candidate, Job, Interview, Reference
✅ **ATS Integration** - Greenhouse adapter ready
✅ **Outbound Calling** - Infrastructure ready
✅ **Library Utils** - Logger, templates, E164, etc.
✅ **Documentation** - Workshop materials complete

---

## 🚧 What Still Needs Implementation

For a **fully working prototype**, you need:

1. **Screening Agent** - AI instructions and tools
2. **Main App** - Express server with routes
3. **Twilio Setup Scripts** - Auto-configure Twilio resources
4. **OpenAI Integration** - Conscious loop for LLM
5. **Session Store** - Conversation state management

**Good news**: These can be copied from the original `twilio-agentic-voice-assistant` repo!

---

## 🔄 Quick Migration from Original Repo

To get a working prototype quickly:

```bash
# From the sense-recruiting-voice-ai directory
cd ..

# Copy core components from original repo
cp -r twilio-agentic-voice-assistant/completion-server/* sense-recruiting-voice-ai/core/completion-server/
cp -r twilio-agentic-voice-assistant/agent/* sense-recruiting-voice-ai/recruiting-agents/screening-agent/

# Copy the main app
cp twilio-agentic-voice-assistant/app.ts sense-recruiting-voice-ai/app.ts

# Then customize for recruiting use case
```

**Estimated time**: 2-4 hours to adapt and test

---

## 📞 Testing Strategy

### Phase 1: Validation (No Calls) ✅ DONE
```bash
npm run test:local
```
Tests environment, credentials, and data models.

### Phase 2: Live Call Test (Once app is complete)
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run grok

# Terminal 3
curl -X POST http://localhost:3333/screen-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "test-123",
    "phone": "+1YOUR_PHONE",
    "firstName": "Test",
    "appliedFor": "Software Engineer"
  }'
```

### Phase 3: Workshop Dry Run
- Have a friend test the setup
- Follow the workshop agenda
- Time each section
- Note any issues

---

## 🎓 Before Workshop Launch

**Test these scenarios:**

### Scenario 1: Happy Path
- [ ] Candidate answers call
- [ ] AI conducts screening
- [ ] Questions answered successfully
- [ ] Results saved/logged
- [ ] Candidate receives thank you

### Scenario 2: Voicemail
- [ ] Call goes to voicemail
- [ ] AI leaves appropriate message
- [ ] System marks as voicemail
- [ ] Retry scheduled

### Scenario 3: No Answer
- [ ] Call times out
- [ ] System marks as no-answer
- [ ] Retry logic triggers

### Scenario 4: Candidate Opts Out
- [ ] Candidate says "stop" or "opt out"
- [ ] System immediately stops calling
- [ ] Opt-out recorded in database

### Scenario 5: Error Handling
- [ ] OpenAI API failure
- [ ] Twilio API failure
- [ ] Invalid phone number
- [ ] Network issues

---

## 📊 Success Criteria

Before sharing with workshop participants, verify:

- [ ] `npm install` works cleanly
- [ ] `npm run test:local` passes
- [ ] All documentation is clear
- [ ] QUICKSTART.md tested by non-technical person
- [ ] Workshop agenda timing is accurate
- [ ] Troubleshooting guide covers common issues
- [ ] Example `.env` has all required vars
- [ ] GitHub repo is public and accessible

---

## 🐛 Known Issues

### Current Limitations:
1. **No Main App Yet** - app.ts doesn't exist
2. **No Screening Agent** - Instructions/tools not built
3. **No Setup Scripts** - Twilio resources need manual config
4. **No Tests** - Jest tests not written yet

### Workarounds:
- Copy from original repo (recommended)
- Build from scratch (4-8 hours)
- Use this repo as foundation + original repo as reference

---

## 🎯 Recommended Next Steps

**For you (before workshop):**

1. **Copy Core Components** (2 hours)
   ```bash
   # Copy essential files from original repo
   ./migrate-core.sh
   ```

2. **Test End-to-End** (1 hour)
   - Make test call
   - Verify AI responds
   - Check logging works

3. **Dry Run Workshop** (3 hours)
   - Follow workshop agenda
   - Time each section
   - Note issues

4. **Update Documentation** (30 min)
   - Fix any errors found
   - Add screenshots
   - Update troubleshooting

**For workshop participants:**

1. **Send Pre-Work** (1 week before)
   - Link to WORKSHOP_PREWORK.md
   - Deadline: 24 hours before workshop

2. **Office Hours** (day before)
   - Help with setup issues
   - Answer questions

3. **Workshop Day**
   - Have backup credentials ready
   - Monitor Slack for issues
   - Be prepared to troubleshoot

---

## 💡 Pro Tips

**For Testing:**
- Use a Google Voice number for testing (free)
- Test in multiple browsers
- Test with/without ngrok
- Test from different networks

**For Workshop:**
- Have 5-10 spare Twilio numbers ready
- Prepare backup OpenAI API keys
- Screenshot every step
- Record a demo video

**For Debugging:**
- Enable verbose logging
- Use Twilio Console for call logs
- Monitor OpenAI API dashboard
- Check ngrok web interface

---

## ✅ Current Status

| Component | Status | Ready for Workshop? |
|-----------|--------|---------------------|
| Project Structure | ✅ Complete | Yes |
| Dependencies | ✅ Installed | Yes |
| Data Models | ✅ Complete | Yes |
| ATS Integration | ✅ Complete | Yes (mock mode) |
| Outbound Calling | ✅ Complete | Needs testing |
| Documentation | ✅ Complete | Yes |
| Test Scripts | ✅ Complete | Yes |
| **Main App** | ❌ Missing | **No - Need to copy** |
| **Screening Agent** | ❌ Missing | **No - Need to build** |
| **Setup Scripts** | ❌ Missing | **No - Need to copy** |

**Overall**: 70% complete, needs 6-8 hours to finish

---

## 🆘 Need Help?

**If you're stuck:**
1. Check QUICKSTART.md
2. Check TROUBLESHOOTING.md (if exists)
3. Review original repo's implementation
4. Ask in workshop Slack

**Ready to share with participants when:**
- Main app works end-to-end
- At least one screening call succeeds
- Documentation tested by non-developer
- You've done a dry run

Good luck! 🚀
