/**
 * Twilio Function: Outbound Call Answer
 * Handles when an outbound screening call is answered
 * Generates TwiML to start the AI conversation
 */

exports.handler = async function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const twilio = require('twilio');

  const { CallSid, AnsweredBy } = event;

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;

  // Get call metadata from Sync
  let callData = {};
  try {
    const client = twilio(accountSid, authToken);
    if (context.TWILIO_SYNC_SVC_SID) {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
      const doc = await syncClient.documents(`call_${CallSid}`).fetch();
      callData = doc.data;
    }
  } catch (error) {
    console.error('Error fetching call data from Sync:', error);
  }

  // Handle answering machine / voicemail
  if (AnsweredBy === 'machine_start' || AnsweredBy === 'fax') {
    twiml.say({
      voice: 'Polly.Joanna'
    }, `Hi ${callData.firstName || 'there'}! This is Simon from the recruiting team.
        We received your application for ${callData.jobTitle || 'our open position'}.
        I'd love to chat about the role. Please call us back at your earliest convenience. Thanks!`);

    // Update call status in Sync
    if (context.TWILIO_SYNC_SVC_SID) {
      try {
        const client = twilio(accountSid, authToken);
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
        await syncClient.documents(`call_${CallSid}`).update({
          data: { ...callData, status: 'voicemail', answeredAt: new Date().toISOString() }
        });
      } catch (error) {
        console.error('Error updating Sync:', error);
      }
    }

    return callback(null, twiml);
  }

  // Live person answered - Connect to ConversationRelay for AI conversation
  if (context.HOSTNAME && context.HOSTNAME !== 'your-domain.ngrok-free.app') {
    // ConversationRelay is configured - use AI conversation
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

    // Configure ConversationRelay
    const relayConfig = {
      url: `wss://${context.HOSTNAME}/ws`,
      voice: voiceName,
      language: language,
      transcriptionProvider: 'twilio',
      ttsProvider: ttsProvider,
      dtmfDetection: true,
      // Pass all configuration to WebSocket
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

    const relay = connect.conversationRelay(relayConfig);

    // Enable Conversational Intelligence with Language Operators
    // Language Operators provide real-time transcription, PII redaction, sentiment analysis, etc.
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

    // Enable call recording for compliance and quality assurance
    connect.record({
      recordingStatusCallback: `https://${context.DOMAIN_NAME}/recording-status`,
      recordingStatusCallbackEvent: ['completed', 'failed'],
      trim: 'trim-silence'
    });

    console.log(`ConversationRelay connected for call ${CallSid} to ${context.HOSTNAME}`);
  } else {
    // Fallback: Simple message if HOSTNAME not configured
    twiml.say({
      voice: 'Polly.Joanna'
    }, `Hi ${callData.firstName || 'there'}! This is Simon from the recruiting team.
        Thanks so much for your interest in the ${callData.jobTitle || 'position'}.
        We're really excited about your application.
        Our team will review your profile and reach out within two business days to schedule an interview.
        Have a wonderful day!`);

    console.log(`Using fallback message for call ${CallSid} (HOSTNAME not configured)`);
  }

  // Update call status in Sync
  if (context.TWILIO_SYNC_SVC_SID) {
    try {
      const client = twilio(accountSid, authToken);
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
      await syncClient.documents(`call_${CallSid}`).update({
        data: { ...callData, status: 'in_progress', answeredAt: new Date().toISOString() }
      });
    } catch (error) {
      console.error('Error updating Sync:', error);
    }
  }

  return callback(null, twiml);
};
