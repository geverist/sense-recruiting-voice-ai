/**
 * Twilio Function: Send Candidate Experience Survey
 * Sends SMS survey after call completion
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');

  const { callSid, candidatePhone, candidateName, jobTitle } = event;

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const fromNumber = context.DEFAULT_TWILIO_NUMBER;

  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  try {
    const client = twilio(accountSid, authToken);

    // Survey link with embedded parameters
    const surveyUrl = `https://${context.DOMAIN_NAME}/survey.html?callSid=${callSid}&name=${encodeURIComponent(candidateName || 'there')}`;

    // Send SMS with survey
    const message = await client.messages.create({
      to: candidatePhone,
      from: fromNumber,
      body: `Hi ${candidateName || 'there'}! Thanks for speaking with us about the ${jobTitle || 'position'}. We'd love your feedback on the call. How natural did the AI sound? Please rate 1-5: ${surveyUrl}`
    });

    console.log(`Survey SMS sent to ${candidatePhone}: ${message.sid}`);

    // Store survey sent status in Sync if available
    if (context.TWILIO_SYNC_SVC_SID) {
      try {
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
        const doc = await syncClient.documents(`call_${callSid}`).fetch();

        await syncClient.documents(`call_${callSid}`).update({
          data: {
            ...doc.data,
            surveySent: true,
            surveySentAt: new Date().toISOString(),
            surveyMessageSid: message.sid
          }
        });
      } catch (syncError) {
        console.error('Error updating Sync:', syncError);
      }
    }

    response.setBody({
      success: true,
      messageSid: message.sid,
      surveyUrl: surveyUrl
    });

  } catch (error) {
    console.error('Error sending survey SMS:', error);
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message
    });
  }

  return callback(null, response);
};
