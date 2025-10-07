# 3-Hour Workshop Agenda
## Building AI Voice Recruiting with Twilio ConversationRelay

**Target Audience:** Developers, Product Managers, Technical Recruiters
**Duration:** 3 hours
**Format:** Hands-on coding workshop

---

## 🎯 Learning Objectives

By the end of this workshop, you'll be able to:
- Build an AI voice agent that conducts phone screening calls
- Integrate OpenAI GPT for dynamic conversations
- Use Twilio ConversationRelay for real-time voice AI
- Implement Conversational Intelligence (transcripts, sentiment, PII redaction)
- Deploy production-ready voice AI recruiting assistant

---

## 📅 Workshop Schedule

### **Part 1: Welcome & Setup (30 min)**

#### 00:00 - 00:10 | Introductions & Icebreaker
- **Instructor introduction**
- **Participant introductions** (name, role, what brings you here)
- **Poll:** Who has built voice applications before?
- **Workshop overview** - What we're building today

#### 00:10 - 00:15 | Demo: The End Result
- **Live demo** of completed recruiting voice AI
- Make a screening call to Simon
- View transcript and Conversational Intelligence
- Show call history dashboard

#### 00:15 - 00:30 | Environment Setup
- **Clone repository** from GitHub
- **Install dependencies** (Node.js, Twilio CLI)
- **Configure API keys** (Twilio, OpenAI, ElevenLabs)
- **Deploy to Twilio Serverless**
- **Verify deployment** - Everyone makes a test call

**🎯 Milestone:** Everyone has working voice AI making calls

---

### **Part 2: Understanding the Architecture (45 min)**

#### 00:30 - 00:45 | Twilio Voice Fundamentals
- **How phone calls work** on Twilio
  - Outbound calls with `client.calls.create()`
  - TwiML for call control (`<Say>`, `<Gather>`, `<Connect>`)
  - Webhooks and event callbacks
- **Live coding:** Modify the greeting message
- **Exercise:** Change Simon's personality in the prompt

#### 00:45 - 01:00 | Multi-Turn Conversations
- **Stateful vs stateless** conversations
- **Twilio Sync** for storing conversation state
- **How the 7-step screening flow works**
  1. Is now a good time?
  2. Confirm interest in role
  3. Technical skills discussion
  4. Years of experience
  5. Salary expectations
  6. Work preferences
  7. Schedule interview
- **Live coding:** Add a new screening question

#### 01:00 - 01:15 | OpenAI Integration Deep Dive
- **Dynamic responses with GPT-4o-mini**
- **System prompts** - Teaching Simon personality
- **Conversation history** - Context awareness
- **Function calling** - Tool invocation (scheduleInterview, sendSMS)
- **Live coding:** Modify Simon's personality traits

**🎯 Milestone:** Understand full conversation flow

---

### **Part 3: Hands-On Building (60 min)**

#### 01:15 - 01:30 | Break ☕
- Network with other participants
- Check in with instructors if stuck

#### 01:30 - 02:00 | Challenge 1: Customize Your Agent
**Task:** Modify the agent for a different job role

Choose one:
- **Sales Development Rep** (focus on quota attainment, cold calling experience)
- **Customer Success Manager** (focus on empathy, communication skills)
- **Data Scientist** (focus on Python, SQL, ML experience)

**What to modify:**
- Agent personality in system prompt
- Screening questions (add/remove steps)
- Qualification criteria
- Voice selection (try different ElevenLabs voices)

**Deliverable:** Working agent that screens for your chosen role

#### 02:00 - 02:15 | Challenge 2: Add Tools & Functions
**Task:** Implement a new tool function

Options:
- `checkCalendarAvailability()` - Query Google Calendar API
- `sendEmailSummary()` - Email hiring manager after call
- `updateATS()` - Post candidate data to Greenhouse/Lever
- `translateLanguage()` - Support multilingual candidates

**Deliverable:** Working tool that's invoked during conversation

**🎯 Milestone:** Customized agent with new capabilities

---

### **Part 4: Advanced Features (30 min)**

#### 02:15 - 02:30 | Conversational Intelligence
- **Transcripts** - Real-time speech-to-text
- **Sentiment analysis** - Positive/neutral/negative
- **PII redaction** - Automatically remove sensitive data
- **Entity extraction** - Years of experience, skills, salary
- **Live demo:** View CI dashboard in Call History tab

#### 02:30 - 02:45 | Voice Quality & Selection
- **Amazon Polly** vs **ElevenLabs** voices
- **Voice personality matching** - Formal vs casual roles
- **Speech rate and tone** adjustments
- **ConversationRelay architecture** for production
- **Exercise:** Test 3 different voices and compare

**🎯 Milestone:** Production-ready voice quality

---

### **Part 5: Production & Next Steps (15 min)**

#### 02:45 - 02:55 | Taking it to Production
- **Compliance considerations**
  - TCPA compliance (consent, calling hours)
  - Do Not Call list management
  - Recording consent and disclosure
- **Scaling strategies**
  - Concurrent call handling
  - Queue management
  - Failover and error handling
- **Monitoring & analytics**
  - Call success rates
  - Conversation quality metrics
  - Cost optimization

#### 02:55 - 03:00 | Wrap-Up & Resources
- **Recap:** What we built
- **Resources:** Documentation, GitHub repo, Twilio docs
- **Community:** Where to get help
- **Feedback survey**
- **Q&A**

---

## 🏆 Competition (Optional)

**Best Agent Award** - Judged on:
- Most creative job role adaptation
- Best personality/tone
- Most useful tool integration
- Smoothest conversation flow

**Prize:** Twilio swag + Featured in showcase

---

## 📚 Pre-Workshop Checklist

Send to participants 1 week before:

- [ ] Create [Twilio account](https://www.twilio.com/try-twilio)
- [ ] Get [OpenAI API key](https://platform.openai.com/api-keys)
- [ ] Sign up for [ElevenLabs](https://elevenlabs.io) (optional but recommended)
- [ ] Install Node.js 18+
- [ ] Install Git
- [ ] Review [QUICK_SETUP.md](./QUICK_SETUP.md)

**Recommended:** Complete setup steps 1-6 before workshop to maximize coding time.

---

## 🎓 What You'll Take Home

- ✅ Working AI voice recruiting agent
- ✅ Understanding of Twilio Voice + ConversationRelay
- ✅ OpenAI integration patterns
- ✅ Production deployment on Twilio Serverless
- ✅ Code repository with 6,590 lines of TypeScript
- ✅ Documentation and best practices
- ✅ Community connections

---

## 📊 Workshop Metrics

**Code Stats:**
- 11 Twilio Functions
- 9 HTML/JS Assets
- OpenAI GPT-4o-mini integration
- ElevenLabs voice synthesis
- Greenhouse ATS integration ready

**Technologies:**
- Twilio Voice API
- Twilio Sync
- Twilio ConversationRelay
- OpenAI GPT-4o-mini
- ElevenLabs Text-to-Speech
- Node.js + TypeScript

---

## 🛠️ Instructor Notes

**Setup Requirements:**
- Stable internet (video calls + API requests)
- Projector/screen share for live coding
- Test Twilio account with credits
- Sample candidate data for demos

**Common Issues:**
- Phone number format (E.164)
- API key configuration errors
- Deployment timeouts (have backup deployed version)
- Zoom/audio conflicts during test calls

**Backup Plan:**
- Pre-deployed demo environment
- Screen recordings of key demos
- Troubleshooting guide handout

---

## 📞 Support During Workshop

**Instructor:** Primary presenter + live coding
**TAs (2-3):** Circulate to help with setup issues
**Slack Channel:** Real-time Q&A and troubleshooting
**Office Hours:** 30 min after workshop for follow-up questions

---

## 🎬 Opening Script (5 min)

> "Welcome everyone! I'm [Name], and today we're going to build something really cool - an AI voice assistant that can conduct recruiting phone screens automatically.
>
> Quick poll: How many of you have built voice applications before? [Show of hands]
>
> Don't worry if you haven't - we're going to start from the basics and by the end of today, you'll have a fully functional AI recruiter making calls.
>
> Here's what makes this exciting: We're not just playing pre-recorded messages. We're using OpenAI's GPT to have actual dynamic conversations that adapt to what candidates say. And we're using ElevenLabs for natural-sounding voices.
>
> Let me show you what we're building... [Live demo]
>
> Cool, right? Let's get started!"

---

## 📋 Post-Workshop Survey

1. How would you rate the workshop overall? (1-5)
2. Was the pacing appropriate? (Too fast / Just right / Too slow)
3. Which section was most valuable?
4. What would you like to see covered in more depth?
5. Would you recommend this workshop to a colleague?
6. What will you build with this technology?

---

## 🔗 Quick Links

- **GitHub Repo:** https://github.com/geverist/sense-recruiting-voice-ai
- **Quick Setup:** [QUICK_SETUP.md](./QUICK_SETUP.md)
- **Code Walkthrough:** [TWILIO_CODE_WALKTHROUGH.md](./docs/TWILIO_CODE_WALKTHROUGH.md)
- **Twilio Docs:** https://www.twilio.com/docs/voice
- **OpenAI Docs:** https://platform.openai.com/docs
- **ElevenLabs Docs:** https://elevenlabs.io/docs

---

## 💡 Advanced Topics (If Time Permits)

- Webhook security with signature validation
- Rate limiting and abuse prevention
- Multi-language support with automatic translation
- Integration with ATS systems (Greenhouse, Lever)
- A/B testing different agent personalities
- Cost optimization strategies

---

**Version:** 1.0
**Last Updated:** January 2025
**Instructor Contact:** [Your email/Slack]
