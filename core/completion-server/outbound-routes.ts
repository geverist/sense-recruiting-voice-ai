/**
 * Outbound Call Routes
 * Handles TwiML generation and websocket connections for outbound recruiting calls
 */

import { Router, type RequestHandler } from "express";
import type { TwilioCallWebhookPayload } from "./twilio-types.js";
import { getMakeLogger } from "../../lib/logger.js";
import { prettyXML } from "../../lib/xml.js";

const { HOSTNAME } = process.env;

const router = Router();

/**
 * Triggered when outbound call is initiated
 * This endpoint is called by Twilio's outbound call API
 */
router.post("/outbound-call-answer", async (req, res) => {
  const log = getMakeLogger();
  const body = req.body as TwilioCallWebhookPayload & {
    candidateId?: string;
    callType?: string;
    jobId?: string;
  };

  const { CallSid, AnsweredBy, candidateId, callType = "screening" } = body;

  log.info(
    "/outbound-call-answer",
    `Outbound call answered. CallSid: ${CallSid}, AnsweredBy: ${AnsweredBy}, Type: ${callType}`
  );

  // Handle answering machine detection
  if (AnsweredBy === "machine_start" || AnsweredBy === "fax") {
    log.info(
      "/outbound-call-answer",
      `Answering machine detected for ${CallSid}, leaving voicemail`
    );

    const voicemailTwiML = generateVoicemailTwiML(candidateId, callType);
    res.status(200).type("text/xml").send(voicemailTwiML);
    return;
  }

  // Generate TwiML to connect to ConversationRelay
  try {
    const twiml = await generateOutboundConversationRelayTwiML({
      callSid: CallSid,
      candidateId: candidateId || "",
      callType,
    });

    log.info("/outbound-call-answer", "Generated TwiML\n", prettyXML(twiml));
    res.status(200).type("text/xml").send(twiml);
  } catch (error: any) {
    log.error("/outbound-call-answer", "Error generating TwiML", error);
    res.status(500).send("Internal server error");
  }
});

/**
 * Generate TwiML for voicemail
 */
function generateVoicemailTwiML(
  candidateId: string | undefined,
  callType: string
): string {
  const messages: Record<string, string> = {
    screening: `Hello! This is the automated recruiting assistant calling about your recent job application. We'd love to speak with you about the position. Please call us back at your earliest convenience. Thank you!`,
    scheduling: `Hi! We're calling to schedule your interview. Please give us a call back to find a time that works for you. We look forward to speaking with you!`,
    reminder: `This is a friendly reminder about your upcoming interview. If you need to reschedule, please give us a call. Thank you!`,
    reference_check: `Hello, we're calling regarding a reference check. Please call us back when you have a moment. Thank you.`,
  };

  const message = messages[callType] || messages.screening;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${message}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Joanna">Goodbye!</Say>
  <Hangup/>
</Response>`;
}

/**
 * Generate TwiML to connect to ConversationRelay for AI conversation
 */
async function generateOutboundConversationRelayTwiML(params: {
  callSid: string;
  candidateId: string;
  callType: string;
}): Promise<string> {
  const { callSid, candidateId, callType } = params;

  // TODO: Fetch candidate and job data from database/ATS
  // For now, using placeholder data
  const candidate = {
    id: candidateId,
    firstName: "Justin",
    lastName: "Smith",
    appliedFor: { jobTitle: "Senior Software Engineer" },
  };

  // Build the greeting based on call type
  const greetings: Record<string, string> = {
    screening: `Hello ${candidate.firstName}! This is Simon, the automated recruiting assistant. Thank you for your interest in the ${candidate.appliedFor.jobTitle} position. Do you have a few minutes to chat about your qualifications?`,
    scheduling: `Hi ${candidate.firstName}! This is Simon calling to schedule your interview for the ${candidate.appliedFor.jobTitle} role. Do you have a moment to find a time that works for you?`,
    reminder: `Hello ${candidate.firstName}, this is a reminder about your upcoming interview for the ${candidate.appliedFor.jobTitle} position. I wanted to confirm you're still available.`,
    reference_check: `Hello, this is Simon calling regarding ${candidate.firstName} ${candidate.lastName} who has applied for a position with us. Do you have a few minutes to answer some questions?`,
  };

  const welcomeGreeting = greetings[callType] || greetings.screening;

  // Context to pass to ConversationRelay
  const context = {
    candidate,
    callType,
    isOutbound: true,
  };

  // Parameters to pass to websocket handler
  const parameters = {
    candidateId,
    callType,
    welcomeGreeting,
    context: JSON.stringify(context),
  };

  // Build ConversationRelay TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay
      url="wss://${HOSTNAME}/convo-relay/${callSid}"
      voice="Polly.Brian"
      language="en-GB"
      dtmfDetection="true"
      interruptByDtmf="true">
      ${Object.entries(parameters)
        .map(([key, value]) => `<Parameter name="${key}" value="${value}" />`)
        .join("\n      ")}
    </ConversationRelay>
  </Connect>
</Response>`;

  return twiml;
}

/**
 * API endpoint to trigger an outbound screening call
 * Called by external systems or manual trigger
 */
router.post("/screen-candidate", async (req, res) => {
  const log = getMakeLogger();

  try {
    const { candidateId, phone, firstName, appliedFor } = req.body;

    if (!candidateId || !phone) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: candidateId, phone",
      });
      return;
    }

    log.info(
      "/screen-candidate",
      `Triggering screening call for candidate ${candidateId}`
    );

    // Import the outbound call function
    const { initiateOutboundCall } = await import(
      "../twilio/outbound-calls.js"
    );

    // Create a minimal candidate object for the call
    const candidate = {
      id: candidateId,
      atsId: candidateId,
      firstName: firstName || "there",
      lastName: "",
      email: "test@example.com",
      phone: phone,
      preferredLanguage: "en-US",
      timezone: "America/New_York",
      tcpaConsent: { granted: true },
      dncStatus: "safe" as const,
      optedOut: false,
      appliedFor: {
        jobId: "job-1",
        jobTitle: appliedFor || "Software Engineer",
        requisitionNumber: "REQ-001",
        appliedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await initiateOutboundCall({
      candidate,
      callType: "screening",
      metadata: { triggeredBy: "api", source: "manual" },
    });

    if (result.success) {
      log.success(
        "/screen-candidate",
        `Screening call initiated. CallSid: ${result.callSid}`
      );
      res.status(200).json({
        success: true,
        callSid: result.callSid,
        message: `Call initiated to ${phone}`,
      });
    } else {
      log.warn("/screen-candidate", `Failed to initiate call: ${result.error}`);
      res.status(400).json({
        success: false,
        error: result.error,
        scheduledCallback: result.scheduledCallback,
      });
    }
  } catch (error: any) {
    log.error("/screen-candidate", "Error initiating call", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Batch screening endpoint
 * Trigger screening calls for multiple candidates
 */
router.post("/batch-screen-candidates", async (req, res) => {
  const log = getMakeLogger();

  try {
    const { candidateIds } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "candidateIds must be a non-empty array",
      });
      return;
    }

    log.info(
      "/batch-screen-candidates",
      `Triggering batch screening for ${candidateIds.length} candidates`
    );

    // TODO: Fetch candidates from database/ATS
    // For now, return success
    res.status(200).json({
      success: true,
      message: `Batch screening initiated for ${candidateIds.length} candidates`,
      queued: candidateIds.length,
    });
  } catch (error: any) {
    log.error("/batch-screen-candidates", "Error", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Handle call status updates from Twilio
 */
router.post("/call-status", async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  const log = getMakeLogger(CallSid);

  log.info(
    "/call-status",
    `Call status: ${CallStatus}, Duration: ${CallDuration}s`
  );

  // TODO: Update call record in database
  // Track metrics: completed, no-answer, busy, failed, etc.

  res.status(200).send("OK");
});

/**
 * Handle recording status callbacks
 */
router.post("/recording-status", async (req, res) => {
  const { CallSid, RecordingUrl, RecordingDuration, RecordingSid } = req.body;
  const log = getMakeLogger(CallSid);

  log.info(
    "/recording-status",
    `Recording complete: ${RecordingSid}, Duration: ${RecordingDuration}s, URL: ${RecordingUrl}`
  );

  // TODO: Store recording URL in database for compliance
  // Link to candidate's screening record

  res.status(200).send("OK");
});

export const outboundRoutes = router;
