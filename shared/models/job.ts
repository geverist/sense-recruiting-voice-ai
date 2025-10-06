import { z } from "zod";

/**
 * Screening Question Definition
 */
export const ScreeningQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum([
    "yes_no",
    "multiple_choice",
    "open_ended",
    "numeric",
    "date",
    "years_of_experience",
    "salary_expectation",
  ]),
  required: z.boolean().default(true),
  order: z.number(),

  // For multiple choice questions
  options: z.array(z.string()).optional(),

  // For validation
  minValue: z.number().optional(),
  maxValue: z.number().optional(),

  // For scoring
  weight: z.number().min(0).max(1).default(1),
  idealAnswer: z.any().optional(),

  // Multi-language support
  translations: z
    .record(
      z.string(),
      z.object({
        question: z.string(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional(),
});

export type ScreeningQuestion = z.infer<typeof ScreeningQuestionSchema>;

/**
 * Required Skills and Experience
 */
export const SkillRequirementSchema = z.object({
  skill: z.string(),
  required: z.boolean(),
  minimumYears: z.number().optional(),
  proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
});

export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

/**
 * Hiring Team Member
 */
export const HiringTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum([
    "hiring_manager",
    "recruiter",
    "technical_interviewer",
    "team_member",
    "hr",
  ]),
  phone: z.string().optional(),
  calendarId: z.string().optional(), // Google Calendar ID, Outlook calendar ID, etc.
  timezone: z.string().default("America/New_York"),
});

export type HiringTeamMember = z.infer<typeof HiringTeamMemberSchema>;

/**
 * Job Location
 */
export const JobLocationSchema = z.object({
  type: z.enum(["remote", "hybrid", "onsite"]),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string(),
  timezone: z.string().optional(),
  officeAddress: z.string().optional(),
});

export type JobLocation = z.infer<typeof JobLocationSchema>;

/**
 * Compensation Details
 */
export const CompensationSchema = z.object({
  salaryMin: z.number(),
  salaryMax: z.number(),
  currency: z.string().default("USD"),
  period: z.enum(["hourly", "annually"]),
  bonusEligible: z.boolean().optional(),
  equityOffered: z.boolean().optional(),
});

export type Compensation = z.infer<typeof CompensationSchema>;

/**
 * Complete Job Model
 */
export const JobSchema = z.object({
  // Identity
  id: z.string().uuid(),
  atsId: z.string(), // External ATS ID
  title: z.string(),
  requisitionNumber: z.string(),

  // Details
  department: z.string(),
  description: z.string(),
  responsibilities: z.array(z.string()).optional(),
  location: JobLocationSchema,
  compensation: CompensationSchema.optional(),

  // Requirements
  requiredSkills: z.array(SkillRequirementSchema),
  preferredSkills: z.array(SkillRequirementSchema).optional(),
  minimumEducation: z
    .enum(["high_school", "associates", "bachelors", "masters", "phd"])
    .optional(),
  minimumYearsExperience: z.number(),

  // Screening
  screeningQuestions: z.array(ScreeningQuestionSchema),
  autoScreeningEnabled: z.boolean().default(true),
  screeningScoreThreshold: z.number().min(0).max(10).optional(),

  // Hiring Team
  hiringTeam: z.array(HiringTeamMemberSchema),
  primaryRecruiter: z.string(), // User ID of primary recruiter

  // Interview Process
  interviewStages: z
    .array(
      z.object({
        stage: z.string(),
        duration: z.number(), // minutes
        interviewers: z.array(z.string()), // User IDs
        type: z.enum(["phone", "video", "onsite", "technical", "behavioral"]),
      })
    )
    .optional(),

  // Settings
  status: z.enum(["draft", "open", "on_hold", "filled", "closed"]),
  openedAt: z.date().optional(),
  targetStartDate: z.date().optional(),
  numberOfOpenings: z.number().default(1),

  // Multi-language
  supportedLanguages: z.array(z.string()).default(["en-US"]),

  // Metadata
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string(), // User ID
});

export type Job = z.infer<typeof JobSchema>;

/**
 * Partial Job for updates
 */
export const JobUpdateSchema = JobSchema.partial().omit({
  id: true,
  atsId: true,
  createdAt: true,
  createdBy: true,
});

export type JobUpdate = z.infer<typeof JobUpdateSchema>;

/**
 * Helper function to validate and parse job data
 */
export function validateJob(data: unknown): Job {
  return JobSchema.parse(data);
}

/**
 * Get hiring manager from team
 */
export function getHiringManager(job: Job): HiringTeamMember | undefined {
  return job.hiringTeam.find((member) => member.role === "hiring_manager");
}

/**
 * Get all interviewers
 */
export function getInterviewers(job: Job): HiringTeamMember[] {
  return job.hiringTeam.filter(
    (member) =>
      member.role === "technical_interviewer" || member.role === "team_member"
  );
}

/**
 * Check if job is actively hiring
 */
export function isActivelyHiring(job: Job): boolean {
  return job.status === "open" && job.numberOfOpenings > 0;
}

/**
 * Get screening questions for a specific language
 */
export function getScreeningQuestionsForLanguage(
  job: Job,
  language: string
): ScreeningQuestion[] {
  return job.screeningQuestions.map((q) => {
    if (language === "en-US" || !q.translations?.[language]) {
      return q;
    }

    const translation = q.translations[language];
    return {
      ...q,
      question: translation.question,
      options: translation.options || q.options,
    };
  });
}

/**
 * Format compensation range
 */
export function formatCompensationRange(job: Job): string {
  if (!job.compensation) return "Compensation not specified";

  const { salaryMin, salaryMax, currency, period } = job.compensation;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
  });

  const periodText = period === "hourly" ? "/hour" : "/year";
  return `${formatter.format(salaryMin)} - ${formatter.format(salaryMax)}${periodText}`;
}
