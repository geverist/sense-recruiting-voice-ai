/**
 * Twilio Function: Handle Screening Answer
 * Called when candidate answers the screening call
 * Generates TwiML with proper voice configuration from UI settings
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');
  const twiml = new twilio.twiml.VoiceResponse();

  // Get parameters from URL (passed from simple-screening-call)
  const {
    CallSid,
    AnsweredBy,
    candidateName = 'there',
    jobTitle = 'the position',
    voiceProvider = 'elevenlabs',
    voiceName = '21m00Tcm4TlvDq8ikWAM',
    promptMode = 'stateful'
  } = event;

  console.log('='.repeat(60));
  console.log('CALL ANSWERED');
  console.log('Call SID:', CallSid);
  console.log('Answered By:', AnsweredBy);
  console.log('Candidate:', candidateName);
  console.log('Voice Provider:', voiceProvider);
  console.log('Voice Name:', voiceName);
  console.log('Prompt Mode:', promptMode);
  console.log('='.repeat(60));

  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  // Handle answering machine / voicemail
  if (AnsweredBy === 'machine_start' || AnsweredBy === 'fax') {
    console.log('📱 Voicemail detected - leaving message');

    twiml.say({
      voice: 'Polly.Joanna'
    }, `Hi ${candidateName}! This is Simon from Twilio's recruiting team. ` +
       `We received your application for ${jobTitle}. ` +
       `I'd love to chat about the role. Please call us back at your earliest convenience. Cheers!`);

    // Update status in Sync
    if (context.TWILIO_SYNC_SVC_SID) {
      try {
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
        const doc = await syncClient.documents(`call_${CallSid}`).fetch();
        await syncClient.documents(`call_${CallSid}`).update({
          data: { ...doc.data, status: 'voicemail', answeredAt: new Date().toISOString() }
        });
      } catch (error) {
        console.error('Sync update error:', error);
      }
    }

    return callback(null, twiml);
  }

  // ==================================================================
  // LIVE PERSON ANSWERED - Use voice configuration from UI
  // ==================================================================

  console.log('👤 Live person answered - configuring voice...');

  // Map voice provider to TwiML voice parameter
  let twimlVoice = 'Polly.Joanna'; // Default fallback

  if (voiceProvider === 'elevenlabs') {
    // ElevenLabs voices - use the voice ID directly
    // Twilio ConversationRelay will handle these
    console.log(`🎙️ Using ElevenLabs voice: ${voiceName}`);

    // Map ElevenLabs IDs to friendly names for fallback
    const elevenLabsVoices = {
      '21m00Tcm4TlvDq8ikWAM': 'Rachel',
      'AZnzlk1XvdvUeBnXmlld': 'Domi',
      'EXAVITQu4vr4xnSDxMaL': 'Bella',
      'ErXwobaYiN019PkySvjV': 'Antoni',
      'MF3mGyEYCl7XYWbV9V6O': 'Elli',
      'TxGEqnHWrfWFTfGW9XjX': 'Josh',
      'VR6AewLTigWG4xSOukaG': 'Arnold',
      'pNInz6obpgDQGcFmaJgB': 'Adam',
      'yoZ06aMxZJJ28mfd3POQ': 'Sam',
      'onwK4e9ZLuTAKqWW03F9': 'Daniel',
      'XB0fDUnXU5powFXDhCwa': 'Charlotte'
    };

    // For now, use Amazon Polly as fallback (ConversationRelay integration would use ElevenLabs)
    // In full implementation, this would connect to ConversationRelay WebSocket
    twimlVoice = 'Polly.Brian'; // British voice for Simon

  } else if (voiceProvider === 'amazon-polly') {
    // Amazon Polly voices
    twimlVoice = `Polly.${voiceName}`;
    console.log(`🎙️ Using Amazon Polly voice: ${twimlVoice}`);

  } else if (voiceProvider === 'google-tts') {
    // Google TTS voices
    twimlVoice = voiceName;
    console.log(`🎙️ Using Google TTS voice: ${twimlVoice}`);
  }

  // ==================================================================
  // GATHER user input with configured voice
  // ==================================================================

  const gather = twiml.gather({
    input: 'speech',
    timeout: 5,
    speechTimeout: 'auto',
    // 🤖 Use AI-powered response handler for dynamic conversations
    action: `https://${context.DOMAIN_NAME}/ai-process-response?` +
            `candidateName=${encodeURIComponent(candidateName)}&` +
            `jobTitle=${encodeURIComponent(jobTitle)}&` +
            `voiceProvider=${voiceProvider}&` +
            `voiceName=${encodeURIComponent(voiceName)}&` +
            `step=1`,
    method: 'POST'
  });

  // Initial greeting with configured voice
  gather.say({
    voice: twimlVoice
  }, `Hi ${candidateName}, this is Simon, a recruiter for Twilio. ` +
     `I'm reaching out because you expressed interest in our ${jobTitle} position. ` +
     `Is now a good time to chat for a few minutes?`);

  // If no input, repeat
  twiml.say({
    voice: twimlVoice
  }, `I didn't hear anything. Please call us back when you're ready. Cheers!`);

  // Update status in Sync
  if (context.TWILIO_SYNC_SVC_SID) {
    try {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
      const doc = await syncClient.documents(`call_${CallSid}`).fetch();
      await syncClient.documents(`call_${CallSid}`).update({
        data: {
          ...doc.data,
          status: 'in_progress',
          answeredAt: new Date().toISOString(),
          voiceUsed: twimlVoice
        }
      });
    } catch (error) {
      console.error('Sync update error:', error);
    }
  }

  console.log(`✅ TwiML generated with voice: ${twimlVoice}`);
  return callback(null, twiml);
};
