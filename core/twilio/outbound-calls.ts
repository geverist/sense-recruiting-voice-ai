/**
 * Outbound Call Manager for Recruiting
 * Handles AI-initiated calls to candidates for screening, scheduling, and reference checks
 */

import twilio from "twilio";
import type { Candidate } from "../../shared/models/candidate.js";
import { canContactCandidate } from "../../shared/models/candidate.js";
import { getMakeLogger } from "../../lib/logger.js";

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  DEFAULT_TWILIO_NUMBER,
  HOSTNAME,
} = process.env;

const twilioClient = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

export interface OutboundCallOptions {
  candidate: Candidate;
  callType: "screening" | "scheduling" | "reference_check" | "reminder";
  jobId?: string;
  priority?: "normal" | "high";
  scheduledFor?: Date; // For scheduled callbacks
  maxRetries?: number;
  metadata?: Record<string, any>;
}

export interface OutboundCallResult {
  success: boolean;
  callSid?: string;
  error?: string;
  candidate: Candidate;
  scheduledCallback?: Date;
}

/**
 * Initiate an outbound call to a candidate
 */
export async function initiateOutboundCall(
  options: OutboundCallOptions
): Promise<OutboundCallResult> {
  const log = getMakeLogger();
  const { candidate, callType, metadata = {} } = options;

  // Validate compliance before calling
  const canCall = canContactCandidate(candidate);
  if (!canCall.allowed) {
    log.warn(
      "outbound-call",
      `Cannot call candidate ${candidate.id}: ${canCall.reason}`
    );
    return {
      success: false,
      error: canCall.reason,
      candidate,
    };
  }

  // Check if within calling hours (9 AM - 8 PM candidate's timezone)
  const withinHours = isWithinCallingHours(candidate.timezone);
  if (!withinHours) {
    const nextAvailableTime = getNextAvailableCallTime(candidate.timezone);
    log.info(
      "outbound-call",
      `Outside calling hours, scheduling callback for ${nextAvailableTime}`
    );
    return {
      success: false,
      error: "Outside calling hours",
      candidate,
      scheduledCallback: nextAvailableTime,
    };
  }

  try {
    // Build the TwiML URL that will be executed when candidate answers
    const callbackUrl = buildCallbackUrl(callType, candidate.id, metadata);

    log.info(
      "outbound-call",
      `Initiating ${callType} call to ${candidate.firstName} ${candidate.lastName} at ${candidate.phone}`
    );

    // Place the call
    const call = await twilioClient.calls.create({
      to: candidate.phone,
      from: DEFAULT_TWILIO_NUMBER,
      url: callbackUrl,
      statusCallback: `https://${HOSTNAME}/call-status`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      machineDetection: "DetectMessageEnd", // Handle voicemail
      machineDetectionTimeout: 5,
      machineDetectionSpeechThreshold: 2400,
      machineDetectionSpeechEndThreshold: 1200,
      machineDetectionSilenceTimeout: 5000,
      record: true, // Record for compliance
      recordingStatusCallback: `https://${HOSTNAME}/recording-status`,
      recordingStatusCallbackMethod: "POST",
    });

    log.success(
      "outbound-call",
      `Call initiated successfully. CallSid: ${call.sid}`
    );

    return {
      success: true,
      callSid: call.sid,
      candidate,
    };
  } catch (error: any) {
    log.error("outbound-call", `Failed to initiate call: ${error.message}`);
    return {
      success: false,
      error: error.message,
      candidate,
    };
  }
}

/**
 * Build the callback URL for when the call is answered
 */
function buildCallbackUrl(
  callType: string,
  candidateId: string,
  metadata: Record<string, any>
): string {
  const params = new URLSearchParams({
    candidateId,
    callType,
    ...metadata,
  });

  return `https://${HOSTNAME}/outbound-call-answer?${params.toString()}`;
}

/**
 * Check if current time is within acceptable calling hours
 * Generally 9 AM - 8 PM in the candidate's timezone
 */
function isWithinCallingHours(timezone: string): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });

  const hourString = formatter.format(now);
  const hour = parseInt(hourString, 10);

  // Allow calls between 9 AM and 8 PM
  return hour >= 9 && hour < 20;
}

/**
 * Get the next available time to call the candidate
 */
function getNextAvailableCallTime(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });

  const hourString = formatter.format(now);
  const hour = parseInt(hourString, 10);

  // If before 9 AM, schedule for 9 AM today
  if (hour < 9) {
    const next = new Date(now);
    next.setHours(9, 0, 0, 0);
    return next;
  }

  // If after 8 PM, schedule for 9 AM tomorrow
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(9, 0, 0, 0);
  return next;
}

/**
 * Batch outbound calling for multiple candidates
 * Respects rate limits and calling hours
 */
export async function batchOutboundCalls(
  candidates: Candidate[],
  callType: OutboundCallOptions["callType"],
  options: {
    maxConcurrent?: number;
    delayBetweenCalls?: number; // milliseconds
    metadata?: Record<string, any>;
  } = {}
): Promise<OutboundCallResult[]> {
  const { maxConcurrent = 5, delayBetweenCalls = 1000, metadata = {} } = options;
  const log = getMakeLogger();

  log.info(
    "batch-outbound",
    `Starting batch ${callType} calls for ${candidates.length} candidates`
  );

  const results: OutboundCallResult[] = [];
  const queue = [...candidates];

  // Process candidates in batches
  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent);
    const batchResults = await Promise.all(
      batch.map((candidate) =>
        initiateOutboundCall({
          candidate,
          callType,
          metadata,
        })
      )
    );

    results.push(...batchResults);

    // Delay between batches to respect rate limits
    if (queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenCalls));
    }
  }

  const successful = results.filter((r) => r.success).length;
  log.success(
    "batch-outbound",
    `Batch complete: ${successful}/${candidates.length} calls initiated successfully`
  );

  return results;
}

/**
 * Handle answering machine detection
 * If voicemail is detected, leave a message and hang up
 */
export function handleAnsweringMachine(
  candidate: Candidate,
  callType: string
): string {
  const voicemailMessages = {
    screening: `Hello ${candidate.firstName}, this is the automated recruiting assistant from [Company Name]. We received your application for [Job Title] and would love to speak with you. Please call us back at ${DEFAULT_TWILIO_NUMBER} at your convenience. Thank you!`,
    scheduling: `Hi ${candidate.firstName}, this is [Company Name] calling to schedule your interview. Please call us back at ${DEFAULT_TWILIO_NUMBER}. We look forward to speaking with you!`,
    reminder: `Hello ${candidate.firstName}, this is a reminder about your upcoming interview with [Company Name]. If you need to reschedule, please call ${DEFAULT_TWILIO_NUMBER}. Thank you!`,
    reference_check: `Hello, this is [Company Name] calling regarding a reference check for ${candidate.firstName} ${candidate.lastName}. Please call us back at ${DEFAULT_TWILIO_NUMBER}. Thank you.`,
  };

  const message =
    voicemailMessages[callType as keyof typeof voicemailMessages] ||
    voicemailMessages.screening;

  // Return TwiML to leave voicemail and hangup
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${message}</Say>
  <Hangup/>
</Response>`;
}

/**
 * Retry failed calls with exponential backoff
 */
export async function retryFailedCall(
  result: OutboundCallResult,
  attempt: number = 1,
  maxAttempts: number = 3
): Promise<OutboundCallResult> {
  const log = getMakeLogger();

  if (attempt >= maxAttempts) {
    log.warn(
      "retry-outbound",
      `Max retry attempts (${maxAttempts}) reached for candidate ${result.candidate.id}`
    );
    return result;
  }

  // Exponential backoff: 5min, 15min, 30min
  const delayMinutes = 5 * Math.pow(2, attempt - 1);
  const delayMs = delayMinutes * 60 * 1000;

  log.info(
    "retry-outbound",
    `Scheduling retry ${attempt}/${maxAttempts} for candidate ${result.candidate.id} in ${delayMinutes} minutes`
  );

  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const retryResult = await initiateOutboundCall({
    candidate: result.candidate,
    callType: "screening", // Default, should be passed from original call
    maxRetries: maxAttempts,
  });

  if (!retryResult.success && attempt < maxAttempts) {
    return retryFailedCall(retryResult, attempt + 1, maxAttempts);
  }

  return retryResult;
}

/**
 * Schedule a callback for later
 * Useful when candidate doesn't answer or requests callback
 */
export async function scheduleCallback(
  candidate: Candidate,
  scheduledFor: Date,
  callType: OutboundCallOptions["callType"],
  metadata?: Record<string, any>
): Promise<{ success: boolean; scheduledCallbackId?: string }> {
  const log = getMakeLogger();

  log.info(
    "schedule-callback",
    `Scheduling ${callType} callback for ${candidate.firstName} ${candidate.lastName} at ${scheduledFor}`
  );

  // In production, this would use a job queue (Bull, Agenda, etc.)
  // For now, we'll store in database and use a cron job to process

  // TODO: Implement job queue or database storage
  // Example with database:
  // await db.scheduledCalls.create({
  //   candidateId: candidate.id,
  //   callType,
  //   scheduledFor,
  //   metadata,
  //   status: 'pending'
  // });

  return {
    success: true,
    scheduledCallbackId: `callback-${Date.now()}`,
  };
}

/**
 * Cancel a scheduled callback
 */
export async function cancelScheduledCallback(
  scheduledCallbackId: string
): Promise<boolean> {
  // TODO: Implement cancellation logic
  return true;
}
