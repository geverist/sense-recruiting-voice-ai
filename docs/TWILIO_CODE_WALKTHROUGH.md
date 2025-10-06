# Twilio & ConversationRelay Code Walkthrough

## 🎯 Purpose
This guide highlights the **Twilio-specific code** in the workshop, showing attendees exactly how Twilio Voice, ConversationRelay, and other Twilio products power the AI recruiting assistant.

---

## 📞 Part 1: Initiating Outbound Calls (Twilio Voice API)

### File: `twilio-serverless/functions/simple-screening-call.js`

This function uses the **Twilio Voice API** to place outbound calls to candidates.

```javascript
/**
 * 🔵 TWILIO VOICE API - Initiate Outbound Call
 */

// Line 19: Initialize Twilio client
const client = twilio(accountSid, authToken);

// Lines 35-48: Create outbound call using Twilio Voice API
const call = await client.calls.create({
  // 🔵 TWILIO: Phone numbers in E.164 format
  to: candidatePhone,                          // Candidate's number
  from: context.DEFAULT_TWILIO_NUMBER,         // Your Twilio number

  // 🔵 TWILIO: TwiML webhook - called when candidate answers
  url: `https://${context.DOMAIN_NAME}/handle-screening-answer?...`,

  // 🔵 TWILIO: Status webhooks - track call lifecycle
  statusCallback: `https://${context.DOMAIN_NAME}/call-status`,
  statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],

  // 🔵 TWILIO: Answering Machine Detection
  machineDetection: 'DetectMessageEnd',  // Detects voicemail vs live person

  // 🔵 TWILIO: Call Recording for compliance
  record: true,
  recordingStatusCallback: `https://${context.DOMAIN_NAME}/recording-status`,

  method: 'POST'
});

console.log(`✅ Call initiated successfully: ${call.sid}`);
```

**Key Twilio Concepts:**
- **`client.calls.create()`** - Twilio Voice API method to initiate calls
- **`machineDetection`** - Twilio's AMD (Answering Machine Detection)
- **`statusCallback`** - Webhook for call state changes (initiated → ringing → answered → completed)
- **`record: true`** - Automatically records calls for compliance/quality
- **Call SID** - Unique identifier for each call (e.g., `CA1234...`)

---

## 🎙️ Part 2: Handling Call Connection (TwiML)

### File: `twilio-serverless/functions/handle-screening-answer.js`

When the candidate answers, Twilio requests TwiML instructions from this function.

```javascript
/**
 * 🔵 TWILIO TwiML - Voice Response Markup Language
 */

// Line 8: Create TwiML response object
const twiml = new twilio.twiml.VoiceResponse();

// Lines 31-43: VOICEMAIL DETECTION
if (AnsweredBy === 'machine_start' || AnsweredBy === 'fax') {
  console.log('📱 Voicemail detected - leaving message');

  // 🔵 TWILIO: <Say> verb - Text-to-Speech
  twiml.say({
    voice: 'Polly.Joanna'  // Amazon Polly voice via Twilio
  }, `Hi ${candidateName}! This is Simon from Twilio's recruiting team...`);

  return callback(null, twiml);
}

// Lines 65-82: VOICE CONFIGURATION
// Map UI settings to Twilio voice names
let twimlVoice = 'Polly.Brian'; // British voice for "Simon"

if (voiceProvider === 'amazon-polly') {
  twimlVoice = `Polly.${voiceName}`;  // e.g., "Polly.Joanna", "Polly.Matthew"
} else if (voiceProvider === 'google-tts') {
  twimlVoice = voiceName;             // e.g., "en-US-Neural2-A"
}

// Lines 88-99: GATHER USER INPUT
// 🔵 TWILIO: <Gather> verb - Collect speech or DTMF input
const gather = twiml.gather({
  input: 'speech',              // Accept spoken responses
  timeout: 5,                   // Wait 5 seconds for speech
  speechTimeout: 'auto',        // Auto-detect end of speech
  action: `https://${context.DOMAIN_NAME}/process-response?...`,  // Next step
  method: 'POST'
});

// 🔵 TWILIO: Nested <Say> inside <Gather>
gather.say({
  voice: twimlVoice
}, `Hi ${candidateName}, this is Simon, a recruiter for Twilio.
    I'm reaching out because you expressed interest in our ${jobTitle} position.
    Is now a good time to chat for a few minutes?`);

// Fallback if no input received
twiml.say({
  voice: twimlVoice
}, `I didn't hear anything. Please call us back when you're ready. Cheers!`);

// Return TwiML to Twilio
return callback(null, twiml);
```

**Key Twilio Concepts:**
- **TwiML** - XML-based language for controlling calls
- **`<Say>`** - Text-to-Speech verb (supports Amazon Polly, Google TTS voices)
- **`<Gather>`** - Collects user input (speech or DTMF tones)
- **`speechTimeout: 'auto'`** - Uses machine learning to detect when user stops speaking
- **`AnsweredBy`** - Parameter from AMD indicating if human or machine answered

---

## 💬 Part 3: Multi-Turn Conversation (Stateful Dialog)

### File: `twilio-serverless/functions/process-response.js`

This function handles the back-and-forth conversation flow.

```javascript
/**
 * 🔵 TWILIO: Stateful Multi-Turn Conversation
 */

// Line 9: Parse speech result from Twilio
const { CallSid, SpeechResult, step = '1' } = event;

console.log(`PROCESSING RESPONSE - Step ${step}`);
console.log('Speech Result:', SpeechResult);  // What candidate said

// Lines 36-120: CONVERSATION FLOW LOGIC
switch (currentStep) {
  case 1:
    // Check if they said "no" to "Is now a good time?"
    if (SpeechResult && SpeechResult.toLowerCase().includes('no')) {
      twiml.say({ voice: twimlVoice },
        `No worries at all! When would be a better time for us to chat?`);
      shouldContinue = false;
    } else {
      nextQuestion = `Brilliant! I see you're interested in working with us...`;
    }
    break;

  case 2:
    // Confirmed interest - ask about technical skills
    candidateData.interestedInRole = true;
    nextQuestion = `Can you tell me about your experience with React, Node.js...`;
    break;

  case 3:
    // Technical skills discussed - save to context
    candidateData.technicalSkills = SpeechResult;
    nextQuestion = `Do you have at least five years of experience?`;
    break;

  // ... continues through 6 steps
}

// Lines 124-143: CONTINUE CONVERSATION
if (shouldContinue && nextQuestion) {
  // 🔵 TWILIO: Chain another <Gather> for next question
  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    speechTimeout: 'auto',
    action: `https://${context.DOMAIN_NAME}/process-response?...&step=${nextStep}`,
    method: 'POST'
  });

  gather.say({ voice: twimlVoice }, nextQuestion);

  // Fallback
  twiml.say({ voice: twimlVoice },
    `Sorry, I didn't catch that. Please feel free to call us back. Cheers!`);
}

return callback(null, twiml);
```

**Key Twilio Concepts:**
- **Stateful Conversation** - Each response triggers a new TwiML request with updated context
- **`SpeechResult`** - Twilio's speech-to-text transcription of what candidate said
- **Chained `<Gather>` verbs** - Each question leads to the next, creating dialog flow
- **`action` URL with parameters** - Passes state (step number, candidate name, etc.) between requests

---

## 🗄️ Part 4: Data Persistence (Twilio Sync)

### Throughout all functions

Twilio Sync stores conversation state across multiple webhook requests.

```javascript
/**
 * 🔵 TWILIO SYNC - Real-time State Synchronization
 */

// Line 51-72: STORE CALL METADATA
if (context.TWILIO_SYNC_SVC_SID) {
  // 🔵 TWILIO: Initialize Sync client
  const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

  // 🔵 TWILIO: Create a Sync Document for this call
  await syncClient.documents.create({
    uniqueName: `call_${call.sid}`,  // Use Call SID as key
    data: {
      callSid: call.sid,
      candidatePhone,
      candidateName,
      jobTitle,
      voiceProvider,
      voiceName,
      promptMode,
      initiatedAt: new Date().toISOString(),
      status: 'initiated',
      // This data persists across webhook calls!
      conversationHistory: [],
      candidateData: {}
    },
    ttl: 3600  // Auto-delete after 1 hour
  });
}

// Later in process-response.js...

// Lines 33-44: RETRIEVE CONVERSATION HISTORY
let conversationHistory = [];
if (context.TWILIO_SYNC_SVC_SID) {
  const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

  // 🔵 TWILIO: Fetch existing Sync Document
  const doc = await syncClient.documents(`call_${CallSid}`).fetch();
  conversationHistory = doc.data.conversationHistory || [];
  candidateData = doc.data.candidateData || {};
}

// Lines 50-52: UPDATE WITH NEW RESPONSE
conversationHistory.push({
  step: parseInt(step),
  question: getQuestionForStep(step),
  answer: SpeechResult,  // What they said
  timestamp: new Date().toISOString()
});

// Lines 145-160: SAVE UPDATED STATE BACK TO SYNC
await syncClient.documents(`call_${CallSid}`).update({
  data: {
    ...doc.data,
    conversationHistory,    // Full conversation so far
    candidateData,          // Accumulated candidate info
    currentStep: nextStep
  }
});
```

**Key Twilio Concepts:**
- **Twilio Sync** - Real-time data storage and synchronization
- **Sync Documents** - Key-value store (we use Call SID as the key)
- **`ttl`** - Time-to-live, auto-deletes old data
- **Fetch → Update pattern** - Read existing state, modify, write back
- **Persistence across webhooks** - Each TwiML request can access shared state

---

## 📊 Part 5: Call Lifecycle Tracking (Status Callbacks)

### File: `twilio-serverless/functions/call-status.js`

Twilio fires webhooks at each stage of the call lifecycle.

```javascript
/**
 * 🔵 TWILIO: Call Status Webhooks
 */

// Line 8: Parse status callback parameters
const { CallSid, CallStatus, CallDuration } = event;

console.log(`Call ${CallSid} status: ${CallStatus}`);

// CallStatus values from Twilio:
// - 'initiated' = Call is starting
// - 'ringing' = Phone is ringing
// - 'in-progress' = Call connected
// - 'completed' = Call ended
// - 'failed' = Call failed
// - 'busy' = Line was busy
// - 'no-answer' = Candidate didn't pick up

// Lines 16-38: UPDATE CALL STATUS IN SYNC
if (context.TWILIO_SYNC_SVC_SID) {
  const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

  // 🔵 TWILIO: Fetch call document from Sync
  const doc = await syncClient.documents(`call_${CallSid}`).fetch();
  const callData = doc.data;

  // 🔵 TWILIO: Update with new status
  await syncClient.documents(`call_${CallSid}`).update({
    data: {
      ...callData,
      status: CallStatus,           // Current call state
      lastUpdated: new Date().toISOString(),
      ...(CallDuration && { duration: parseInt(CallDuration) })  // Total call time
    }
  });
}

// Lines 40-75: POST-CALL ACTIONS
if (CallStatus === 'completed' && CallDuration && parseInt(CallDuration) > 30) {
  // Call lasted more than 30 seconds - send survey!

  const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
  const doc = await syncClient.documents(`call_${CallSid}`).fetch();
  const callData = doc.data;

  if (callData.candidatePhone && callData.status !== 'voicemail') {
    // 🔵 TWILIO: Send SMS survey via Twilio Messaging API
    const surveyUrl = `https://${context.DOMAIN_NAME}/send-survey`;
    await fetch(surveyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        callSid: CallSid,
        candidatePhone: callData.candidatePhone,
        candidateName: callData.firstName,
        jobTitle: callData.jobTitle
      })
    });
  }
}
```

**Key Twilio Concepts:**
- **Status Callbacks** - Webhooks fired at each call stage
- **Call Duration** - Twilio provides total call time in seconds
- **Event-driven architecture** - Trigger actions based on call events
- **Integration point** - Where you connect to ATS, CRM, analytics, etc.

---

## 📱 Part 6: SMS Integration (Candidate Surveys)

### File: `twilio-serverless/functions/send-survey.js`

After call completion, send SMS with survey link.

```javascript
/**
 * 🔵 TWILIO MESSAGING API - Send SMS
 */

// Lines 18-27: SEND SMS MESSAGE
const client = twilio(accountSid, authToken);

// 🔵 TWILIO: Create SMS message
const message = await client.messages.create({
  to: candidatePhone,                    // Candidate's mobile number
  from: fromNumber,                      // Your Twilio SMS-enabled number
  body: `Hi ${candidateName}! Thanks for speaking with us about the ${jobTitle}.
         We'd love your feedback on the call.
         How natural did the AI sound? Please rate 1-5: ${surveyUrl}`
});

console.log(`Survey SMS sent to ${candidatePhone}: ${message.sid}`);

// Lines 32-47: TRACK SMS IN SYNC
if (context.TWILIO_SYNC_SVC_SID) {
  const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
  const doc = await syncClient.documents(`call_${callSid}`).fetch();

  // 🔵 TWILIO: Update Sync with SMS tracking
  await syncClient.documents(`call_${callSid}`).update({
    data: {
      ...doc.data,
      surveySent: true,
      surveySentAt: new Date().toISOString(),
      surveyMessageSid: message.sid   // Twilio SMS identifier
    }
  });
}
```

**Key Twilio Concepts:**
- **Twilio Messaging API** - Send SMS programmatically
- **`client.messages.create()`** - API method to send SMS
- **Message SID** - Unique identifier for each SMS (e.g., `SM1234...`)
- **Cross-channel coordination** - Voice call triggers SMS follow-up

---

## 🎯 Part 7: ConversationRelay (Advanced - Full AI Integration)

### File: `twilio-serverless/functions/outbound-call-answer.js`

For **true conversational AI** with OpenAI, use ConversationRelay.

```javascript
/**
 * 🔵 TWILIO CONVERSATIONRELAY - Real-time AI Conversations
 *
 * Note: This requires running the main Express app (app.ts) with WebSocket server
 * For simplified workshop, we use basic TwiML, but this shows the full power!
 */

// Lines 54-100: CONNECT TO CONVERSATIONRELAY
if (context.HOSTNAME && context.HOSTNAME !== 'your-domain.ngrok-free.app') {
  // ConversationRelay is configured - use AI conversation

  // 🔵 TWILIO: Create <Connect> verb for ConversationRelay
  const connect = twiml.connect();

  // Parse voice configuration from call metadata
  const voiceConfig = callData.voiceConfig || {};
  const voiceProvider = voiceConfig.provider || 'amazon-polly';
  const voiceName = voiceConfig.name || 'Polly.Joanna';
  const language = voiceConfig.language || 'en-US';

  // Map provider names to ConversationRelay TTS providers
  let ttsProvider = 'amazon-polly';
  if (voiceProvider === 'google-tts') {
    ttsProvider = 'google';
  } else if (voiceProvider === 'elevenlabs') {
    ttsProvider = 'elevenlabs';
  }

  // 🔵 TWILIO CONVERSATIONRELAY: Configure the AI connection
  const relayConfig = {
    url: `wss://${context.HOSTNAME}/ws`,      // WebSocket to your AI server
    voice: voiceName,                          // TTS voice to use
    language: language,                        // Language code
    transcriptionProvider: 'twilio',           // Twilio's speech-to-text
    ttsProvider: ttsProvider,                  // Text-to-speech provider
    dtmfDetection: true,                       // Detect keypad input

    // 🔵 TWILIO: Pass configuration to your AI via WebSocket parameters
    parameters: {
      callSid: CallSid,
      candidateId: callData.candidateId || '',
      firstName: callData.firstName || '',
      jobTitle: callData.jobTitle || '',
      agentConfig: JSON.stringify(callData.agentConfig || {}),
      voiceConfig: JSON.stringify(callData.voiceConfig || {}),
      llmConfig: JSON.stringify(callData.llmConfig || {}),
      knowledgeBase: JSON.stringify(callData.knowledgeBase || []),
      tools: JSON.stringify(callData.tools || [])
    }
  };

  // Add ElevenLabs API key if using ElevenLabs voices
  if (ttsProvider === 'elevenlabs' && context.ELEVENLABS_API_KEY) {
    relayConfig.ttsApiKey = context.ELEVENLABS_API_KEY;
  }

  // 🔵 TWILIO: Create ConversationRelay connection
  const relay = connect.conversationRelay(relayConfig);

  // 🔵 TWILIO CONVERSATIONAL INTELLIGENCE: Language Operators
  if (context.INTELLIGENCE_SERVICE_SID) {
    relay.languageOperators({
      serviceSid: context.INTELLIGENCE_SERVICE_SID,

      // Real-time transcription with PII redaction
      transcription: {
        enabled: true,
        profanityFilter: true,
        redactPii: true,
        piiTypes: ['ssn', 'credit_card', 'email', 'phone_number']
      },

      // Sentiment analysis
      sentiment: {
        enabled: true
      },

      // Entity extraction (names, companies, locations)
      entityExtraction: {
        enabled: true
      },

      // Language detection
      languageDetection: {
        enabled: true
      }
    });
  }

  // 🔵 TWILIO: Enable call recording with ConversationRelay
  connect.record({
    recordingStatusCallback: `https://${context.DOMAIN_NAME}/recording-status`,
    recordingStatusCallbackEvent: ['completed', 'failed'],
    trim: 'trim-silence'
  });

  console.log(`ConversationRelay connected for call ${CallSid}`);
}
```

**Key Twilio Concepts:**
- **ConversationRelay** - Bridges phone calls to AI via WebSocket
- **`<Connect><ConversationRelay>`** - TwiML verbs for AI connection
- **Bidirectional streaming** - Audio flows in real-time between Twilio ↔ Your AI
- **`transcriptionProvider`** - Twilio's speech-to-text engine
- **`ttsProvider`** - Choose voice provider (Amazon Polly, Google, ElevenLabs)
- **`parameters`** - Pass custom data to your WebSocket handler
- **Language Operators** - Real-time transcription, PII redaction, sentiment analysis
- **Conversational Intelligence** - Twilio's AI-powered analytics suite

---

## 🎓 Workshop Teaching Points

### Hour 1: Setup (Show these concepts)
1. **Twilio Voice API** - `client.calls.create()`
2. **Status Callbacks** - Track call lifecycle
3. **Answering Machine Detection** - Voicemail vs. live person
4. **Call Recording** - Compliance requirement

### Hour 2: Configuration (Build these features)
5. **TwiML `<Say>`** - Text-to-speech with voice selection
6. **TwiML `<Gather>`** - Collect speech input
7. **Twilio Sync** - Persist conversation state
8. **Stateful Dialog** - Multi-turn conversations

### Hour 3: Advanced (Demonstrate these integrations)
9. **ConversationRelay** - Real-time AI conversations
10. **Language Operators** - PII redaction, sentiment analysis
11. **Twilio Messaging** - SMS surveys
12. **Cross-channel** - Voice → SMS → Email workflows

---

## 📋 Twilio Products Used

| Product | Purpose | Code Location |
|---------|---------|---------------|
| **Voice API** | Initiate outbound calls | `simple-screening-call.js:35-48` |
| **TwiML** | Control call flow | All `functions/*.js` files |
| **Sync** | Store conversation state | `process-response.js:33-44, 145-160` |
| **ConversationRelay** | Real-time AI integration | `outbound-call-answer.js:74-127` |
| **Messaging API** | Send SMS surveys | `send-survey.js:18-27` |
| **Conversational Intelligence** | Transcription, sentiment, PII | `outbound-call-answer.js:104-127` |
| **Serverless Functions** | Host webhook logic | Entire `twilio-serverless/` folder |
| **Serverless Assets** | Host web UIs | `twilio-serverless/assets/*.html` |

---

## 🚀 Key Takeaway

**Every interaction in this workshop is powered by Twilio:**

1. **📞 Call placed** → Twilio Voice API
2. **🎙️ Candidate speaks** → Twilio Speech Recognition
3. **🤖 AI responds** → Twilio TTS or ConversationRelay
4. **💾 State saved** → Twilio Sync
5. **📊 Call tracked** → Twilio Status Callbacks
6. **📱 Survey sent** → Twilio Messaging API
7. **🔒 PII protected** → Twilio Conversational Intelligence

All orchestrated through **Twilio Serverless Functions** - no infrastructure to manage!

---

**Use this guide during the workshop to highlight Twilio-specific code when walking through the architecture!** 🎓
