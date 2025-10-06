import { z } from "zod";

/**
 * TCPA (Telephone Consumer Protection Act) Consent Tracking
 * Required for all outbound recruiting calls
 */
export const TCPAConsentSchema = z.object({
  granted: z.boolean(),
  grantedAt: z.date().optional(),
  ipAddress: z.string().ip().optional(),
  method: z
    .enum(["web_form", "sms_opt_in", "email_link", "verbal_consent"])
    .optional(),
  recordingUrl: z.string().url().optional(),
});

export type TCPAConsent = z.infer<typeof TCPAConsentSchema>;

/**
 * Do Not Call Registry Status
 */
export const DNCStatusSchema = z.enum([
  "safe", // Not on DNC registry, safe to call
  "registered", // On DNC registry, cannot call
  "unknown", // Status not yet checked
  "exempt", // Has established business relationship
]);

export type DNCStatus = z.infer<typeof DNCStatusSchema>;

/**
 * Screening Session Data
 */
export const ScreeningDataSchema = z.object({
  status: z.enum([
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "failed",
    "no_answer",
    "opted_out",
  ]),
  scheduledAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  callSid: z.string().optional(),
  recordingUrl: z.string().url().optional(),
  transcript: z.string().optional(),
  summary: z.string().optional(),
  engagementScore: z.number().min(0).max(10).optional(),
  answers: z.record(z.string(), z.any()).optional(),
  redFlags: z.array(z.string()).optional(),
  strengths: z.array(z.string()).optional(),
  recommendation: z
    .enum(["strong_yes", "yes", "maybe", "no", "strong_no"])
    .optional(),
  attemptCount: z.number().default(0),
  lastAttemptAt: z.date().optional(),
});

export type ScreeningData = z.infer<typeof ScreeningDataSchema>;

/**
 * Job Application Context
 */
export const JobApplicationSchema = z.object({
  jobId: z.string(),
  jobTitle: z.string(),
  requisitionNumber: z.string(),
  appliedAt: z.date(),
  source: z.string().optional(), // e.g., "LinkedIn", "Indeed", "Referral"
  referredBy: z.string().optional(),
});

export type JobApplication = z.infer<typeof JobApplicationSchema>;

/**
 * Complete Candidate Model
 */
export const CandidateSchema = z.object({
  // Identity
  id: z.string().uuid(),
  atsId: z.string(), // External ATS ID
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/), // E.164 format

  // Preferences
  preferredLanguage: z.string().default("en-US"),
  timezone: z.string().default("America/New_York"),
  preferredContactMethod: z.enum(["phone", "email", "sms"]).optional(),
  bestTimeToCall: z
    .object({
      start: z.string(), // "09:00"
      end: z.string(), // "17:00"
      days: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])),
    })
    .optional(),

  // Consent & Compliance
  tcpaConsent: TCPAConsentSchema,
  dncStatus: DNCStatusSchema.default("unknown"),
  optedOut: z.boolean().default(false),
  optedOutAt: z.date().optional(),
  optedOutReason: z.string().optional(),

  // Screening Data
  screening: ScreeningDataSchema.optional(),

  // Job Context
  appliedFor: JobApplicationSchema,

  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  lastContactedAt: z.date().optional(),

  // Additional Info
  resumeUrl: z.string().url().optional(),
  linkedInUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  currentCompany: z.string().optional(),
  currentTitle: z.string().optional(),
  yearsOfExperience: z.number().optional(),
  desiredSalary: z
    .object({
      min: z.number(),
      max: z.number(),
      currency: z.string().default("USD"),
    })
    .optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * Partial Candidate for updates
 */
export const CandidateUpdateSchema = CandidateSchema.partial().omit({
  id: true,
  atsId: true,
  createdAt: true,
});

export type CandidateUpdate = z.infer<typeof CandidateUpdateSchema>;

/**
 * Helper function to validate and parse candidate data
 */
export function validateCandidate(data: unknown): Candidate {
  return CandidateSchema.parse(data);
}

/**
 * Helper to check if candidate can be called
 */
export function canContactCandidate(candidate: Candidate): {
  allowed: boolean;
  reason?: string;
} {
  if (candidate.optedOut) {
    return { allowed: false, reason: "Candidate has opted out of communications" };
  }

  if (candidate.dncStatus === "registered") {
    return {
      allowed: false,
      reason: "Phone number is on Do Not Call registry",
    };
  }

  if (!candidate.tcpaConsent.granted) {
    return { allowed: false, reason: "TCPA consent not granted" };
  }

  if (
    candidate.screening?.status === "in_progress" ||
    candidate.screening?.status === "scheduled"
  ) {
    return {
      allowed: false,
      reason: "Screening already in progress or scheduled",
    };
  }

  return { allowed: true };
}

/**
 * Helper to format candidate name
 */
export function getFullName(candidate: Candidate): string {
  return `${candidate.firstName} ${candidate.lastName}`;
}

/**
 * Helper to check if screening is complete
 */
export function hasCompletedScreening(candidate: Candidate): boolean {
  return candidate.screening?.status === "completed";
}
