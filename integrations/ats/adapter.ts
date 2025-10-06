/**
 * ATS Adapter Interface
 * Defines the standard interface for all ATS integrations
 * Implementations: Greenhouse, Lever, Workday, etc.
 */

import type {
  Candidate,
  CandidateUpdate,
  Job,
  Interview,
  InterviewUpdate,
} from "../../shared/models/index.js";

/**
 * Screening Results to submit to ATS
 */
export interface ScreeningResults {
  completedAt: Date;
  transcript: string;
  summary: string;
  answers: Record<string, any>;
  engagementScore?: number;
  recommendation?: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  redFlags?: string[];
  strengths?: string[];
  recordingUrl?: string;
}

/**
 * Candidate Filter Options
 */
export interface CandidateFilterOptions {
  status?: string | string[];
  jobId?: string;
  limit?: number;
  offset?: number;
  updatedAfter?: Date;
  tags?: string[];
}

/**
 * Job Filter Options
 */
export interface JobFilterOptions {
  status?: "draft" | "open" | "on_hold" | "filled" | "closed";
  department?: string;
  limit?: number;
  offset?: number;
}

/**
 * ATS Webhook Event
 */
export interface ATSWebhookEvent {
  type:
    | "candidate.created"
    | "candidate.updated"
    | "candidate.status_changed"
    | "job.created"
    | "job.updated"
    | "interview.scheduled"
    | "interview.cancelled";
  timestamp: Date;
  data: any;
}

/**
 * ATS Adapter Interface
 * All ATS integrations must implement this interface
 */
export interface ATSAdapter {
  /**
   * Test the connection to the ATS
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the ATS provider name
   */
  getProviderName(): string;

  /****************************************************
   * Candidate Operations
   ****************************************************/

  /**
   * Get candidates by filter criteria
   */
  getCandidates(options?: CandidateFilterOptions): Promise<Candidate[]>;

  /**
   * Get a single candidate by ID
   */
  getCandidate(id: string): Promise<Candidate>;

  /**
   * Update candidate information
   */
  updateCandidate(id: string, data: CandidateUpdate): Promise<void>;

  /**
   * Add a note to candidate's profile
   */
  addCandidateNote(
    id: string,
    note: string,
    visibility?: "public" | "private"
  ): Promise<void>;

  /**
   * Add tags to candidate
   */
  addCandidateTags(id: string, tags: string[]): Promise<void>;

  /**
   * Update candidate stage in hiring pipeline
   */
  updateCandidateStage(id: string, stage: string): Promise<void>;

  /**
   * Reject candidate with reason
   */
  rejectCandidate(id: string, reason?: string): Promise<void>;

  /**
   * Advance candidate to next stage
   */
  advanceCandidate(id: string): Promise<void>;

  /****************************************************
   * Job Operations
   ****************************************************/

  /**
   * Get all jobs matching filter criteria
   */
  getJobs(options?: JobFilterOptions): Promise<Job[]>;

  /**
   * Get a single job by ID
   */
  getJob(id: string): Promise<Job>;

  /**
   * Get active/open jobs
   */
  getActiveJobs(): Promise<Job[]>;

  /****************************************************
   * Screening Operations
   ****************************************************/

  /**
   * Submit screening results to ATS
   */
  submitScreeningResults(
    candidateId: string,
    results: ScreeningResults
  ): Promise<void>;

  /**
   * Get screening questions for a job
   */
  getScreeningQuestions(jobId: string): Promise<any[]>;

  /****************************************************
   * Interview Operations
   ****************************************************/

  /**
   * Create a new interview in ATS
   */
  createInterview(interview: Interview): Promise<string>;

  /**
   * Update an existing interview
   */
  updateInterview(id: string, data: InterviewUpdate): Promise<void>;

  /**
   * Cancel an interview
   */
  cancelInterview(id: string, reason?: string): Promise<void>;

  /**
   * Submit interview feedback
   */
  submitInterviewFeedback(
    interviewId: string,
    feedback: {
      rating: number;
      recommendation: string;
      notes: string;
      interviewerId: string;
    }
  ): Promise<void>;

  /****************************************************
   * Webhook Operations
   ****************************************************/

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): ATSWebhookEvent;

  /****************************************************
   * Attachments
   ****************************************************/

  /**
   * Upload a file attachment to candidate profile
   */
  uploadAttachment(
    candidateId: string,
    file: Buffer,
    filename: string,
    type: "resume" | "cover_letter" | "transcript" | "other"
  ): Promise<string>;

  /****************************************************
   * Search & Query
   ****************************************************/

  /**
   * Search candidates by query
   */
  searchCandidates(query: string): Promise<Candidate[]>;

  /**
   * Get candidates needing screening
   */
  getCandidatesNeedingScreening(jobId?: string): Promise<Candidate[]>;

  /**
   * Get candidates awaiting interview scheduling
   */
  getCandidatesAwaitingScheduling(jobId?: string): Promise<Candidate[]>;
}

/**
 * Base ATS Adapter with common functionality
 */
export abstract class BaseATSAdapter implements ATSAdapter {
  constructor(
    protected apiKey: string,
    protected baseUrl: string
  ) {}

  abstract testConnection(): Promise<boolean>;
  abstract getProviderName(): string;
  abstract getCandidates(options?: CandidateFilterOptions): Promise<Candidate[]>;
  abstract getCandidate(id: string): Promise<Candidate>;
  abstract updateCandidate(id: string, data: CandidateUpdate): Promise<void>;
  abstract addCandidateNote(
    id: string,
    note: string,
    visibility?: "public" | "private"
  ): Promise<void>;
  abstract addCandidateTags(id: string, tags: string[]): Promise<void>;
  abstract updateCandidateStage(id: string, stage: string): Promise<void>;
  abstract rejectCandidate(id: string, reason?: string): Promise<void>;
  abstract advanceCandidate(id: string): Promise<void>;
  abstract getJobs(options?: JobFilterOptions): Promise<Job[]>;
  abstract getJob(id: string): Promise<Job>;
  abstract getActiveJobs(): Promise<Job[]>;
  abstract submitScreeningResults(
    candidateId: string,
    results: ScreeningResults
  ): Promise<void>;
  abstract getScreeningQuestions(jobId: string): Promise<any[]>;
  abstract createInterview(interview: Interview): Promise<string>;
  abstract updateInterview(id: string, data: InterviewUpdate): Promise<void>;
  abstract cancelInterview(id: string, reason?: string): Promise<void>;
  abstract submitInterviewFeedback(
    interviewId: string,
    feedback: {
      rating: number;
      recommendation: string;
      notes: string;
      interviewerId: string;
    }
  ): Promise<void>;
  abstract verifyWebhookSignature(payload: string, signature: string): boolean;
  abstract parseWebhookEvent(payload: any): ATSWebhookEvent;
  abstract uploadAttachment(
    candidateId: string,
    file: Buffer,
    filename: string,
    type: "resume" | "cover_letter" | "transcript" | "other"
  ): Promise<string>;
  abstract searchCandidates(query: string): Promise<Candidate[]>;
  abstract getCandidatesNeedingScreening(jobId?: string): Promise<Candidate[]>;
  abstract getCandidatesAwaitingScheduling(
    jobId?: string
  ): Promise<Candidate[]>;

  /**
   * Common HTTP request helper with error handling
   */
  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.getAuthHeader(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `ATS API Error (${response.status}): ${error || response.statusText}`
      );
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get authorization header (override in subclasses if needed)
   */
  protected getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`;
  }

  /**
   * Common error handler
   */
  protected handleError(error: any, operation: string): never {
    console.error(`ATS ${operation} failed:`, error);
    throw new Error(`Failed to ${operation}: ${error.message}`);
  }
}
