import { z } from "zod";
import { HiringTeamMemberSchema } from "./job.js";

/**
 * Interview Participant (can include candidate + hiring team)
 */
export const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum([
    "candidate",
    "hiring_manager",
    "recruiter",
    "technical_interviewer",
    "team_member",
    "hr",
  ]),
  phone: z.string().optional(),
  timezone: z.string(),
  calendarId: z.string().optional(),
  rsvpStatus: z.enum(["pending", "accepted", "declined", "tentative"]).optional(),
});

export type Participant = z.infer<typeof ParticipantSchema>;

/**
 * Time Slot for Availability
 */
export const TimeSlotSchema = z.object({
  start: z.date(),
  end: z.date(),
  timezone: z.string(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

/**
 * Availability Window
 */
export const AvailabilitySchema = z.object({
  participantId: z.string(),
  slots: z.array(TimeSlotSchema),
  preferredSlots: z.array(TimeSlotSchema).optional(),
  blackoutDates: z.array(z.date()).optional(),
});

export type Availability = z.infer<typeof AvailabilitySchema>;

/**
 * Calendar Event Reference (for sync across providers)
 */
export const CalendarEventSchema = z.object({
  provider: z.enum(["google", "outlook", "apple"]),
  eventId: z.string(),
  calendarId: z.string(),
  participantEmail: z.string(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

/**
 * Interview Feedback
 */
export const InterviewFeedbackSchema = z.object({
  interviewerId: z.string(),
  interviewerName: z.string(),
  submittedAt: z.date(),
  rating: z.number().min(1).max(5),
  recommendation: z.enum(["strong_yes", "yes", "maybe", "no", "strong_no"]),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  notes: z.string().optional(),
  skillsAssessed: z
    .record(
      z.string(),
      z.object({
        rating: z.number().min(1).max(5),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export type InterviewFeedback = z.infer<typeof InterviewFeedbackSchema>;

/**
 * Complete Interview Model
 */
export const InterviewSchema = z.object({
  // Identity
  id: z.string().uuid(),
  candidateId: z.string().uuid(),
  jobId: z.string().uuid(),

  // Type & Details
  type: z.enum([
    "phone_screen",
    "technical_phone",
    "video_screen",
    "technical_video",
    "onsite",
    "behavioral",
    "culture_fit",
    "final",
  ]),
  stage: z.string().optional(), // e.g., "Round 1", "Technical Assessment"
  title: z.string().optional(),
  description: z.string().optional(),

  // Scheduling
  scheduledAt: z.date().optional(),
  duration: z.number(), // minutes
  timezone: z.string(),
  location: z.string().optional(), // For onsite: address, For video: meeting link

  // Participants
  participants: z.array(ParticipantSchema),
  candidateAvailability: z.array(TimeSlotSchema).optional(),

  // Status
  status: z.enum([
    "availability_requested",
    "scheduling",
    "scheduled",
    "rescheduling",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
  ]),

  // Calendar Integration
  calendarEvents: z.array(CalendarEventSchema).optional(),
  meetingLink: z.string().url().optional(), // Zoom, Google Meet, etc.
  dialInNumber: z.string().optional(),

  // Confirmation
  confirmedByCandidateAt: z.date().optional(),
  reminderSentAt: z.date().optional(),
  lastReminderSentAt: z.date().optional(),

  // Rescheduling
  rescheduleRequested: z.boolean().default(false),
  rescheduleRequestedBy: z.string().optional(),
  rescheduleRequestedAt: z.date().optional(),
  rescheduleReason: z.string().optional(),
  originalScheduledAt: z.date().optional(),
  rescheduleCount: z.number().default(0),

  // Completion
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  recordingUrl: z.string().url().optional(),
  transcriptUrl: z.string().url().optional(),

  // Feedback
  feedback: z.array(InterviewFeedbackSchema).optional(),

  // Cancellation
  cancelledAt: z.date().optional(),
  cancelledBy: z.string().optional(),
  cancellationReason: z.string().optional(),

  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(), // User ID
  atsInterviewId: z.string().optional(), // External ATS Interview ID

  // Automation
  scheduledViaAI: z.boolean().default(false),
  schedulingCallSid: z.string().optional(),
});

export type Interview = z.infer<typeof InterviewSchema>;

/**
 * Partial Interview for updates
 */
export const InterviewUpdateSchema = InterviewSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export type InterviewUpdate = z.infer<typeof InterviewUpdateSchema>;

/**
 * Helper function to validate and parse interview data
 */
export function validateInterview(data: unknown): Interview {
  return InterviewSchema.parse(data);
}

/**
 * Check if interview needs confirmation
 */
export function needsConfirmation(interview: Interview): boolean {
  return (
    interview.status === "scheduled" &&
    !interview.confirmedByCandidateAt &&
    interview.scheduledAt !== undefined
  );
}

/**
 * Check if interview can be rescheduled
 */
export function canReschedule(interview: Interview): boolean {
  const MAX_RESCHEDULES = 2;
  return (
    interview.rescheduleCount < MAX_RESCHEDULES &&
    ["scheduled", "confirmed"].includes(interview.status)
  );
}

/**
 * Get candidate from participants
 */
export function getCandidate(interview: Interview): Participant | undefined {
  return interview.participants.find((p) => p.role === "candidate");
}

/**
 * Get interviewers from participants
 */
export function getInterviewers(interview: Interview): Participant[] {
  return interview.participants.filter((p) => p.role !== "candidate");
}

/**
 * Check if all participants have accepted
 */
export function allParticipantsAccepted(interview: Interview): boolean {
  return interview.participants.every(
    (p) => p.rsvpStatus === "accepted" || p.rsvpStatus === undefined
  );
}

/**
 * Calculate average feedback rating
 */
export function getAverageFeedbackRating(interview: Interview): number | null {
  if (!interview.feedback || interview.feedback.length === 0) {
    return null;
  }

  const sum = interview.feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / interview.feedback.length;
}

/**
 * Get overall recommendation
 */
export function getOverallRecommendation(
  interview: Interview
): "strong_yes" | "yes" | "maybe" | "no" | "strong_no" | null {
  if (!interview.feedback || interview.feedback.length === 0) {
    return null;
  }

  // Map recommendations to numeric values
  const scoreMap = {
    strong_yes: 5,
    yes: 4,
    maybe: 3,
    no: 2,
    strong_no: 1,
  };

  const reverseMap = {
    5: "strong_yes",
    4: "yes",
    3: "maybe",
    2: "no",
    1: "strong_no",
  } as const;

  const avgScore =
    interview.feedback.reduce((acc, f) => acc + scoreMap[f.recommendation], 0) /
    interview.feedback.length;

  const roundedScore = Math.round(avgScore) as 1 | 2 | 3 | 4 | 5;
  return reverseMap[roundedScore];
}

/**
 * Check if interview is upcoming (within next 24 hours)
 */
export function isUpcoming(interview: Interview): boolean {
  if (!interview.scheduledAt || interview.status !== "scheduled") {
    return false;
  }

  const now = new Date();
  const scheduledTime = new Date(interview.scheduledAt);
  const hoursDiff = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursDiff > 0 && hoursDiff <= 24;
}

/**
 * Format interview time for display
 */
export function formatInterviewTime(interview: Interview): string {
  if (!interview.scheduledAt) return "Not scheduled";

  const date = new Date(interview.scheduledAt);
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: interview.timezone,
  });

  return `${formatter.format(date)} (${interview.timezone})`;
}
