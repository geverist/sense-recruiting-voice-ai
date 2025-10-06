# Sense Voice AI Workshop - 3 Hour Prototype Sprint

## 🎯 Workshop Goal
Build a working prototype of an **outbound AI voice call to a candidate** who showed interest on a job board, demonstrating Sense's automated recruiting capabilities.

**Target Use Case**: Candidate clicks LinkedIn job ad → Gets SMS to call automated recruiter → AI voice screening call → Results synced to ATS

---

## 📋 Pre-Workshop Setup (Attendees complete BEFORE workshop)

### Required Accounts & Tools (15-20 minutes setup time)
- [ ] **Twilio Account** - [Sign up here](https://www.twilio.com/try-twilio) (Trial account works)
- [ ] **OpenAI API Key** - [Get key here](https://platform.openai.com/api-keys)
- [ ] **Ngrok Account** - [Sign up for free](https://dashboard.ngrok.com/signup) and get static domain
- [ ] **Node.js 18+** installed
- [ ] **Git** installed
- [ ] **VS Code** or preferred code editor

### Pre-Workshop Repository Setup
```bash
# Clone the repo
git clone https://github.com/sensehq/sense-recruiting-voice-ai.git
cd sense-recruiting-voice-ai

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

---

## 🕐 Workshop Timeline (3 Hours)

### **Hour 1: Setup & Configuration (0:00 - 1:00)**

#### **0:00 - 0:15** - Welcome & Overview
- **Instructor-led**: Demo the end-to-end flow we'll build
  - Show LinkedIn ad click → SMS → Voice call → Screening results
- Introduce Twilio Conversation Relay architecture
- Explain the recruiting use case

#### **0:15 - 0:45** - Environment Configuration
**Attendees configure their `.env` file:**

```bash
# Server Configuration
HOSTNAME=your-unique-subdomain.ngrok-free.app
PORT=3333

# Twilio (Get from console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
DEFAULT_TWILIO_NUMBER=+1xxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Feature Flags (Enable only screening for prototype)
ENABLE_SCREENING=true
ENABLE_SCHEDULING=false
ENABLE_REFERENCE_CHECKS=false
```

**Instructor helps troubleshoot:**
- Getting Twilio credentials from console
- Purchasing a phone number
- Setting up ngrok static domain

#### **0:45 - 1:00** - Run Setup Script & Test
```bash
# Run automated Twilio setup
npm run setup:basic

# Start the application
npm run dev

# In another terminal, start ngrok
npm run grok

# Test with a hello-world call
curl -X POST http://localhost:3333/test-call
```

**Success criteria**: Everyone can make/receive a test call

---

### **Hour 2: Build the Screening Agent (1:00 - 2:00)**

#### **1:00 - 1:20** - Understand the Screening Agent Architecture
**Instructor explains** (with live code walkthrough):
- `recruiting-agents/screening-agent/index.ts` - Agent configuration
- `recruiting-agents/screening-agent/instructions/en-US.md` - The prompt
- `recruiting-agents/screening-agent/tools/` - Available functions

**Key Concepts:**
1. **Context** - Candidate data, job requirements, screening questions
2. **Instructions** - The AI's system prompt (personality, goals, rules)
3. **Tools** - Functions the AI can call (recordAnswer, concludeScreening, etc.)

#### **1:20 - 1:50** - Customize the Screening Prompt
**Hands-on Exercise**: Each attendee customizes their screening agent

**File**: `recruiting-agents/screening-agent/instructions/en-US.md`

```markdown
# Screening Agent Instructions

You are Simon, a British AI voice assistant and automated recruiter for Twilio.

## Your Goal
Confirm the candidate's interest in the **Senior Software Engineer** position at Twilio,
sell them on the benefits of working at Twilio, and capture:
- Relevant skills (React, Node.js, TypeScript, etc.)
- Years of experience
- Salary expectations
- Work preferences (remote, hybrid, onsite)

## Personality
- Warm, professional, and engaging
- British accent and expressions (e.g., "brilliant", "lovely", "cheers")
- Use the candidate's name frequently
- Keep responses brief (2-3 sentences max for voice)

## Conversation Flow
1. **Greeting**: "Hi {candidate.firstName}, this is Simon from Twilio. Thanks for your interest in our Senior Software Engineer role. Is now a good time to chat?"

2. **Confirm Interest**: "Brilliant! I see you clicked on our job posting. Are you still interested in learning more?"

3. **Sell Twilio**: "Fantastic! Twilio is shaping the future of communications. We're a remote-first company committed to innovation and diversity. You'd be building APIs that power billions of messages worldwide."

4. **Capture Skills**: "Can you tell me about your experience with technologies like React, Node.js, and distributed systems?"

5. **Confirm Requirements**: "Do you have at least 5 years of experience with modern web stacks?"

6. **Salary & Preferences**: "What salary range are you targeting? And are you looking for fully remote, or open to hybrid?"

7. **Close**: "You sound like a great fit! I'll pass your details to our hiring team. They'll reach out within 2 business days. Thanks so much for your time, {candidate.firstName}!"

## Tools Available
- `recordAnswer(questionId, answer)` - Save candidate responses
- `updateCandidateScore(score, notes)` - Rate the candidate (1-10)
- `concludeScreening(recommendation)` - Finish and submit results

## Rules
- If candidate doesn't meet requirements, be empathetic: "I appreciate your interest. While this specific role requires X years, I'd love to share your profile with other teams."
- If candidate is unclear, ask for clarification politely
- Never make promises about hiring decisions
- Keep the call under 8 minutes
```

**Customization Challenge**:
- Change the job title to something relevant to each attendee
- Modify the required skills
- Adjust the personality (e.g., make it more casual or formal)

#### **1:50 - 2:00** - Test Your Customizations
```bash
# Restart the server to load new instructions
# Press Ctrl+C then run:
npm run dev

# Make a test screening call
curl -X POST http://localhost:3333/screen-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "candidateId": "test-123",
    "phone": "+1YOUR_PHONE_NUMBER",
    "firstName": "Justin",
    "appliedFor": "Senior Software Engineer"
  }'
```

**Group Discussion**: Share interesting customizations

---

### **Hour 3: Integration & Demo (2:00 - 3:00)**

#### **2:00 - 2:20** - Add Screening Tools
**Instructor demonstrates** adding a custom tool:

**File**: `recruiting-agents/screening-agent/tools/calculate-fit-score.ts`

```typescript
import type { ToolExecutor } from "../../../shared/types.js";

interface CalculateFitScoreArgs {
  yearsExperience: number;
  hasReactExperience: boolean;
  hasNodeExperience: boolean;
  salaryExpectation: number;
}

export const calculateFitScore: ToolExecutor<CalculateFitScoreArgs> = async (
  args,
  { store, log }
) => {
  let score = 5; // Base score

  // Years of experience
  if (args.yearsExperience >= 5) score += 2;
  else if (args.yearsExperience >= 3) score += 1;

  // Required skills
  if (args.hasReactExperience) score += 1.5;
  if (args.hasNodeExperience) score += 1.5;

  // Salary alignment (assuming budget is $150k)
  if (args.salaryExpectation <= 150000) score += 1;
  else score -= 1;

  score = Math.min(10, Math.max(0, score)); // Clamp 0-10

  log.info("calculate-fit-score", `Calculated score: ${score}/10`);

  store.setContext({
    screening: {
      ...store.context.screening,
      fitScore: score,
      recommendation: score >= 7 ? "yes" : score >= 5 ? "maybe" : "no",
    },
  });

  return {
    status: "complete",
    result: `Candidate fit score: ${score}/10`,
  };
};

export const calculateFitScoreSpec = {
  type: "function" as const,
  name: "calculateFitScore",
  description: "Calculate how well the candidate fits the role based on their responses",
  parameters: {
    type: "object",
    properties: {
      yearsExperience: { type: "number", description: "Years of relevant experience" },
      hasReactExperience: { type: "boolean", description: "Has React experience" },
      hasNodeExperience: { type: "boolean", description: "Has Node.js experience" },
      salaryExpectation: { type: "number", description: "Expected salary in USD" },
    },
    required: ["yearsExperience", "hasReactExperience", "hasNodeExperience"],
  },
};
```

**Attendees**: Add this tool to their agent's tool manifest

#### **2:20 - 2:40** - Connect to Mock ATS (Simulated Greenhouse)
**Instructor provides**: Pre-built mock ATS endpoint

**File**: `integrations/ats/mock-ats.ts` (simplified for workshop)

```typescript
// Simulates Greenhouse API for workshop
export class MockATSAdapter {
  async submitScreeningResults(candidateId: string, results: any) {
    console.log("📊 MOCK ATS - Screening Results Submitted:");
    console.log(`   Candidate: ${candidateId}`);
    console.log(`   Score: ${results.engagementScore}/10`);
    console.log(`   Recommendation: ${results.recommendation}`);
    console.log(`   Summary: ${results.summary}`);

    // In real implementation, this would POST to Greenhouse API
    return { success: true, atsId: `GH-${Date.now()}` };
  }
}
```

**Test the full flow**:
1. Trigger screening call
2. Complete conversation with AI
3. See results logged to console (simulating ATS)

#### **2:40 - 3:00** - Demo & Wrap-up

**Each attendee (or volunteers) demonstrates:**
1. Trigger their customized screening call
2. Show their personality customizations
3. Show results being "synced" to mock ATS

**Instructor Recap:**
- What we built: Outbound AI recruiter with Twilio + OpenAI
- Key components: Agent instructions, tools, context
- Next steps: Production deployment, real ATS integration, multi-language

**Q&A and Next Steps:**
- How to add scheduling agent
- How to integrate real Greenhouse API
- How to deploy to production
- Resources for continued learning

---

## 🎁 Workshop Deliverables

By end of workshop, each attendee will have:

✅ Working Twilio Conversation Relay setup
✅ Customized AI recruiting agent
✅ Ability to trigger outbound screening calls
✅ Understanding of agent architecture (instructions + tools + context)
✅ Code repository they can deploy to production

---

## 📚 Post-Workshop Resources

### Immediate Next Steps (Week 1)
1. **Replace Mock ATS with Real Greenhouse**
   - Use `integrations/ats/greenhouse.ts` (already built in repo)
   - Add your Greenhouse API key to `.env`
   - Uncomment ATS sync in screening agent

2. **Add SMS Notification**
   - Send SMS after screening with results
   - Use Twilio SMS API (code provided in `modules/notifications/`)

3. **Deploy to Production**
   - Deploy to Heroku/AWS/Google Cloud
   - Configure production environment variables
   - Set up monitoring

### Extended Features (Weeks 2-4)
- **Scheduling Agent**: AI schedules follow-up interviews
- **Multi-language Support**: Spanish, French screening
- **Reference Checks**: Automated reference calling
- **Analytics Dashboard**: Screening metrics and insights

### Support Channels
- Twilio Docs: https://www.twilio.com/docs/voice/conversationrelay
- Sense Developer Slack: [invite link]
- Office Hours: Fridays 2-3pm PT

---

## 🐛 Troubleshooting Guide

### Common Issues

**Issue**: "Error: Could not connect to OpenAI"
**Fix**: Check `OPENAI_API_KEY` in `.env` is correct and has credits

**Issue**: "Twilio webhook not receiving calls"
**Fix**:
1. Ensure ngrok is running: `npm run grok`
2. Update phone number webhook to point to: `https://YOUR-DOMAIN.ngrok-free.app/incoming-call`

**Issue**: "AI is not following my instructions"
**Fix**:
1. Check `instructions/en-US.md` for clarity
2. Make instructions more specific (e.g., "Ask exactly 5 questions")
3. Add examples in the prompt

**Issue**: "Tools not being called"
**Fix**:
1. Verify tool is added to `toolManifest` in agent config
2. Check tool description is clear enough for AI to understand when to use it
3. Add "You must use the recordAnswer tool for each question" to instructions

---

## 📝 Pre-Workshop Checklist for Instructor

- [ ] Test repo clone and npm install on fresh machine
- [ ] Verify all setup scripts work
- [ ] Prepare demo Twilio account with phone number
- [ ] Create slide deck with architecture diagrams
- [ ] Prepare 3-4 "challenge" customizations for attendees
- [ ] Set up shared Slack channel for real-time help
- [ ] Test ngrok domains work correctly
- [ ] Have backup phone numbers ready in case of issues
- [ ] Prepare "completed" version of code for reference

---

## 🎯 Success Metrics

Workshop is successful if:
- [ ] 80%+ of attendees complete a working prototype
- [ ] Each attendee successfully makes an AI-powered screening call
- [ ] Attendees understand how to customize agent behavior
- [ ] Attendees can explain the 3 core components (instructions, tools, context)
- [ ] At least 2 attendees show creative customizations

**End State**: Attendees leave with confidence to build production recruiting voice AI!
