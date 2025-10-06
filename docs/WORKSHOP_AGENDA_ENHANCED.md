# Sense Voice AI Workshop - Enhanced 3 Hour Experience 🚀

## 🎯 Workshop Goal
Build a production-ready AI recruiting voice assistant with **live call competition**, **ROI analysis**, **compliance training**, and **real-world integrations**.

**What Makes This Workshop Sing:**
- 🏆 Live team competition with real calls
- 💰 ROI calculator showing business impact
- ⚖️ Compliance & ethics training
- 📊 Real-time analytics dashboard
- 🧪 A/B testing framework
- 🌍 Multi-language support demo
- 🌱 Greenhouse ATS integration
- 📱 Candidate experience surveys
- 🎬 Golden moments call playback

---

## 📋 Pre-Workshop Setup (75 minutes - See WORKSHOP_PREWORK.md)

### Required (45 min)
- ✅ Twilio Account + Phone Number
- ✅ OpenAI API Key
- ✅ Repository cloned + dependencies installed

### Optional but Recommended (30 min)
- ✅ Google Calendar OAuth (for scheduling demo)
- ✅ ElevenLabs Account (for premium voices)

**📘 Complete Guide:** See `docs/WORKSHOP_PREWORK.md` for detailed setup instructions

---

## 🕐 Enhanced Workshop Timeline (3 Hours)

### **Hour 1: Setup, Competition Kickoff & Compliance (0:00 - 1:00)**

#### **0:00 - 0:10** - Welcome & "Golden Moments" Playback
- **Play recording**: "The Perfect Screening" (5 min call)
  - Shows what excellent AI recruiting sounds like
  - Sets expectations for workshop outcomes
  - Gets attendees excited about what they'll build

- **Play recording**: "The Compliance Violation" (2 min call)
  - Shows what NOT to do (forbidden EEOC questions)
  - Reinforces importance of legal compliance
  - Sets stage for compliance training module

**📄 Resource:** `workshop-materials/golden-moments-guide.md`

#### **0:10 - 0:30** - Compliance & Ethics Training
**Critical Foundation** - Before building anything, understand the legal landscape

**Open:** `https://your-service.twil.io/compliance.html`

**Topics Covered:**
- ✅ EEOC Title VII, ADA, ADEA regulations
- ✅ Forbidden vs. allowed interview questions
- ✅ PII redaction and data protection
- ✅ When to escalate to human recruiters
- ✅ State-specific laws (CA, NY, IL)
- ✅ NYC Local Law 144 (AI bias audits)

**Interactive Checklist:** 15-point pre-launch compliance checklist
**Group Discussion:** "What legal risks did you spot in the violation call?"

**Outcome:** Every attendee understands they're building a legally-compliant recruiting tool

#### **0:30 - 0:50** - Environment Setup & Twilio Serverless Deploy

**Option A: Quick Deploy (Recommended)**
```bash
cd twilio-serverless
twilio serverless:deploy

# Deployed URLs:
# Main UI: https://your-service-XXXX.twil.io/index.html
# Advanced Config: https://your-service-XXXX.twil.io/advanced.html
# Analytics: https://your-service-XXXX.twil.io/analytics.html
# Competition: https://your-service-XXXX.twil.io/competition.html
# ROI Calculator: https://your-service-XXXX.twil.io/roi-calculator.html
# A/B Testing: https://your-service-XXXX.twil.io/ab-testing.html
# Compliance Guide: https://your-service-XXXX.twil.io/compliance.html
```

**Option B: Full Development Setup**
```bash
npm run dev          # Main app with AI logic
npm run grok         # ngrok tunnel (in separate terminal)
```

#### **0:50 - 1:00** - Competition Teams & ROI Demonstration

**📊 ROI Calculator Demo** (`roi-calculator.html`)
- Instructor shows live calculation
- Example: 50 calls/week × $45/hr recruiter = **$43,000 saved/year**
- Shows breakeven in just **8 days**
- Discusses payback multiple of **12x**

**🏆 Form Competition Teams** (3-4 people each)
- Distribute attendees into 3 teams: Alpha, Beta, Gamma
- Each team selects a strategy from `workshop-materials/team-configurations.json`:
  - Team Alpha: "The Professional" (ElevenLabs + GPT-4o + Stateful)
  - Team Beta: "The Speedy" (Amazon Polly + GPT-4o-mini + Stateless)
  - Team Gamma: "The Conversationalist" (ElevenLabs Rachel + High Temperature)

**Competition Rules:**
- Each team configures their AI agent
- 30 minutes to customize (Hour 2)
- 2-3 test calls per team with volunteers
- Judging on 5 criteria (20 points each):
  - Conversation Flow
  - Voice Quality
  - Response Time
  - Information Gathering
  - Candidate Experience

**🎯 Prize:** Winning team presents their strategy at end

---

### **Hour 2: Configure Agents & Live Competition (1:00 - 2:00)**

#### **1:00 - 1:15** - Agent Configuration Tutorial

**Instructor demonstrates** in `advanced.html`:

**Tab 1: Agent Settings**
- Name: "Alex" (warm, professional recruiter)
- Personality: Professional yet friendly
- Prompt Mode: Stateful vs Stateless
- Memory: Full conversation history vs sliding window

**Tab 2: Voice Configuration**
- Voice Provider: ElevenLabs vs Amazon Polly vs Google TTS
- **NEW**: Show all 11 ElevenLabs voices with samples
- Language: en-US vs en-GB vs es-US

**Tab 3: LLM Settings**
- Model: GPT-4o vs GPT-4o-mini
- Temperature: 0.5 (conservative) vs 0.9 (creative)
- Max Tokens: 100 (brief) vs 250 (detailed)

**Tab 4: System Prompt**
- Show example recruiting prompt
- Explain structure: Role, Goals, Rules, Tools

**Tab 5: Knowledge Base**
- Add company info, benefits, job descriptions
- AI references this during calls

**Tab 6: Tools**
- `checkAvailability()` - Query Google Calendar
- `scheduleInterview()` - Book interview slot
- `sendSMS()` - Send confirmation text
- `recordAnswer()` - Save candidate responses

**Tab 7: Test & Deploy**
- Test call with sample candidate data
- Deploy configuration

#### **1:15 - 1:45** - Team Configuration Sprint

**Each team has 30 minutes to:**

1. **Choose their strategy** (from 6 pre-built options)
2. **Configure in advanced.html:**
   - Select voice provider and specific voice
   - Choose LLM model and temperature
   - Customize system prompt
   - Set stateful/stateless mode

3. **Test internally:**
   - Team members call each other
   - Iterate on prompt and settings
   - Practice candidate scenarios

**Instructor circulates** to help teams troubleshoot

**🎬 Optional:** Play "The Skeptical Candidate" recording as inspiration

#### **1:45 - 2:00** - Live Call Competition

**📺 Display:** `competition.html` on main screen

**Competition Format:**
- 3 volunteer "candidates" (non-team members)
- Each candidate receives calls from all 3 team agents
- Candidates play same role for fairness
- Judges score each call in real-time

**Sample Candidate Persona:**
```
Name: Jordan Taylor
Role: Senior Software Engineer candidate
Background: 6 years React/Node.js experience
Personality: Enthusiastic but asks clarifying questions
Scenario: Interested in remote work, salary 140-160k
```

**Judging Process:**
- 2-3 judges score independently on scorecard
- Average scores displayed on competition.html
- Real-time leaderboard updates
- Winner announced immediately after all calls

---

### **Hour 3: Advanced Features & Production Readiness (2:00 - 3:00)**

#### **2:00 - 2:15** - Analytics & Insights

**📊 Live Analytics Dashboard** (`analytics.html`)

**Instructor shows:**
- Active calls counter (real-time)
- Sentiment analysis breakdown (positive/neutral/negative)
- Top extracted skills and entities
- PII redaction count
- Average call duration
- Success rate metrics

**Real Data:** If teams made calls in competition, show their aggregated metrics

**Discussion:** "How would you use this data to optimize your recruiting?"

#### **2:15 - 2:30** - A/B Testing Framework

**🧪 A/B Testing Demo** (`ab-testing.html`)

**Instructor demonstrates:**

**Variant A:**
- Voice: Rachel (ElevenLabs, calm professional)
- LLM: GPT-4o
- Temperature: 0.7
- Prompt: Warm and conversational

**Variant B:**
- Voice: Josh (ElevenLabs, authoritative)
- LLM: GPT-4o-mini
- Temperature: 0.5
- Prompt: Direct and efficient

**Traffic Split:** 50/50
**Minimum Sample:** 20 calls each

**Results Tracking:**
- Voice naturalness rating (from candidate surveys)
- Would recommend percentage
- Call completion rate
- Average duration
- Sentiment score

**When to Declare Winner:**
- Need statistical significance (95%+)
- Clear performance difference (>15%)
- After minimum sample size reached

**Use Case:** "Should we use premium ElevenLabs voices or save money with Polly?"

#### **2:30 - 2:45** - Greenhouse ATS Integration

**🌱 Integration Showcase**

**Live Demonstration:**
1. **Show Greenhouse Dashboard**
   - Candidate pipeline
   - "Application Review" stage

2. **Webhook Configuration**
   - Endpoint: `https://your-service.twil.io/greenhouse-webhook`
   - Event: `candidate_stage_change`
   - Filter: When moved to "Application Review"

3. **Trigger Webhook**
   - Submit test application in Greenhouse
   - Watch webhook fire in Twilio logs
   - See AI screening call initiated

4. **Complete Call**
   - AI conducts screening
   - Transcript captured
   - Sentiment analyzed

5. **Results Sync Back**
   - Activity note added to Greenhouse
   - Transcript attached
   - Candidate moved to "Phone Screen Scheduled"
   - Recruiter notified via Slack

**Code Walkthrough:**
- `greenhouse-webhook.js` - Receives webhooks
- `update-greenhouse.js` - Syncs results back
- Show API calls to Greenhouse Harvest API

**📘 Full Guide:** `workshop-materials/greenhouse-integration-guide.md`

#### **2:45 - 2:55** - Candidate Experience Survey System

**📱 Survey Flow Demo**

1. **Call Completes** → Triggers `call-status.js`
2. **Function sends SMS** to candidate:
   ```
   Hi Sarah! Thanks for speaking with us about the
   Senior Engineer position. We'd love your feedback:
   https://your-service.twil.io/survey.html?callSid=CA...
   ```

3. **Candidate opens link** → Mobile-optimized survey:
   - ⭐ "How natural did the AI sound?" (1-5 rating)
   - 👍 "Would you recommend this company?" (Yes/No)
   - 💬 "Any additional feedback?" (Optional text)

4. **Results saved** to Twilio Sync
5. **Analytics updated** with survey data

**Why It Matters:**
- Measure candidate experience in real-time
- Iterate on voice/prompt based on feedback
- Show executives that AI improves brand perception

#### **2:55 - 3:00** - Competition Winner & Wrap-Up

**🏆 Announce Competition Winner**
- Display final scores on `competition.html`
- Winning team presents their strategy (2 min)
- Discuss what made their agent successful

**🎁 Workshop Deliverables:**
- ✅ Production-ready AI recruiting assistant
- ✅ 8 different web apps (UI, analytics, ROI, etc.)
- ✅ Compliance training certification
- ✅ A/B testing framework
- ✅ Greenhouse integration code
- ✅ Survey system for candidate feedback
- ✅ 6 pre-built agent strategies
- ✅ Golden moments recording guide
- ✅ Complete documentation

**📚 Next Steps:**
1. **This Week:**
   - Connect real Greenhouse account
   - Record your first "golden moments"
   - Run first A/B test

2. **This Month:**
   - Deploy to production
   - Screen first 50 candidates
   - Analyze ROI vs. projections

3. **This Quarter:**
   - Add multi-language support (Spanish, etc.)
   - Implement reference check agent
   - Build executive dashboard

**🆘 Support:**
- Documentation: `docs/` folder
- Office Hours: Fridays 2-3pm PT
- Slack: #ai-recruiting-workshop
- GitHub Issues for bugs

---

## 🎓 Enhanced Learning Outcomes

After this workshop, attendees can:

✅ **Build** production-ready AI recruiting voice assistants
✅ **Ensure** EEOC compliance and legal safety
✅ **Calculate** ROI and business impact
✅ **Integrate** with Greenhouse ATS via webhooks
✅ **Analyze** candidate experience with surveys
✅ **Optimize** using A/B testing framework
✅ **Monitor** with real-time analytics dashboard
✅ **Scale** to multi-language and global recruiting
✅ **Troubleshoot** using golden moments playback
✅ **Present** business case to executives

---

## 📊 Workshop Success Metrics

### Technical Success
- [ ] 90%+ attendees complete working deployment
- [ ] All teams successfully make competition calls
- [ ] At least 2 teams achieve 80+ points in competition
- [ ] Zero compliance violations in any team's configuration
- [ ] 100% of attendees can explain stateful vs stateless

### Business Success
- [ ] Every attendee calculates ROI for their use case
- [ ] 80%+ see 10x+ annual payback multiple
- [ ] At least 1 team commits to production deployment
- [ ] 5+ questions about Greenhouse integration

### Engagement Success
- [ ] Active participation in compliance discussion
- [ ] Creative agent customizations from at least 3 teams
- [ ] Positive candidate survey feedback (if volunteers participate)
- [ ] Post-workshop Slack channel stays active for 2+ weeks

---

## 🎯 What Makes This Workshop Different

### vs. Standard Twilio Workshops
- ✅ Not just "Hello World" - production-ready code
- ✅ Business impact (ROI calculator, compliance)
- ✅ Competitive element keeps energy high
- ✅ Multiple web apps, not just curl commands

### vs. AI/LLM Workshops
- ✅ Real-world recruiting use case
- ✅ Legal and ethical considerations built-in
- ✅ Full stack integration (not just API calls)
- ✅ Metrics and optimization frameworks

### vs. Sense's Previous Workshops
- ✅ 8 additional web applications (analytics, ROI, etc.)
- ✅ Compliance training module
- ✅ Live competition format
- ✅ A/B testing framework
- ✅ Candidate experience surveys
- ✅ Golden moments methodology
- ✅ Greenhouse integration showcase

---

## 📦 Workshop Materials Inventory

### Web Applications (8 total)
1. `index.html` - Simple screening form
2. `advanced.html` - Full configuration UI (7 tabs)
3. `analytics.html` - Real-time metrics dashboard
4. `competition.html` - Team competition scoreboard
5. `roi-calculator.html` - Business impact calculator
6. `ab-testing.html` - Voice optimization framework
7. `compliance.html` - Legal training module
8. `survey.html` - Candidate experience survey

### Twilio Functions (6 total)
1. `screen-candidate.js` - Initiate screening call
2. `outbound-call-answer.js` - Handle call connection
3. `call-status.js` - Track call lifecycle + send surveys
4. `recording-status.js` - Handle recording events
5. `send-survey.js` - SMS survey to candidates
6. `submit-survey.js` - Store survey responses

### Documentation (5 guides)
1. `WORKSHOP_PREWORK.md` - 75-minute setup guide
2. `WORKSHOP_AGENDA_ENHANCED.md` - This file
3. `team-configurations.json` - 6 pre-built strategies
4. `golden-moments-guide.md` - Recording examples guide
5. `greenhouse-integration-guide.md` - ATS integration

### Code Resources
- Complete Express + WebSocket server
- ConversationRelay handler with OpenAI
- Session store for stateful conversations
- Sample agent configurations
- Greenhouse webhook handlers (ready to deploy)

---

## 🔧 Instructor Pre-Workshop Checklist

### 1 Week Before
- [ ] Test full workshop flow end-to-end
- [ ] Record all "golden moments" example calls
- [ ] Set up Greenhouse test account
- [ ] Configure test webhooks
- [ ] Create volunteer candidate personas
- [ ] Test A/B testing UI with sample data
- [ ] Verify all 8 web apps deploy correctly

### 1 Day Before
- [ ] Send reminder email with prework link
- [ ] Verify Twilio account has credits
- [ ] Test ngrok domains work
- [ ] Prepare backup phone numbers
- [ ] Load competition.html on presentation screen
- [ ] Queue up golden moments recordings
- [ ] Test screen sharing and audio

### Day Of
- [ ] Arrive 15 min early to test AV
- [ ] Have backup laptop ready
- [ ] Print paper scorecards for competition judges
- [ ] Set up Slack channel for troubleshooting
- [ ] Have completed repo ready to share if needed
- [ ] Prepare prizes for winning team (swag, certificates, etc.)

---

## 🎉 Post-Workshop Follow-Up

### Immediate (Same Day)
- [ ] Share recording of workshop
- [ ] Post completed code to GitHub
- [ ] Send survey feedback form
- [ ] Schedule office hours

### Week 1
- [ ] Share attendee showcase (who deployed to prod?)
- [ ] Post best practices learned
- [ ] Share metrics from competition (which strategy won?)

### Week 4
- [ ] Case study from first production deployment
- [ ] ROI results from real implementations
- [ ] Invite to advanced workshop (multi-language, reference checks)

---

**🚀 This workshop gives attendees everything they need to deploy AI recruiting voice agents in production, backed by compliance, ROI analysis, and optimization frameworks!**
