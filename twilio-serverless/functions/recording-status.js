/**
 * Twilio Function: Recording Status
 * Handles recording completion and storage
 * Important for compliance and quality assurance
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');
  const {
    CallSid,
    RecordingSid,
    RecordingUrl,
    RecordingStatus,
    RecordingDuration
  } = event;

  console.log(`Recording ${RecordingSid} for call ${CallSid}: ${RecordingStatus}`);

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;

  if (RecordingStatus === 'completed') {
    // Store recording metadata in Sync
    if (context.TWILIO_SYNC_SVC_SID) {
      try {
        const client = twilio(accountSid, authToken);
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

        // Get existing call data
        const doc = await syncClient.documents(`call_${CallSid}`).fetch();
        const callData = doc.data;

        // Update with recording info
        await syncClient.documents(`call_${CallSid}`).update({
          data: {
            ...callData,
            recording: {
              sid: RecordingSid,
              url: RecordingUrl,
              duration: parseInt(RecordingDuration),
              completedAt: new Date().toISOString()
            }
          }
        });

        console.log(`Stored recording ${RecordingSid} metadata in Sync`);

        // Optional: Download and store recording in external storage
        // (S3, Google Cloud Storage, etc.) for long-term compliance
        // const recordingData = await client.recordings(RecordingSid).fetch();
        // await uploadToStorage(recordingData);

      } catch (error) {
        console.error('Error storing recording metadata:', error);
      }
    }
  }

  return callback(null, { success: true });
};
