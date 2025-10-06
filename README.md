# Sense Recruiting Voice AI

AI-powered voice automation for recruiting - candidate screening, interview scheduling, and reference checks built on Twilio Conversation Relay and OpenAI.

## 🚀 Features

### Candidate Screening
- Automated phone screening calls with multi-language support
- AI-powered engagement scoring (0-10 scale)
- Structured question/answer collection
- Real-time transcription and summarization
- Automatic ATS sync with screening results

### Interview Scheduling
- Intelligent availability matching between candidates and hiring teams
- Multi-calendar integration (Google Calendar, Outlook)
- Timezone coordination
- Automated calendar invites and reminders
- Rescheduling support with smart conflict detection

### Reference Checks
- Automated reference contact and verification
- Structured reference questions
- Employment verification
- Red flag detection
- FCRA-compliant process

### Compliance & Governance
- **TCPA Compliance**: Consent tracking and verification
- **Do Not Call Registry**: Automated DNC checking
- **SHAKEN/STIR**: Caller ID authentication
- **Opt-out Management**: Automatic preference tracking
- **Call Recording Disclosure**: Regulatory compliance

## 📋 Prerequisites

- Node.js >= 18.0.0
- Twilio Account with Conversation Relay enabled
- OpenAI API Key
- ATS Account (Greenhouse, Lever, or Workday)
- Google Calendar or Outlook integration
- ngrok account (for local development)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/sensehq/sense-recruiting-voice-ai.git
cd sense-recruiting-voice-ai

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

## ⚙️ Configuration

### Required Environment Variables

```bash
# Server
HOSTNAME=your-domain.ngrok-free.app
PORT=3333

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_API_KEY=SKxxx
TWILIO_API_SECRET=xxx
TWILIO_SYNC_SVC_SID=ISxxx
DEFAULT_TWILIO_NUMBER=+1xxx

# OpenAI
OPENAI_API_KEY=sk-xxx

# ATS Integration
ATS_PROVIDER=greenhouse
ATS_API_KEY=xxx
ATS_BASE_URL=https://harvest.greenhouse.io/v1

# Compliance
COMPLIANCE_MODE=strict
TCPA_CONSENT_REQUIRED=true
DNC_REGISTRY_API_KEY=xxx
```

## 🚀 Quick Start

### Step 1: Setup

```bash
# Run automated setup script
npm run setup

# Or run individual setup commands
npm run setup:apikey
npm run setup:sync
npm run setup:phone
npm run setup:compliance
```

### Step 2: Start Development

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start ngrok tunnel
npm run grok
```

### Step 3: Test

Call your Twilio number or trigger an outbound screening call:

```bash
# Test with a candidate
curl -X POST http://localhost:3333/screen-candidate \
  -H "Content-Type: application/json" \
  -d '{"candidateId": "candidate-uuid"}'
```

## 📁 Project Structure

```
sense-recruiting-voice-ai/
├── recruiting-agents/           # Specialized AI agents
│   ├── screening-agent/        # Phone screening agent
│   ├── scheduling-agent/       # Interview scheduling agent
│   └── reference-agent/        # Reference check agent
├── core/                       # Core conversation engine
│   ├── completion-server/      # LLM completion loop
│   ├── session-store/          # Conversation state management
│   ├── agent-resolver/         # Dynamic agent configuration
│   └── twilio/                 # Twilio integration layer
├── integrations/               # External system integrations
│   ├── ats/                    # ATS adapters (Greenhouse, Lever, etc.)
│   ├── calendar/               # Calendar integrations
│   ├── crm/                    # CRM integrations
│   └── compliance/             # Compliance services
├── modules/                    # Feature modules
│   ├── engagement-scoring/     # Candidate engagement scoring
│   ├── multi-language/         # Multi-language support
│   ├── compliance-monitoring/  # Compliance & governance
│   └── ats-sync/              # ATS bidirectional sync
└── shared/                     # Shared types and utilities
    ├── models/                 # Data models (Candidate, Job, etc.)
    ├── workflows/              # Workflow definitions
    └── types/                  # TypeScript types
```

## 🔧 Development

### Running Tests

```bash
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Linting & Formatting

```bash
npm run lint            # Run ESLint
npm run format          # Format with Prettier
```

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Agent Development Guide](./docs/AGENTS.md)
- [ATS Integration Guide](./docs/ATS_INTEGRATION.md)
- [Compliance Guide](./docs/COMPLIANCE.md)
- [API Reference](./docs/API.md)

## 🔐 Security & Compliance

This system is designed with security and compliance as first-class concerns:

- **TCPA Compliance**: All outbound calls require explicit consent
- **DNC Registry**: Automatic checking before every call
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete audit trail of all candidate interactions
- **GDPR/CCPA Ready**: Data deletion and export capabilities

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 🆘 Support

- Documentation: https://docs.sensehq.com/voice-ai
- Issues: https://github.com/sensehq/sense-recruiting-voice-ai/issues
- Email: support@sensehq.com
