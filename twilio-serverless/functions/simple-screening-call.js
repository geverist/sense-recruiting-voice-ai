/**
 * Twilio Function: Simple Screening Call (Serverless-Only Version)
 * This version works entirely within Twilio Serverless - no external app needed!
 *
 * Uses Twilio's built-in AI capabilities for a simpler workshop experience
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');
  const twiml = new twilio.twiml.VoiceResponse();

  // Get candidate info from request
  const {
    candidatePhone,
    candidateName = 'there',
    jobTitle = 'the position',
    // Configuration from advanced UI
    voiceProvider = 'elevenlabs',
    voiceName = '21m00Tcm4TlvDq8ikWAM', // Rachel by default
    agentPersonality = 'professional',
    promptMode = 'stateful'
  } = event;

  console.log('='.repeat(60));
  console.log('INITIATING SCREENING CALL');
  console.log('Candidate:', candidateName);
  console.log('Phone:', candidatePhone);
  console.log('Job:', jobTitle);
  console.log('Voice Provider:', voiceProvider);
  console.log('Voice:', voiceName);
  console.log('Prompt Mode:', promptMode);
  console.log('='.repeat(60));

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  try {
    // Initiate the outbound call
    const call = await client.calls.create({
      to: candidatePhone,
      from: context.DEFAULT_TWILIO_NUMBER,
      // This function will handle what happens when call is answered
      url: `https://${context.DOMAIN_NAME}/handle-screening-answer?` +
           `candidateName=${encodeURIComponent(candidateName)}&` +
           `jobTitle=${encodeURIComponent(jobTitle)}&` +
           `voiceProvider=${voiceProvider}&` +
           `voiceName=${encodeURIComponent(voiceName)}&` +
           `promptMode=${promptMode}`,
      statusCallback: `https://${context.DOMAIN_NAME}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'DetectMessageEnd',
      record: true,
      recordingStatusCallback: `https://${context.DOMAIN_NAME}/recording-status`,
      method: 'POST'
    });

    console.log(`✅ Call initiated successfully: ${call.sid}`);

    // Store metadata in Sync for tracking
    if (context.TWILIO_SYNC_SVC_SID) {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
      await syncClient.documents.create({
        uniqueName: `call_${call.sid}`,
        data: {
          callSid: call.sid,
          candidatePhone,
          candidateName,
          jobTitle,
          voiceProvider,
          voiceName,
          promptMode,
          initiatedAt: new Date().toISOString(),
          status: 'initiated'
        },
        ttl: 3600
      });
    }

    // Return success response
    const response = new twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setBody({
      success: true,
      callSid: call.sid,
      message: `Screening call initiated to ${candidateName}`
    });

    return callback(null, response);

  } catch (error) {
    console.error('❌ Error initiating call:', error);

    const response = new twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message
    });

    return callback(null, response);
  }
};
