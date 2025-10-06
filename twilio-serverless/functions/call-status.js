/**
 * Twilio Function: Call Status
 * Tracks call lifecycle events (initiated, ringing, answered, completed)
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');
  const { CallSid, CallStatus, CallDuration } = event;

  console.log(`Call ${CallSid} status: ${CallStatus}`);

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;

  // Update call status in Twilio Sync
  if (context.TWILIO_SYNC_SVC_SID) {
    try {
      const client = twilio(accountSid, authToken);
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

      const doc = await syncClient.documents(`call_${CallSid}`).fetch();
      const callData = doc.data;

      await syncClient.documents(`call_${CallSid}`).update({
        data: {
          ...callData,
          status: CallStatus,
          lastUpdated: new Date().toISOString(),
          ...(CallDuration && { duration: parseInt(CallDuration) })
        }
      });

      console.log(`Updated call ${CallSid} in Sync with status ${CallStatus}`);
    } catch (error) {
      console.error('Error updating call status in Sync:', error);
    }
  }

  // If call completed, send candidate experience survey
  if (CallStatus === 'completed' && CallDuration && parseInt(CallDuration) > 30) {
    try {
      const client = twilio(accountSid, authToken);

      // Get call data from Sync to get candidate phone and name
      if (context.TWILIO_SYNC_SVC_SID) {
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
        const doc = await syncClient.documents(`call_${CallSid}`).fetch();
        const callData = doc.data;

        // Only send survey if we have candidate contact info and they didn't go to voicemail
        if (callData.candidatePhone && callData.status !== 'voicemail') {
          // Call the send-survey function
          const surveyUrl = `https://${context.DOMAIN_NAME}/send-survey`;
          const surveyResponse = await fetch(surveyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              callSid: CallSid,
              candidatePhone: callData.candidatePhone,
              candidateName: callData.firstName || 'there',
              jobTitle: callData.jobTitle || 'position'
            })
          });

          if (surveyResponse.ok) {
            console.log(`Survey SMS sent for completed call ${CallSid}`);
          }
        }
      }
    } catch (error) {
      console.error('Error sending survey:', error);
      // Don't fail the callback if survey sending fails
    }
  }

  return callback(null, { success: true });
};
