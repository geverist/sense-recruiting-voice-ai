/**
 * Twilio Function: Screen Candidate
 * Initiates an outbound screening call to a candidate
 *
 * Expected parameters:
 * - candidateId: Unique ID for the candidate
 * - phone: E.164 formatted phone number
 * - firstName: Candidate's first name
 * - jobTitle: Job they applied for
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');

  // Use ACCOUNT_SID and AUTH_TOKEN from context (Twilio Serverless provides these)
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;

  const client = twilio(accountSid, authToken);

  const { candidateId, phone, firstName, jobTitle } = event;

  // Validation
  if (!candidateId || !phone || !firstName || !jobTitle) {
    return callback(null, {
      success: false,
      error: 'Missing required parameters: candidateId, phone, firstName, jobTitle'
    });
  }

  // Build callback URL for when call is answered
  const callbackUrl = `https://${context.DOMAIN_NAME}/outbound-call-answer`;

  try {
    // Initiate outbound call
    const call = await client.calls.create({
      to: phone,
      from: context.DEFAULT_TWILIO_NUMBER,
      url: callbackUrl,
      statusCallback: `https://${context.DOMAIN_NAME}/call-status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      machineDetection: 'DetectMessageEnd',
      record: true, // Compliance requirement
      recordingStatusCallback: `https://${context.DOMAIN_NAME}/recording-status`,
      // Pass metadata via URL parameters
      statusCallbackMethod: 'POST',
      method: 'POST'
    });

    // Store call metadata in Twilio Sync
    if (context.TWILIO_SYNC_SVC_SID) {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

      await syncClient.documents.create({
        uniqueName: `call_${call.sid}`,
        data: {
          callSid: call.sid,
          candidateId,
          firstName,
          jobTitle,
          phone,
          initiatedAt: new Date().toISOString(),
          status: 'initiated',
          // Store configuration for ConversationRelay
          agentConfig: event.agentConfig || {},
          voiceConfig: event.voiceConfig || {},
          llmConfig: event.llmConfig || {},
          knowledgeBase: event.knowledgeBase || [],
          tools: event.tools || []
        },
        ttl: 3600 // 1 hour TTL
      });
    }

    return callback(null, {
      success: true,
      callSid: call.sid,
      message: `Screening call initiated for ${firstName}`
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    return callback(null, {
      success: false,
      error: error.message
    });
  }
};
