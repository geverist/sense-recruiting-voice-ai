import { z } from "zod";

/**
 * Reference Question
 */
export const ReferenceQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum([
    "yes_no",
    "rating",
    "open_ended",
    "multiple_choice",
    "relationship_verification",
  ]),
  required: z.boolean().default(true),
  order: z.number(),

  // For rating questions
  ratingScale: z
    .object({
      min: z.number(),
      max: z.number(),
      minLabel: z.string().optional(),
      maxLabel: z.string().optional(),
    })
    .optional(),

  // For multiple choice
  options: z.array(z.string()).optional(),

  // For scoring
  weight: z.number().min(0).max(1).default(1),

  // Category for grouping
  category: z
    .enum([
      "relationship",
      "performance",
      "skills",
      "work_ethic",
      "teamwork",
      "communication",
      "leadership",
      "reliability",
      "rehire",
    ])
    .optional(),
});

export type ReferenceQuestion = z.infer<typeof ReferenceQuestionSchema>;

/**
 * Reference Contact Information
 */
export const ReferenceContactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(), // E.164 format
  relationship: z.string(), // e.g., "Manager", "Coworker", "Client"
  company: z.string(),
  title: z.string().optional(),
  workedTogether: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
});

export type ReferenceContact = z.infer<typeof ReferenceContactSchema>;

/**
 * Reference Answer
 */
export const ReferenceAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.any(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  notes: z.string().optional(),
  timestamp: z.date(),
});

export type ReferenceAnswer = z.infer<typeof ReferenceAnswerSchema>;

/**
 * Reference Validation Result
 */
export const ValidationResultSchema = z.object({
  verified: z.boolean(),
  method: z.enum(["phone", "email", "linkedin", "company_directory"]),
  verifiedAt: z.date(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Reference Red Flag
 */
export const RedFlagSchema = z.object({
  type: z.enum([
    "employment_dates_mismatch",
    "title_mismatch",
    "negative_performance",
    "would_not_rehire",
    "integrity_concern",
    "attendance_issue",
    "attitude_problem",
    "skill_deficiency",
    "policy_violation",
    "other",
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string(),
  detectedAt: z.date(),
});

export type RedFlag = z.infer<typeof RedFlagSchema>;

/**
 * Complete Reference Check Model
 */
export const ReferenceSchema = z.object({
  // Identity
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),

  // Contact Information
  contact: ReferenceContactSchema,

  // Status
  status: z.enum([
    "pending",
    "scheduled",
    "in_progress",
    "completed",
    "failed",
    "declined",
    "unreachable",
    "invalid",
  ]),

  // Scheduling
  scheduledAt: z.date().optional(),
  attemptCount: z.number().default(0),
  maxAttempts: z.number().default(3),
  lastAttemptAt: z.date().optional(),

  // Call Details
  callSid: z.string().optional(),
  recordingUrl: z.string().url().optional(),
  transcript: z.string().optional(),
  duration: z.number().optional(), // seconds

  // Consent
  consentGiven: z.boolean().optional(),
  consentRecordedAt: z.date().optional(),

  // Questions & Answers
  questions: z.array(ReferenceQuestionSchema),
  answers: z.array(ReferenceAnswerSchema).optional(),

  // Validation
  validation: ValidationResultSchema.optional(),

  // Analysis
  overallRating: z.number().min(1).max(5).optional(),
  recommendation: z
    .enum(["highly_recommended", "recommended", "neutral", "not_recommended"])
    .optional(),
  strengths: z.array(z.string()).optional(),
  concerns: z.array(z.string()).optional(),
  redFlags: z.array(RedFlagSchema).optional(),

  // Summary
  summary: z.string().optional(),
  keyInsights: z.array(z.string()).optional(),

  // Key Verification Points
  verifiedEmployment: z.boolean().optional(),
  verifiedTitle: z.boolean().optional(),
  verifiedDates: z.boolean().optional(),
  wouldRehire: z.boolean().optional(),

  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
  createdBy: z.string(), // User ID
  automatedCheck: z.boolean().default(false),

  // Compliance
  candidateConsent: z.boolean().default(false),
  candidateConsentDate: z.date().optional(),
  fcraCompliant: z.boolean().default(true), // Fair Credit Reporting Act
});

export type Reference = z.infer<typeof ReferenceSchema>;

/**
 * Partial Reference for updates
 */
export const ReferenceUpdateSchema = ReferenceSchema.partial().omit({
  id: true,
  candidateId: true,
  jobId: true,
  createdAt: true,
  createdBy: true,
});

export type ReferenceUpdate = z.infer<typeof ReferenceUpdateSchema>;

/**
 * Helper function to validate and parse reference data
 */
export function validateReference(data: unknown): Reference {
  return ReferenceSchema.parse(data);
}

/**
 * Check if reference can be contacted
 */
export function canContactReference(reference: Reference): {
  allowed: boolean;
  reason?: string;
} {
  if (!reference.candidateConsent) {
    return {
      allowed: false,
      reason: "Candidate consent required before contacting references",
    };
  }

  if (reference.status === "completed") {
    return { allowed: false, reason: "Reference check already completed" };
  }

  if (reference.status === "declined") {
    return { allowed: false, reason: "Reference declined to provide information" };
  }

  if (reference.attemptCount >= reference.maxAttempts) {
    return {
      allowed: false,
      reason: `Maximum contact attempts (${reference.maxAttempts}) reached`,
    };
  }

  if (!reference.contact.phone && !reference.contact.email) {
    return {
      allowed: false,
      reason: "No contact information available for reference",
    };
  }

  return { allowed: true };
}

/**
 * Check if reference has critical red flags
 */
export function hasCriticalRedFlags(reference: Reference): boolean {
  return (
    reference.redFlags?.some((flag) => flag.severity === "critical") || false
  );
}

/**
 * Calculate reference score (0-10)
 */
export function calculateReferenceScore(reference: Reference): number | null {
  if (!reference.overallRating) return null;

  let score = reference.overallRating * 2; // Convert 1-5 to 2-10

  // Deduct points for red flags
  if (reference.redFlags) {
    const deductions = reference.redFlags.reduce((total, flag) => {
      const deductionMap = { low: 0.5, medium: 1, high: 2, critical: 5 };
      return total + deductionMap[flag.severity];
    }, 0);
    score = Math.max(0, score - deductions);
  }

  // Bonus for positive indicators
  if (reference.wouldRehire === true) score += 1;
  if (reference.validation?.verified) score += 0.5;

  return Math.min(10, Math.max(0, score));
}

/**
 * Get employment verification status
 */
export function getVerificationStatus(reference: Reference): {
  employment: boolean;
  title: boolean;
  dates: boolean;
  overall: boolean;
} {
  const employment = reference.verifiedEmployment || false;
  const title = reference.verifiedTitle || false;
  const dates = reference.verifiedDates || false;
  const overall = employment && title && dates;

  return { employment, title, dates, overall };
}

/**
 * Format reference check summary
 */
export function formatReferenceSummary(reference: Reference): string {
  if (!reference.summary) return "Reference check in progress";

  const score = calculateReferenceScore(reference);
  const scoreText = score !== null ? `Score: ${score.toFixed(1)}/10` : "";
  const rehireText = reference.wouldRehire
    ? "Would rehire"
    : reference.wouldRehire === false
    ? "Would NOT rehire"
    : "";

  return `${reference.contact.name} (${reference.contact.relationship})
${scoreText} ${rehireText ? `| ${rehireText}` : ""}
${reference.summary}`;
}

/**
 * Get answers by category
 */
export function getAnswersByCategory(
  reference: Reference
): Record<string, ReferenceAnswer[]> {
  if (!reference.answers) return {};

  const categorized: Record<string, ReferenceAnswer[]> = {};

  reference.answers.forEach((answer) => {
    const question = reference.questions.find((q) => q.id === answer.questionId);
    if (question?.category) {
      if (!categorized[question.category]) {
        categorized[question.category] = [];
      }
      categorized[question.category].push(answer);
    }
  });

  return categorized;
}

/**
 * Check if reference is stale (needs follow-up)
 */
export function isStale(reference: Reference): boolean {
  if (reference.status === "completed" || reference.status === "declined") {
    return false;
  }

  if (!reference.lastAttemptAt) return false;

  const daysSinceLastAttempt =
    (new Date().getTime() - reference.lastAttemptAt.getTime()) /
    (1000 * 60 * 60 * 24);

  return daysSinceLastAttempt > 3; // Consider stale after 3 days
}
