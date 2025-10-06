/**
 * Twilio Function: AI-Powered Process Response
 * Uses OpenAI GPT to generate dynamic, natural responses
 * This creates truly conversational AI - not scripted!
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
  console.log(`🤖 AI PROCESSING RESPONSE - Step ${step}`);
  console.log('Speech Result:', SpeechResult);
  console.log('='.repeat(60));

  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  // Determine voice to use
  let twimlVoice = 'Polly.Brian'; // British Simon voice
  if (voiceProvider === 'amazon-polly') {
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
      candidatePhone = doc.data.candidatePhone || '';
    } catch (error) {
      console.log('No existing conversation history');
    }
  }

  // Save current response to history
  conversationHistory.push({
    role: 'user',
    content: SpeechResult,
    timestamp: new Date().toISOString()
  });

  // ==================================================================
  // 🤖 CALL OPENAI GPT FOR DYNAMIC RESPONSE
  // ==================================================================

  try {
    // Build system prompt for Simon
    const systemPrompt = `You are Simon, a British AI voice assistant and automated recruiter for Twilio.

PERSONALITY:
- Warm, professional, and engaging
- Use British expressions (e.g., "brilliant", "lovely", "cheers")
- Keep responses brief (2-3 sentences max for voice)
- Sound natural and conversational, not robotic

YOUR GOAL:
Conduct a phone screening for the ${jobTitle} position at Twilio. You need to:
1. Confirm their interest in the role
2. Ask about their technical skills (React, Node.js, TypeScript, etc.)
3. Confirm they have 5+ years of experience
4. Understand salary expectations ($140k-$160k range)
5. Learn work preferences (remote, hybrid, onsite)
6. If qualified, schedule an interview (Tuesday 2pm or Thursday 10am PT)

CONVERSATION STATE:
${JSON.stringify(candidateData, null, 2)}

INSTRUCTIONS:
- Reference what they said earlier in the conversation
- Be empathetic and adaptive to their tone
- If they have 5+ years experience, offer to schedule an interview
- If not qualified, be kind and suggest staying in touch
- Use their name (${candidateName}) naturally
- Keep track of what you've already asked

CURRENT STEP: ${step}/7
- Steps 1-2: Greeting and interest confirmation
- Steps 3-4: Technical skills and experience
- Steps 5-6: Salary and work preferences
- Step 7: Schedule interview (if qualified)

Respond naturally based on what they just said. Ask the next logical question.`;

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const openaiData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiData.error?.message || 'Unknown error'}`);
    }

    const aiResponse = openaiData.choices[0]?.message?.content ||
                      "Sorry, I didn't catch that. Could you repeat?";

    console.log('🤖 OpenAI Response:', aiResponse);

    // Save AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // ==================================================================
    // 🔍 EXTRACT STRUCTURED DATA FROM CONVERSATION
    // ==================================================================

    // Use simple keyword detection to extract candidate data
    const userSaid = SpeechResult.toLowerCase();

    // Track interest
    if (parseInt(step) === 2) {
      candidateData.interestedInRole = userSaid.includes('yes') || userSaid.includes('interested');
    }

    // Track experience level
    if (userSaid.includes('years') || parseInt(step) === 4) {
      const yearMatch = userSaid.match(/(\d+)\s*years?/);
      if (yearMatch) {
        candidateData.yearsExperience = parseInt(yearMatch[1]);
        candidateData.hasRequiredExperience = candidateData.yearsExperience >= 5;
      } else if (userSaid.includes('yes') && parseInt(step) === 4) {
        candidateData.hasRequiredExperience = true;
      }
    }

    // Track technical skills
    if (parseInt(step) === 3) {
      candidateData.technicalSkills = SpeechResult;
      candidateData.mentionsReact = userSaid.includes('react');
      candidateData.mentionsNode = userSaid.includes('node');
    }

    // Track salary
    if (parseInt(step) === 5 || userSaid.includes('k') || userSaid.includes('thousand')) {
      candidateData.salaryExpectations = SpeechResult;
    }

    // Track work preference
    if (parseInt(step) === 6 && (userSaid.includes('remote') || userSaid.includes('hybrid') || userSaid.includes('office'))) {
      candidateData.workPreference = SpeechResult;
    }

    // ==================================================================
    // 🔧 TOOL INVOCATION: Schedule Interview
    // ==================================================================

    const currentStep = parseInt(step);
    const nextStep = currentStep + 1;
    let shouldContinue = true;

    // Check if we should schedule interview (step 7)
    if (currentStep === 7 && candidateData.hasRequiredExperience) {
      // They chose a time - send SMS
      const chosenTime = SpeechResult;
      let scheduledDateTime = '';

      if (chosenTime.toLowerCase().includes('tuesday')) {
        scheduledDateTime = 'Tuesday, 2:00 PM PT';
      } else {
        scheduledDateTime = 'Thursday, 10:00 AM PT';
      }

      console.log('🔧 TOOL CALL: scheduleInterview()');
      console.log('   Interview scheduled for:', scheduledDateTime);

      console.log('🔧 TOOL CALL: sendSMS()');
      console.log('   Sending confirmation to:', candidatePhone);

      // Actually send SMS
      try {
        const message = await client.messages.create({
          to: candidatePhone,
          from: context.DEFAULT_TWILIO_NUMBER,
          body: `Hi ${candidateName}! Your interview for ${jobTitle} at Twilio is scheduled for ${scheduledDateTime}. ` +
                `You'll receive a calendar invite soon. Looking forward to it! - Simon`
        });
        console.log(`✅ SMS sent successfully: ${message.sid}`);
        candidateData.smsSent = true;
        candidateData.smsMessageSid = message.sid;
      } catch (smsError) {
        console.error('❌ Failed to send SMS:', smsError);
      }

      shouldContinue = false;
    }

    // End call after step 7 or if not qualified after step 6
    if (currentStep >= 7 || (currentStep === 6 && !candidateData.hasRequiredExperience)) {
      shouldContinue = false;
    }

    // ==================================================================
    // 🎙️ GENERATE TWIML WITH AI RESPONSE
    // ==================================================================

    if (shouldContinue) {
      const gather = twiml.gather({
        input: 'speech',
        timeout: 5,
        speechTimeout: 'auto',
        action: `https://${context.DOMAIN_NAME}/ai-process-response?` +
                `candidateName=${encodeURIComponent(candidateName)}&` +
                `jobTitle=${encodeURIComponent(jobTitle)}&` +
                `voiceProvider=${voiceProvider}&` +
                `voiceName=${encodeURIComponent(voiceName)}&` +
                `step=${nextStep}`,
        method: 'POST'
      });

      // AI-generated response!
      gather.say({ voice: twimlVoice }, aiResponse);

      // Fallback
      twiml.say({ voice: twimlVoice },
        `Sorry, I didn't catch that. Please feel free to call us back. Cheers!`);
    } else {
      // Final message - use AI response
      twiml.say({ voice: twimlVoice }, aiResponse);
    }

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
            currentStep: nextStep,
            lastAiResponse: aiResponse,
            status: shouldContinue ? 'in_progress' : 'completed'
          }
        });
      } catch (error) {
        console.error('Sync update error:', error);
      }
    }

    return callback(null, twiml);

  } catch (error) {
    console.error('❌ OpenAI API error:', error);

    // Fallback to simple response if OpenAI fails
    twiml.say({ voice: twimlVoice },
      `I apologize, but I'm having a bit of trouble at the moment. ` +
      `Let me have a recruiter call you back shortly. Thanks for your patience!`);

    return callback(null, twiml);
  }
};
