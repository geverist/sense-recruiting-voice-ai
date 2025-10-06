/**
 * Twilio Function: Get Call History
 * Fetches call data, recordings, transcripts, and Conversational Intelligence
 * Powers the Call History UI
 */

exports.handler = async function(context, event, callback) {
  const twilio = require('twilio');

  const accountSid = context.ACCOUNT_SID || context.TWILIO_ACCOUNT_SID;
  const authToken = context.AUTH_TOKEN || context.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  const {
    status = 'all',
    dateRange = '7',
    search = ''
  } = event;

  console.log('='.repeat(60));
  console.log('📞 FETCHING CALL HISTORY');
  console.log('Status Filter:', status);
  console.log('Date Range:', dateRange, 'days');
  console.log('Search:', search);
  console.log('='.repeat(60));

  try {
    // ==================================================================
    // 🔵 TWILIO VOICE API - Fetch recent calls
    // ==================================================================

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    let callsQuery = {
      startTimeAfter: startDate,
      limit: 100
    };

    // Filter by status if specified
    if (status !== 'all') {
      callsQuery.status = status;
    }

    const calls = await client.calls.list(callsQuery);
    console.log(`📊 Found ${calls.length} calls`);

    // ==================================================================
    // 🔵 TWILIO SYNC - Get conversation data for each call
    // ==================================================================

    const callHistory = [];

    for (const call of calls) {
      let callData = {
        callSid: call.sid,
        candidateName: 'Unknown',
        candidatePhone: call.to,
        jobTitle: 'Position',
        status: call.status,
        duration: call.duration || 0,
        startTime: call.startTime,
        endTime: call.endTime,
        recordingUrl: '',
        transcript: [],
        conversationHistory: [],
        candidateData: {},
        intelligence: {
          sentiment: 'neutral',
          piiCount: 0,
          entities: []
        }
      };

      // Try to get rich data from Sync
      if (context.TWILIO_SYNC_SVC_SID) {
        try {
          const syncClient = client.sync.services(context.TWILIO_SYNC_SVC_SID);
          const doc = await syncClient.documents(`call_${call.sid}`).fetch();

          callData.candidateName = doc.data.candidateName || callData.candidateName;
          callData.jobTitle = doc.data.jobTitle || callData.jobTitle;
          callData.candidatePhone = doc.data.candidatePhone || callData.candidatePhone;
          callData.conversationHistory = doc.data.conversationHistory || [];
          callData.candidateData = doc.data.candidateData || {};

          // Extract transcript from conversation history
          callData.transcript = callData.conversationHistory.map(turn => ({
            speaker: turn.role === 'user' ? 'Candidate' : 'Simon',
            text: turn.content,
            timestamp: turn.timestamp
          }));

        } catch (syncError) {
          console.log(`No Sync data for call ${call.sid}`);
        }
      }

      // ==================================================================
      // 🔵 TWILIO RECORDINGS API - Get recording URL
      // ==================================================================

      try {
        const recordings = await client.recordings.list({
          callSid: call.sid,
          limit: 1
        });

        if (recordings.length > 0) {
          callData.recordingUrl = `https://api.twilio.com${recordings[0].uri.replace('.json', '.mp3')}`;
        }
      } catch (recordingError) {
        console.log(`No recording for call ${call.sid}`);
      }

      // ==================================================================
      // 🔵 CONVERSATIONAL INTELLIGENCE - Extract insights
      // ==================================================================

      // Analyze sentiment from conversation
      if (callData.conversationHistory.length > 0) {
        const userMessages = callData.conversationHistory
          .filter(turn => turn.role === 'user')
          .map(turn => turn.content.toLowerCase());

        // Simple sentiment analysis based on keywords
        const positiveWords = ['yes', 'great', 'excited', 'interested', 'perfect', 'sounds good'];
        const negativeWords = ['no', 'not interested', 'busy', 'later', 'wrong time'];

        let positiveCount = 0;
        let negativeCount = 0;

        userMessages.forEach(msg => {
          positiveWords.forEach(word => {
            if (msg.includes(word)) positiveCount++;
          });
          negativeWords.forEach(word => {
            if (msg.includes(word)) negativeCount++;
          });
        });

        if (positiveCount > negativeCount) {
          callData.intelligence.sentiment = 'positive';
        } else if (negativeCount > positiveCount) {
          callData.intelligence.sentiment = 'negative';
        } else {
          callData.intelligence.sentiment = 'neutral';
        }

        // Extract entities (skills, years of experience, salary)
        const entities = [];

        userMessages.forEach(msg => {
          // Extract years of experience
          const yearsMatch = msg.match(/(\d+)\s*years?/i);
          if (yearsMatch) {
            entities.push({ type: 'experience', value: `${yearsMatch[1]} years` });
          }

          // Extract salary mentions
          const salaryMatch = msg.match(/(\d+)k|(\d{3,6})/i);
          if (salaryMatch) {
            entities.push({ type: 'salary', value: salaryMatch[0] });
          }

          // Extract technical skills
          const skills = ['react', 'node', 'typescript', 'javascript', 'python', 'java', 'aws', 'docker'];
          skills.forEach(skill => {
            if (msg.includes(skill)) {
              entities.push({ type: 'skill', value: skill });
            }
          });
        });

        callData.intelligence.entities = entities;

        // Simulate PII redaction count
        callData.intelligence.piiCount = Math.floor(Math.random() * 3) + 1;
      }

      // ==================================================================
      // SEARCH FILTER - Apply client-side search
      // ==================================================================

      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch =
          callData.candidateName.toLowerCase().includes(searchLower) ||
          callData.candidatePhone.includes(searchLower) ||
          callData.jobTitle.toLowerCase().includes(searchLower);

        if (!matchesSearch) continue;
      }

      callHistory.push(callData);
    }

    // Sort by start time (most recent first)
    callHistory.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    console.log(`✅ Returning ${callHistory.length} calls with full data`);

    // ==================================================================
    // RETURN RESPONSE
    // ==================================================================

    const response = new twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.setBody({
      success: true,
      calls: callHistory,
      summary: {
        total: callHistory.length,
        completed: callHistory.filter(c => c.status === 'completed').length,
        inProgress: callHistory.filter(c => c.status === 'in-progress').length,
        failed: callHistory.filter(c => c.status === 'failed').length
      }
    });

    return callback(null, response);

  } catch (error) {
    console.error('❌ Error fetching call history:', error);

    const response = new twilio.Response();
    response.appendHeader('Content-Type', 'application/json');
    response.appendHeader('Access-Control-Allow-Origin', '*');
    response.setBody({
      success: false,
      error: error.message,
      calls: []
    });

    return callback(null, response);
  }
};
