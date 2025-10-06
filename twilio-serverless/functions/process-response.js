/**
 * Twilio Function: Process Response
 * Handles multi-turn conversation with stateful context
 * This creates a true back-and-forth dialog!
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');
  const twiml = new twilio.twiml.VoiceResponse();

  const {
    CallSid,
    SpeechResult,
    candidateName,
    jobTitle,
    voiceProvider,
    voiceName,
    step = '1'
  } = event;

  console.log('='.repeat(60));
  console.log(`PROCESSING RESPONSE - Step ${step}`);
  console.log('Speech Result:', SpeechResult);
  console.log('='.repeat(60));

  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  // Determine voice to use
  let twimlVoice = 'Polly.Brian'; // Default British Simon voice

  if (voiceProvider === 'elevenlabs') {
    // Map ElevenLabs IDs to similar Amazon Polly voices
    const elevenLabsToPolly = {
      '21m00Tcm4TlvDq8ikWAM': 'Polly.Joanna',      // Rachel
      'AZnzlk1XvdvUeBnXmlld': 'Polly.Ivy',         // Domi
      'EXAVITQu4vr4xnSDxMaL': 'Polly.Kendra',      // Bella
      'ErXwobaYiN019PkySvjV': 'Polly.Brian',       // Antoni
      'MF3mGyEYCl7XYWbV9V6O': 'Polly.Emma',        // Elli
      'TxGEqnHWrfWFTfGW9XjX': 'Polly.Matthew',     // Josh
      'VR6AewLTigWG4xSOukaG': 'Polly.Russell',     // Arnold
      'pNInz6obpgDQGcFmaJgB': 'Polly.Joey',        // Adam
      'yoZ06aMxZJJ28mfd3POQ': 'Polly.Kimberly',    // Sam
      'onwK4e9ZLuTAKqWW03F9': 'Polly.Justin',      // Daniel
      'XB0fDUnXU5powFXDhCwa': 'Polly.Amy'          // Charlotte
    };
    twimlVoice = elevenLabsToPolly[voiceName] || 'Polly.Brian';
  } else if (voiceProvider === 'amazon-polly') {
    twimlVoice = `Polly.${voiceName}`;
  } else if (voiceProvider === 'google-tts') {
    twimlVoice = voiceName;
  }

  // Get conversation history from Sync
  let conversationHistory = [];
  let candidateData = {};
  let candidatePhone = '';

  if (context.TWILIO_SYNC_SVC_SID) {
    try {
      const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
      const doc = await syncClient.documents(`call_${CallSid}`).fetch();
      conversationHistory = doc.data.conversationHistory || [];
      candidateData = doc.data.candidateData || {};
      candidatePhone = doc.data.candidatePhone || ''; // Get phone number from initial call data
    } catch (error) {
      console.log('No existing conversation history');
    }
  }

  // Save current response to history
  conversationHistory.push({
    step: parseInt(step),
    question: getQuestionForStep(step),
    answer: SpeechResult,
    timestamp: new Date().toISOString()
  });

  // ==================================================================
  // CONVERSATION FLOW - Multi-turn dialog
  // ==================================================================

  const currentStep = parseInt(step);
  const nextStep = currentStep + 1;

  let nextQuestion = '';
  let shouldContinue = true;

  switch (currentStep) {
    case 1:
      // They answered if now is a good time
      if (SpeechResult && SpeechResult.toLowerCase().includes('no')) {
        twiml.say({ voice: twimlVoice },
          `No worries at all! When would be a better time for us to chat? ` +
          `Feel free to call us back, or I can ring you tomorrow. What works best?`);
        shouldContinue = false;
      } else {
        nextQuestion = `Brilliant! I see you're interested in working with us as a ${jobTitle}. ` +
                      `Does that sound right?`;
      }
      break;

    case 2:
      // Confirmed interest in role
      candidateData.interestedInRole = true;
      nextQuestion = `Wonderful! Twilio is shaping the future of communications with a remote-first approach. ` +
                    `We're committed to innovation, diversity, and empowering developers worldwide. ` +
                    `Can you tell me about your experience with technologies like React, Node dot JS, and distributed systems?`;
      break;

    case 3:
      // Technical skills discussed
      candidateData.technicalSkills = SpeechResult;
      nextQuestion = `That's excellent experience! Do you have at least five years working with server-side programming or modern Web stacks?`;
      break;

    case 4:
      // Years of experience
      candidateData.hasRequiredExperience = SpeechResult && SpeechResult.toLowerCase().includes('yes');
      nextQuestion = `Great! What salary range are you targeting for this role?`;
      break;

    case 5:
      // Salary expectations
      candidateData.salaryExpectations = SpeechResult;
      nextQuestion = `Thanks for sharing that. Are you looking for a fully remote role, ` +
                    `or would you consider occasional in-person collaboration?`;
      break;

    case 6:
      // Work preferences
      candidateData.workPreference = SpeechResult;

      // 🔧 TOOL INVOCATION: Schedule Interview
      // Check if candidate qualifies for interview
      if (candidateData.hasRequiredExperience) {
        nextQuestion = `You sound like a great fit! Let me check our calendar for available interview times. ` +
                      `Would you prefer an interview slot on Tuesday at 2 PM or Thursday at 10 AM Pacific time?`;
      } else {
        // Not qualified - skip to final step
        twiml.say({ voice: twimlVoice },
          `Thank you for sharing all that information, ${candidateName}. ` +
          `While this specific role requires 5+ years of experience, I'd love to share your profile with other teams. ` +
          `You'll hear from us soon. Have a brilliant day!`);
        shouldContinue = false;
      }
      break;

    case 7:
      // They chose an interview time
      const chosenTime = SpeechResult;
      candidateData.interviewTime = chosenTime;

      // Parse which time they chose
      let scheduledDateTime = '';
      if (chosenTime.toLowerCase().includes('tuesday')) {
        scheduledDateTime = 'Tuesday, 2:00 PM PT';
        candidateData.interviewDateTime = 'Tuesday 2:00 PM PT';
      } else {
        scheduledDateTime = 'Thursday, 10:00 AM PT';
        candidateData.interviewDateTime = 'Thursday 10:00 AM PT';
      }

      // 🔧 TOOL INVOCATION: Send SMS Confirmation
      console.log('🔧 TOOL CALL: scheduleInterview()');
      console.log('   Interview scheduled for:', scheduledDateTime);

      console.log('🔧 TOOL CALL: sendSMS()');
      console.log('   Sending confirmation to:', candidatePhone);

      // Actually send the SMS!
      try {
        const message = await client.messages.create({
          to: candidatePhone,
          from: context.DEFAULT_TWILIO_NUMBER,
          body: `Hi ${candidateName}! Your interview for ${jobTitle} at Twilio is scheduled for ${scheduledDateTime}. ` +
                `You'll receive a calendar invite soon. Looking forward to it! - Simon`
        });
        console.log(`✅ SMS sent successfully: ${message.sid}`);
      } catch (smsError) {
        console.error('❌ Failed to send SMS:', smsError);
      }

      // Final confirmation message
      twiml.say({ voice: twimlVoice },
        `Perfect! I'm booking you for ${scheduledDateTime}. ` +
        `You'll receive a calendar invite at your email and an SMS confirmation text momentarily. ` +
        `Our hiring manager Sarah is looking forward to speaking with you! ` +
        `Thanks so much for your time today, ${candidateName}. Have a brilliant day!`);

      shouldContinue = false;

      // Mark as completed
      if (context.TWILIO_SYNC_SVC_SID) {
        try {
          const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
          const doc = await syncClient.documents(`call_${CallSid}`).fetch();
          await syncClient.documents(`call_${CallSid}`).update({
            data: {
              ...doc.data,
              status: 'completed',
              conversationHistory,
              candidateData,
              completedAt: new Date().toISOString(),
              recommendation: candidateData.hasRequiredExperience ? 'advance' : 'review'
            }
          });
        } catch (error) {
          console.error('Sync update error:', error);
        }
      }

      break;

    default:
      shouldContinue = false;
  }

  // ==================================================================
  // CONTINUE CONVERSATION or END
  // ==================================================================

  if (shouldContinue && nextQuestion) {
    const gather = twiml.gather({
      input: 'speech',
      timeout: 5,
      speechTimeout: 'auto',
      action: `https://${context.DOMAIN_NAME}/process-response?` +
              `candidateName=${encodeURIComponent(candidateName)}&` +
              `jobTitle=${encodeURIComponent(jobTitle)}&` +
              `voiceProvider=${voiceProvider}&` +
              `voiceName=${encodeURIComponent(voiceName)}&` +
              `step=${nextStep}`,
      method: 'POST'
    });

    gather.say({ voice: twimlVoice }, nextQuestion);

    // Fallback if no response
    twiml.say({ voice: twimlVoice },
      `Sorry, I didn't catch that. Please feel free to call us back. Cheers!`);

    // Update Sync with conversation history
    if (context.TWILIO_SYNC_SVC_SID) {
      try {
        const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
        const doc = await syncClient.documents(`call_${CallSid}`).fetch();
        await syncClient.documents(`call_${CallSid}`).update({
          data: {
            ...doc.data,
            conversationHistory,
            candidateData,
            currentStep: nextStep
          }
        });
      } catch (error) {
        console.error('Sync update error:', error);
      }
    }
  }

  console.log(`✅ Moving to step ${nextStep}`);
  return callback(null, twiml);
};

// Helper function to get question text for logging
function getQuestionForStep(step) {
  const questions = {
    '1': 'Is now a good time to chat?',
    '2': 'Are you interested in this role?',
    '3': 'Tell me about your technical experience',
    '4': 'Do you have 5+ years experience?',
    '5': 'What are your salary expectations?',
    '6': 'What are your work preferences?'
  };
  return questions[step] || 'Unknown question';
}
