/**
 * Twilio Function: Submit Candidate Survey
 * Stores survey responses in Twilio Sync
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');

  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (event.request && event.request.method === 'OPTIONS') {
    return callback(null, response);
  }

  const { callSid, naturalness, wouldRecommend, feedback, submittedAt } = event;

  // Use ACCOUNT_SID and AUTH_TOKEN from context
  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;

  try {
    const client = twilio(accountSid, authToken);

    // Store survey response in Sync
    if (context.TWILIO_SYNC_SVC_SID) {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);

      // Get existing call data
      let callData = {};
      try {
        const doc = await syncClient.documents(`call_${callSid}`).fetch();
        callData = doc.data;
      } catch (error) {
        console.log('Call document not found, creating new one');
      }

      // Update with survey data
      await syncClient.documents(`call_${callSid}`).update({
        data: {
          ...callData,
          survey: {
            naturalness: parseInt(naturalness),
            wouldRecommend: wouldRecommend === true || wouldRecommend === 'true',
            feedback: feedback || '',
            submittedAt: submittedAt
          }
        }
      });

      // Also store in a surveys list for aggregate analytics
      try {
        const surveysList = await syncClient.syncLists('survey_responses');
        await surveysList.syncListItems.create({
          data: {
            callSid: callSid,
            naturalness: parseInt(naturalness),
            wouldRecommend: wouldRecommend === true || wouldRecommend === 'true',
            feedback: feedback || '',
            submittedAt: submittedAt
          }
        });
      } catch (listError) {
        // List might not exist, create it
        try {
          await syncClient.syncLists.create({ uniqueName: 'survey_responses' });
          const surveysList = await syncClient.syncLists('survey_responses');
          await surveysList.syncListItems.create({
            data: {
              callSid: callSid,
              naturalness: parseInt(naturalness),
              wouldRecommend: wouldRecommend === true || wouldRecommend === 'true',
              feedback: feedback || '',
              submittedAt: submittedAt
            }
          });
        } catch (createError) {
          console.error('Error creating survey list:', createError);
        }
      }
    }

    console.log(`Survey submitted for call ${callSid}: ${naturalness}/5, recommend: ${wouldRecommend}`);

    response.setBody({
      success: true,
      message: 'Survey submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting survey:', error);
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message
    });
  }

  return callback(null, response);
};
