# 🌱 Greenhouse ATS Integration Showcase

## Overview

This guide demonstrates how to integrate your AI recruiting voice assistant with Greenhouse ATS for a complete end-to-end recruiting workflow.

## Architecture

```
Greenhouse Webhook → Twilio Function → AI Voice Call → Update Greenhouse
       ↓                    ↓                 ↓                ↓
  New Application    Trigger Screening   Conduct Interview   Update Status
```

---

## 🔄 Integration Flow

### Step 1: Candidate Applies via Greenhouse

When a candidate applies through your website or job board:

1. **Greenhouse receives application**
2. **Greenhouse triggers webhook** → `candidate.created` event
3. **Your Twilio Function receives webhook**
4. **Function validates** candidate meets basic criteria
5. **Function triggers outbound AI screening call**

### Step 2: AI Conducts Screening Call

1. **Twilio places call** to candidate's phone number
2. **AI introduces itself** and asks screening questions
3. **Conversation is recorded** and transcribed
4. **Sentiment analysis** runs in real-time
5. **AI schedules follow-up** if candidate qualifies

### Step 3: Results Sync Back to Greenhouse

1. **Call completes** and triggers webhook
2. **Twilio Function updates Greenhouse** via API
3. **Adds notes** with transcript and sentiment
4. **Moves candidate** to next stage or rejects
5. **Notifies recruiter** of high-quality candidates

---

## 🔧 Implementation

### Prerequisites

1. **Greenhouse Account** with Harvest API access
2. **API Key** from Greenhouse Settings → Dev Center → API Credential Management
3. **Webhook Secret** for validating incoming webhooks
4. **Job ID** for the position you're recruiting for

### Greenhouse API Credentials

```bash
# Add to twilio-serverless/.env
GREENHOUSE_API_KEY=your_api_key_here
GREENHOUSE_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## 📥 Receiving Greenhouse Webhooks

### Create Twilio Function: greenhouse-webhook.js

```javascript
/**
 * Twilio Function: Greenhouse Webhook Handler
 * Receives webhook from Greenhouse when candidate applies
 * Triggers AI screening call
 */

const crypto = require('crypto');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  // Verify webhook signature
  const signature = event.request.headers['greenhouse-signature'];
  const webhookSecret = context.GREENHOUSE_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(event, signature, webhookSecret)) {
    response.setStatusCode(401);
    response.setBody({ error: 'Invalid webhook signature' });
    return callback(null, response);
  }

  // Parse Greenhouse payload
  const payload = typeof event.payload === 'string'
    ? JSON.parse(event.payload)
    : event.payload;

  const { action, payload: data } = payload;

  // Only handle new candidate applications
  if (action === 'candidate_stage_change' && data.to_stage_name === 'Application Review') {
    const candidate = data.candidate;
    const application = data.application;

    console.log(`New candidate: ${candidate.first_name} ${candidate.last_name}`);

    // Extract candidate info
    const candidateData = {
      greenhouseId: candidate.id,
      applicationId: application.id,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      email: candidate.email_addresses[0]?.value || '',
      phone: candidate.phone_numbers[0]?.value || '',
      jobId: application.jobs[0]?.id,
      jobTitle: application.jobs[0]?.name
    };

    // Validate candidate has phone number
    if (!candidateData.phone) {
      console.log('Candidate has no phone number, skipping AI call');
      response.setBody({ success: true, skipped: 'no_phone' });
      return callback(null, response);
    }

    // Trigger AI screening call
    try {
      const screeningUrl = `https://${context.DOMAIN_NAME}/screen-candidate`;
      const screeningResponse = await fetch(screeningUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData)
      });

      if (screeningResponse.ok) {
        const callData = await screeningResponse.json();
        console.log(`AI screening call initiated: ${callData.callSid}`);

        response.setBody({
          success: true,
          callSid: callData.callSid,
          candidateId: candidate.id
        });
      } else {
        throw new Error('Failed to initiate screening call');
      }
    } catch (error) {
      console.error('Error triggering screening:', error);
      response.setStatusCode(500);
      response.setBody({ error: error.message });
    }
  } else {
    // Not a relevant event, acknowledge and skip
    response.setBody({ success: true, skipped: 'not_applicable' });
  }

  return callback(null, response);
};

function verifyWebhookSignature(event, signature, secret) {
  const payload = typeof event.payload === 'string' ? event.payload : JSON.stringify(event.payload);
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('base64');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

---

## 📤 Updating Greenhouse After Call

### Create Twilio Function: update-greenhouse.js

```javascript
/**
 * Twilio Function: Update Greenhouse
 * Updates candidate record in Greenhouse after AI screening call
 */

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');

  const {
    candidateId,
    applicationId,
    callSid,
    callDuration,
    transcript,
    sentiment,
    recommendation,
    nextStage
  } = event;

  const greenhouseApiKey = context.GREENHOUSE_API_KEY;
  const authHeader = `Basic ${Buffer.from(greenhouseApiKey + ':').toString('base64')}`;

  try {
    // 1. Add activity note with call transcript
    const noteBody = `
## AI Screening Call Completed

**Call Duration:** ${Math.floor(callDuration / 60)} minutes ${callDuration % 60} seconds
**Call SID:** ${callSid}
**Sentiment:** ${sentiment}
**Recommendation:** ${recommendation}

### Transcript
${transcript}

---
*Generated by AI Recruiting Assistant*
    `.trim();

    const noteResponse = await fetch(
      `https://harvest.greenhouse.io/v1/candidates/${candidateId}/activity_feed/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'On-Behalf-Of': context.GREENHOUSE_USER_ID || ''
        },
        body: JSON.stringify({
          message: noteBody,
          visibility: 'public'
        })
      }
    );

    if (!noteResponse.ok) {
      throw new Error(`Failed to add note: ${noteResponse.statusText}`);
    }

    console.log(`Added screening note to candidate ${candidateId}`);

    // 2. Move candidate to next stage if recommended
    if (recommendation === 'advance' && nextStage) {
      const moveResponse = await fetch(
        `https://harvest.greenhouse.io/v1/applications/${applicationId}/move`,
        {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
            'On-Behalf-Of': context.GREENHOUSE_USER_ID || ''
          },
          body: JSON.stringify({
            to_stage_id: nextStage
          })
        }
      );

      if (!moveResponse.ok) {
        throw new Error(`Failed to move stage: ${moveResponse.statusText}`);
      }

      console.log(`Moved candidate ${candidateId} to stage ${nextStage}`);
    }

    // 3. Add custom scorecard (optional)
    const scorecardData = {
      interview: context.GREENHOUSE_INTERVIEW_ID, // AI Screening Interview ID
      scorecard: {
        overall_recommendation: recommendation === 'advance' ? 'yes' : 'no',
        attributes: [
          {
            name: 'Communication Skills',
            rating: sentiment === 'positive' ? '5' : sentiment === 'neutral' ? '3' : '2'
          },
          {
            name: 'Relevant Experience',
            rating: recommendation === 'advance' ? '5' : '3'
          }
        ],
        notes: transcript
      }
    };

    response.setBody({
      success: true,
      candidateId,
      noteAdded: true,
      stageMoved: recommendation === 'advance'
    });

  } catch (error) {
    console.error('Error updating Greenhouse:', error);
    response.setStatusCode(500);
    response.setBody({ error: error.message });
  }

  return callback(null, response);
};
```

---

## 🎯 Greenhouse Webhook Configuration

### Setting Up Webhooks in Greenhouse

1. **Log into Greenhouse** → Configure → Dev Center
2. **Click "Web Hooks"** → Create New Web Hook
3. **Configure webhook:**
   ```
   Name: AI Screening Trigger
   Endpoint URL: https://your-twilio-domain.twil.io/greenhouse-webhook
   Secret Key: [Generate strong random string]
   Event: candidate_stage_change
   Filter: To Stage = "Application Review"
   ```

4. **Test webhook** using Greenhouse's test feature
5. **Enable webhook** once tested successfully

---

## 📊 Example Workflow Automation

### Scenario: Software Engineer Recruiting

```
Step 1: Candidate applies via website
  ↓
Step 2: Greenhouse receives application
  ↓
Step 3: Candidate stage changes to "Application Review"
  ↓
Step 4: Webhook triggers AI screening call within 15 minutes
  ↓
Step 5: AI asks technical screening questions:
  - Years of experience with relevant technologies
  - Availability and salary expectations
  - Interest level in the role
  ↓
Step 6: Call completes, AI analyzes responses
  ↓
Step 7: If candidate qualifies:
  → Move to "Phone Screen Scheduled" stage
  → Send calendar invite for human recruiter interview
  → Send SMS confirmation to candidate
  ↓
Step 8: If candidate doesn't qualify:
  → Move to "Rejected" stage
  → Add rejection note with reason
  → (Optional) Send polite rejection email
```

---

## 🔍 Querying Greenhouse API

### Fetch Candidate Details

```javascript
// Get full candidate information
const candidate = await fetch(
  `https://harvest.greenhouse.io/v1/candidates/${candidateId}`,
  {
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
    }
  }
).then(r => r.json());

console.log(candidate.first_name, candidate.last_name);
console.log(candidate.email_addresses);
console.log(candidate.phone_numbers);
console.log(candidate.applications);
```

### Fetch Job Details

```javascript
// Get job requirements for customizing AI prompts
const job = await fetch(
  `https://harvest.greenhouse.io/v1/jobs/${jobId}`,
  {
    headers: {
      'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}`
    }
  }
).then(r => r.json());

console.log(job.name);
console.log(job.departments);
console.log(job.custom_fields); // Could include required skills
```

---

## 🎓 Workshop Demo Script

### Live Integration Demonstration (10 minutes)

**What you'll show:**

1. **Greenhouse Dashboard** (2 min)
   - Show candidate pipeline
   - Point out "Application Review" stage
   - Show where AI call results will appear

2. **Submit Test Application** (2 min)
   - Use workshop attendee as test candidate
   - Fill out application form
   - Show application appearing in Greenhouse

3. **Watch Webhook Trigger** (1 min)
   - Show Twilio Function logs
   - Watch for incoming webhook
   - Confirm call initiated

4. **Receive AI Call** (3 min)
   - Put phone on speaker
   - Let AI conduct screening
   - Answer questions naturally

5. **See Results in Greenhouse** (2 min)
   - Refresh candidate page
   - Show activity note with transcript
   - Show stage change if applicable
   - Show candidate experience survey results

**Preparation:**
- Set up test job in Greenhouse beforehand
- Configure webhook pointing to your Twilio function
- Have test candidate phone number ready
- Ensure screen sharing is set up

---

## 🚀 Advanced Integrations

### Slack Notifications

Send alert to recruiting team when high-quality candidate screened:

```javascript
// Add to update-greenhouse.js
if (recommendation === 'advance' && sentiment === 'positive') {
  await fetch(context.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🌟 High-quality candidate alert!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${firstName} ${lastName}* just completed AI screening for *${jobTitle}*\n\n` +
                  `✅ Positive sentiment\n` +
                  `✅ Recommended to advance\n\n` +
                  `<https://app.greenhouse.io/people/${candidateId}|View in Greenhouse>`
          }
        }
      ]
    })
  });
}
```

### Email Follow-up

Send personalized follow-up email based on call outcome:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(context.SENDGRID_API_KEY);

const msg = {
  to: candidateEmail,
  from: 'recruiting@yourcompany.com',
  subject: `Next Steps - ${jobTitle} at YourCompany`,
  html: `
    <p>Hi ${firstName},</p>

    <p>Thanks for taking the time to speak with our AI recruiting assistant!
    Based on your experience and interest, we'd love to continue the conversation.</p>

    <p><strong>Next Steps:</strong> Our hiring manager will reach out within 2 business days
    to schedule a video interview.</p>

    <p>In the meantime, check out our <a href="https://company.com/engineering">engineering blog</a>
    to learn more about our team!</p>

    <p>Best,<br>The ${companyName} Recruiting Team</p>
  `
};

await sgMail.send(msg);
```

---

## 📈 Metrics to Track

### Integration Success Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Webhook Reliability** | % of webhooks successfully processed | >99% |
| **Call Success Rate** | % of triggered calls that connect | >80% |
| **Data Sync Accuracy** | % of calls with correct Greenhouse updates | 100% |
| **Time to Screen** | Avg time from application to AI screening | <30 min |
| **Recruiter Time Saved** | Hours saved per week on phone screens | 10+ hrs |

### Candidate Experience Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Call Completion Rate** | % of candidates who complete full screening | >85% |
| **Sentiment Score** | Avg positive sentiment from Language Operators | >70% |
| **Survey Naturalness** | Avg rating on "How natural did AI sound?" | >4.0/5 |
| **Would Recommend** | % who'd recommend company based on call | >80% |

---

## 🐛 Troubleshooting

### Common Issues

**Problem:** Webhook not triggering
- ✅ Check webhook URL is correct
- ✅ Verify webhook secret matches
- ✅ Check Greenhouse webhook logs
- ✅ Test with Greenhouse's webhook testing tool

**Problem:** Candidate info missing
- ✅ Verify candidate has phone number in Greenhouse
- ✅ Check phone number format (E.164: +15555551234)
- ✅ Ensure candidate stage matches webhook filter

**Problem:** Greenhouse update fails
- ✅ Verify API key has write permissions
- ✅ Check API key is not expired
- ✅ Ensure candidate/application ID is correct
- ✅ Check Greenhouse API rate limits (not exceeded)

**Problem:** Duplicate calls triggered
- ✅ Add idempotency check using candidate ID
- ✅ Check for multiple webhooks configured
- ✅ Verify webhook isn't firing on stage change loops

---

## 🎯 Workshop Learning Outcomes

After this integration showcase, attendees will be able to:

✅ **Understand** end-to-end ATS integration flow
✅ **Configure** Greenhouse webhooks correctly
✅ **Implement** bidirectional data sync
✅ **Handle** webhook security and validation
✅ **Track** integration success metrics
✅ **Troubleshoot** common integration issues
✅ **Extend** with additional integrations (Slack, email, etc.)

---

## 📚 Additional Resources

- [Greenhouse Harvest API Docs](https://developers.greenhouse.io/harvest.html)
- [Greenhouse Webhooks Guide](https://developers.greenhouse.io/webhooks.html)
- [Twilio Functions Best Practices](https://www.twilio.com/docs/serverless/functions-assets/api)
- [Webhook Security Guide](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

---

**Ready to automate your recruiting?** This integration turns your AI voice assistant into a powerful recruiting engine that works 24/7! 🚀
