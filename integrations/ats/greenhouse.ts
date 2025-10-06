/**
 * Greenhouse ATS Adapter
 * Documentation: https://developers.greenhouse.io/harvest.html
 */

import crypto from "crypto";
import type {
  Candidate,
  CandidateUpdate,
  Job,
  Interview,
  InterviewUpdate,
  ScreeningQuestion,
  HiringTeamMember,
} from "../../shared/models/index.js";
import {
  BaseATSAdapter,
  type ATSWebhookEvent,
  type CandidateFilterOptions,
  type JobFilterOptions,
  type ScreeningResults,
} from "./adapter.js";

/**
 * Greenhouse-specific types
 */
interface GreenhouseCandidate {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_activity: string;
  is_private: boolean;
  phone_numbers: Array<{
    value: string;
    type: string;
  }>;
  email_addresses: Array<{
    value: string;
    type: string;
  }>;
  applications: Array<{
    id: number;
    candidate_id: number;
    prospect: boolean;
    applied_at: string;
    rejected_at: string | null;
    last_activity_at: string;
    source: {
      id: number;
      public_name: string;
    } | null;
    credited_to: {
      id: number;
      first_name: string;
      last_name: string;
      name: string;
      employee_id: string | null;
    } | null;
    rejection_reason: {
      id: number;
      name: string;
      type: {
        id: number;
        name: string;
      };
    } | null;
    rejection_details: {
      message: string | null;
      internal_notes: string | null;
    } | null;
    jobs: Array<{
      id: number;
      name: string;
    }>;
    status: string;
    current_stage: {
      id: number;
      name: string;
    } | null;
    answers: Array<{
      question: string;
      answer: string;
    }>;
  }>;
  tags: string[];
  custom_fields: Record<string, any>;
}

interface GreenhouseJob {
  id: number;
  name: string;
  requisition_id: string;
  notes: string;
  confidential: boolean;
  status: string;
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  departments: Array<{
    id: number;
    name: string;
    parent_id: number | null;
    child_ids: number[];
    external_id: string | null;
  }>;
  offices: Array<{
    id: number;
    name: string;
    location: {
      name: string;
    };
  }>;
  hiring_team: {
    hiring_managers: Array<{
      id: number;
      first_name: string;
      last_name: string;
      name: string;
      employee_id: string | null;
      responsible: boolean;
    }>;
    recruiters: Array<{
      id: number;
      first_name: string;
      last_name: string;
      name: string;
      employee_id: string | null;
      responsible: boolean;
    }>;
    coordinators: Array<{
      id: number;
      first_name: string;
      last_name: string;
      name: string;
      employee_id: string | null;
      responsible: boolean;
    }>;
    sourcers: Array<{
      id: number;
      first_name: string;
      last_name: string;
      name: string;
      employee_id: string | null;
      responsible: boolean;
    }>;
  };
  custom_fields: Record<string, any>;
}

export class GreenhouseAdapter extends BaseATSAdapter {
  private webhookSecret?: string;

  constructor(apiKey: string, baseUrl?: string, webhookSecret?: string) {
    super(apiKey, baseUrl || "https://harvest.greenhouse.io/v1");
    this.webhookSecret = webhookSecret;
  }

  getProviderName(): string {
    return "Greenhouse";
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest<any>("/users");
      return true;
    } catch {
      return false;
    }
  }

  /****************************************************
   * Candidate Operations
   ****************************************************/

  async getCandidates(
    options: CandidateFilterOptions = {}
  ): Promise<Candidate[]> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append("per_page", options.limit.toString());
      if (options.offset) params.append("page", (options.offset / (options.limit || 100) + 1).toString());
      if (options.updatedAfter) params.append("updated_after", options.updatedAfter.toISOString());

      const endpoint = `/candidates?${params.toString()}`;
      const ghCandidates = await this.makeRequest<GreenhouseCandidate[]>(endpoint);

      return ghCandidates
        .filter((ghc) => {
          if (options.jobId) {
            return ghc.applications.some(
              (app) => app.jobs.some((job) => job.id.toString() === options.jobId)
            );
          }
          return true;
        })
        .map((ghc) => this.transformCandidate(ghc));
    } catch (error) {
      return this.handleError(error, "get candidates");
    }
  }

  async getCandidate(id: string): Promise<Candidate> {
    try {
      const ghCandidate = await this.makeRequest<GreenhouseCandidate>(
        `/candidates/${id}`
      );
      return this.transformCandidate(ghCandidate);
    } catch (error) {
      return this.handleError(error, `get candidate ${id}`);
    }
  }

  async updateCandidate(id: string, data: CandidateUpdate): Promise<void> {
    try {
      // Greenhouse doesn't allow direct candidate updates
      // We need to use specific endpoints for each field
      if (data.phone) {
        await this.updateCandidatePhone(id, data.phone);
      }
      if (data.email) {
        await this.updateCandidateEmail(id, data.email);
      }
      // Custom fields can be updated
      if (data.screening) {
        await this.updateCustomFields(id, {
          screening_status: data.screening.status,
          engagement_score: data.screening.engagementScore,
        });
      }
    } catch (error) {
      return this.handleError(error, `update candidate ${id}`);
    }
  }

  private async updateCandidatePhone(id: string, phone: string): Promise<void> {
    await this.makeRequest(`/candidates/${id}/phone_numbers`, {
      method: "POST",
      body: JSON.stringify({
        phone_number: {
          value: phone,
          type: "mobile",
        },
      }),
    });
  }

  private async updateCandidateEmail(id: string, email: string): Promise<void> {
    await this.makeRequest(`/candidates/${id}/email_addresses`, {
      method: "POST",
      body: JSON.stringify({
        email_address: {
          value: email,
          type: "personal",
        },
      }),
    });
  }

  private async updateCustomFields(
    id: string,
    fields: Record<string, any>
  ): Promise<void> {
    await this.makeRequest(`/candidates/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        custom_fields: fields,
      }),
    });
  }

  async addCandidateNote(
    id: string,
    note: string,
    visibility: "public" | "private" = "private"
  ): Promise<void> {
    try {
      await this.makeRequest(`/candidates/${id}/activity_feed/notes`, {
        method: "POST",
        body: JSON.stringify({
          user_id: null, // Will use API key user
          message: note,
          visibility: visibility === "private" ? "private" : "public",
        }),
      });
    } catch (error) {
      return this.handleError(error, `add note to candidate ${id}`);
    }
  }

  async addCandidateTags(id: string, tags: string[]): Promise<void> {
    try {
      await this.makeRequest(`/candidates/${id}/tags`, {
        method: "PUT",
        body: JSON.stringify({
          tags: tags,
        }),
      });
    } catch (error) {
      return this.handleError(error, `add tags to candidate ${id}`);
    }
  }

  async updateCandidateStage(id: string, stage: string): Promise<void> {
    try {
      // Get the application first
      const candidate = await this.getCandidate(id);
      const application = await this.getCurrentApplication(id);

      // Move to stage
      await this.makeRequest(`/applications/${application.id}/move`, {
        method: "POST",
        body: JSON.stringify({
          stage_id: stage,
        }),
      });
    } catch (error) {
      return this.handleError(error, `update candidate ${id} stage`);
    }
  }

  async rejectCandidate(id: string, reason?: string): Promise<void> {
    try {
      const application = await this.getCurrentApplication(id);

      await this.makeRequest(`/applications/${application.id}/reject`, {
        method: "POST",
        body: JSON.stringify({
          rejection_reason_id: null,
          notes: reason || "Rejected after AI screening",
        }),
      });
    } catch (error) {
      return this.handleError(error, `reject candidate ${id}`);
    }
  }

  async advanceCandidate(id: string): Promise<void> {
    try {
      const application = await this.getCurrentApplication(id);

      await this.makeRequest(`/applications/${application.id}/advance`, {
        method: "POST",
      });
    } catch (error) {
      return this.handleError(error, `advance candidate ${id}`);
    }
  }

  private async getCurrentApplication(candidateId: string): Promise<any> {
    const candidate = await this.makeRequest<GreenhouseCandidate>(
      `/candidates/${candidateId}`
    );
    const activeApp = candidate.applications.find((app) => !app.rejected_at);
    if (!activeApp) {
      throw new Error(`No active application found for candidate ${candidateId}`);
    }
    return activeApp;
  }

  /****************************************************
   * Job Operations
   ****************************************************/

  async getJobs(options: JobFilterOptions = {}): Promise<Job[]> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append("per_page", options.limit.toString());
      if (options.status) params.append("status", options.status);

      const endpoint = `/jobs?${params.toString()}`;
      const ghJobs = await this.makeRequest<GreenhouseJob[]>(endpoint);

      return ghJobs.map((ghj) => this.transformJob(ghj));
    } catch (error) {
      return this.handleError(error, "get jobs");
    }
  }

  async getJob(id: string): Promise<Job> {
    try {
      const ghJob = await this.makeRequest<GreenhouseJob>(`/jobs/${id}`);
      return this.transformJob(ghJob);
    } catch (error) {
      return this.handleError(error, `get job ${id}`);
    }
  }

  async getActiveJobs(): Promise<Job[]> {
    return this.getJobs({ status: "open" });
  }

  /****************************************************
   * Screening Operations
   ****************************************************/

  async submitScreeningResults(
    candidateId: string,
    results: ScreeningResults
  ): Promise<void> {
    try {
      // Add note with screening results
      const note = this.formatScreeningResultsNote(results);
      await this.addCandidateNote(candidateId, note, "private");

      // Update custom fields
      await this.updateCustomFields(candidateId, {
        ai_screening_completed: true,
        ai_engagement_score: results.engagementScore,
        ai_recommendation: results.recommendation,
        ai_screening_date: results.completedAt.toISOString(),
      });

      // Add tags based on recommendation
      if (results.recommendation === "strong_yes" || results.recommendation === "yes") {
        await this.addCandidateTags(candidateId, ["AI_Approved"]);
      }
    } catch (error) {
      return this.handleError(error, `submit screening results for ${candidateId}`);
    }
  }

  private formatScreeningResultsNote(results: ScreeningResults): string {
    return `
🤖 **AI Phone Screening Completed**

**Date:** ${results.completedAt.toISOString()}
**Engagement Score:** ${results.engagementScore}/10
**Recommendation:** ${results.recommendation?.toUpperCase().replace(/_/g, " ")}

**Summary:**
${results.summary}

**Key Strengths:**
${results.strengths?.map((s) => `✓ ${s}`).join("\n") || "None noted"}

**Red Flags:**
${results.redFlags?.map((f) => `⚠️ ${f}`).join("\n") || "None"}

**Recording:** ${results.recordingUrl || "Not available"}

[Full transcript available in candidate activity feed]
    `.trim();
  }

  async getScreeningQuestions(jobId: string): Promise<any[]> {
    try {
      const job = await this.makeRequest<any>(`/jobs/${jobId}/questions`);
      return job || [];
    } catch (error) {
      return this.handleError(error, `get screening questions for job ${jobId}`);
    }
  }

  /****************************************************
   * Interview Operations
   ****************************************************/

  async createInterview(interview: Interview): Promise<string> {
    try {
      const application = await this.getCurrentApplication(interview.candidateId);

      const response = await this.makeRequest<{ id: number }>(
        `/applications/${application.id}/scheduled_interviews`,
        {
          method: "POST",
          body: JSON.stringify({
            interview: {
              name: interview.title || `${interview.type} Interview`,
              start_time: interview.scheduledAt?.toISOString(),
              end_time: interview.scheduledAt
                ? new Date(
                    interview.scheduledAt.getTime() + interview.duration * 60000
                  ).toISOString()
                : undefined,
              location: interview.location || interview.meetingLink,
              interviewers: interview.participants
                .filter((p) => p.role !== "candidate")
                .map((p) => ({ email: p.email })),
            },
          }),
        }
      );

      return response.id.toString();
    } catch (error) {
      return this.handleError(error, "create interview");
    }
  }

  async updateInterview(id: string, data: InterviewUpdate): Promise<void> {
    try {
      const updateData: any = {};
      if (data.scheduledAt) updateData.start_time = data.scheduledAt.toISOString();
      if (data.location) updateData.location = data.location;
      if (data.meetingLink) updateData.location = data.meetingLink;

      await this.makeRequest(`/scheduled_interviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ interview: updateData }),
      });
    } catch (error) {
      return this.handleError(error, `update interview ${id}`);
    }
  }

  async cancelInterview(id: string, reason?: string): Promise<void> {
    try {
      await this.makeRequest(`/scheduled_interviews/${id}`, {
        method: "DELETE",
      });

      // Add note about cancellation
      if (reason) {
        // Would need to get candidate ID from interview
        // await this.addCandidateNote(candidateId, `Interview cancelled: ${reason}`);
      }
    } catch (error) {
      return this.handleError(error, `cancel interview ${id}`);
    }
  }

  async submitInterviewFeedback(
    interviewId: string,
    feedback: {
      rating: number;
      recommendation: string;
      notes: string;
      interviewerId: string;
    }
  ): Promise<void> {
    try {
      // Greenhouse uses scorecards for feedback
      await this.makeRequest(`/scorecards`, {
        method: "POST",
        body: JSON.stringify({
          scheduled_interview_id: interviewId,
          ratings: [
            {
              question_id: null,
              value: feedback.rating,
            },
          ],
          overall_recommendation: feedback.recommendation,
          notes: feedback.notes,
          submitted_by: feedback.interviewerId,
        }),
      });
    } catch (error) {
      return this.handleError(error, `submit interview feedback for ${interviewId}`);
    }
  }

  /****************************************************
   * Webhook Operations
   ****************************************************/

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) return true; // Skip verification if no secret

    const hmac = crypto.createHmac("sha256", this.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  parseWebhookEvent(payload: any): ATSWebhookEvent {
    return {
      type: this.mapGreenhouseEventType(payload.action),
      timestamp: new Date(payload.occurred_at),
      data: payload.payload,
    };
  }

  private mapGreenhouseEventType(action: string): ATSWebhookEvent["type"] {
    const mapping: Record<string, ATSWebhookEvent["type"]> = {
      candidate_created: "candidate.created",
      candidate_updated: "candidate.updated",
      candidate_stage_change: "candidate.status_changed",
      job_created: "job.created",
      job_updated: "job.updated",
      interview_scheduled: "interview.scheduled",
      interview_deleted: "interview.cancelled",
    };

    return mapping[action] || "candidate.updated";
  }

  /****************************************************
   * Attachments
   ****************************************************/

  async uploadAttachment(
    candidateId: string,
    file: Buffer,
    filename: string,
    type: "resume" | "cover_letter" | "transcript" | "other"
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file]), filename);
      formData.append("type", type);

      const response = await this.makeRequest<{ id: number; url: string }>(
        `/candidates/${candidateId}/attachments`,
        {
          method: "POST",
          body: formData as any,
          headers: {
            "Content-Type": "multipart/form-data",
          } as any,
        }
      );

      return response.url;
    } catch (error) {
      return this.handleError(error, `upload attachment for candidate ${candidateId}`);
    }
  }

  /****************************************************
   * Search & Query
   ****************************************************/

  async searchCandidates(query: string): Promise<Candidate[]> {
    try {
      // Greenhouse doesn't have a direct search endpoint
      // We'll filter by name or email
      const allCandidates = await this.getCandidates({ limit: 500 });
      const lowerQuery = query.toLowerCase();

      return allCandidates.filter(
        (c) =>
          c.firstName.toLowerCase().includes(lowerQuery) ||
          c.lastName.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      return this.handleError(error, "search candidates");
    }
  }

  async getCandidatesNeedingScreening(jobId?: string): Promise<Candidate[]> {
    try {
      const options: CandidateFilterOptions = { limit: 500 };
      if (jobId) options.jobId = jobId;

      const candidates = await this.getCandidates(options);

      return candidates.filter(
        (c) =>
          !c.screening ||
          c.screening.status === "pending" ||
          c.screening.status === "failed"
      );
    } catch (error) {
      return this.handleError(error, "get candidates needing screening");
    }
  }

  async getCandidatesAwaitingScheduling(jobId?: string): Promise<Candidate[]> {
    try {
      const options: CandidateFilterOptions = { limit: 500 };
      if (jobId) options.jobId = jobId;

      const candidates = await this.getCandidates(options);

      return candidates.filter(
        (c) =>
          c.screening?.status === "completed" &&
          c.screening.recommendation !== "no" &&
          c.screening.recommendation !== "strong_no"
      );
    } catch (error) {
      return this.handleError(error, "get candidates awaiting scheduling");
    }
  }

  /****************************************************
   * Transformation Helpers
   ****************************************************/

  private transformCandidate(ghc: GreenhouseCandidate): Candidate {
    const primaryApp = ghc.applications[0];
    const primaryJob = primaryApp?.jobs[0];
    const primaryPhone = ghc.phone_numbers.find((p) => p.type === "mobile") || ghc.phone_numbers[0];
    const primaryEmail = ghc.email_addresses.find((e) => e.type === "personal") || ghc.email_addresses[0];

    return {
      id: crypto.randomUUID(),
      atsId: ghc.id.toString(),
      firstName: ghc.first_name,
      lastName: ghc.last_name,
      email: primaryEmail?.value || "",
      phone: primaryPhone?.value || "",
      preferredLanguage: "en-US",
      timezone: "America/New_York",
      tcpaConsent: {
        granted: false, // Must be collected separately
      },
      dncStatus: "unknown",
      optedOut: false,
      appliedFor: {
        jobId: primaryJob?.id.toString() || "",
        jobTitle: primaryJob?.name || "",
        requisitionNumber: "",
        appliedAt: new Date(primaryApp?.applied_at || ghc.created_at),
      },
      createdAt: new Date(ghc.created_at),
      updatedAt: new Date(ghc.updated_at),
      currentCompany: ghc.company || undefined,
      currentTitle: ghc.title || undefined,
    };
  }

  private transformJob(ghj: GreenhouseJob): Job {
    const primaryDept = ghj.departments[0];
    const hiringManager = ghj.hiring_team.hiring_managers[0];
    const recruiter = ghj.hiring_team.recruiters[0];

    return {
      id: crypto.randomUUID(),
      atsId: ghj.id.toString(),
      title: ghj.name,
      requisitionNumber: ghj.requisition_id,
      department: primaryDept?.name || "Unknown",
      description: ghj.notes || "",
      location: {
        type: "remote",
        country: "US",
      },
      requiredSkills: [],
      minimumYearsExperience: 0,
      screeningQuestions: [],
      autoScreeningEnabled: true,
      hiringTeam: [
        ...(hiringManager
          ? [
              {
                id: hiringManager.id.toString(),
                name: hiringManager.name,
                email: "", // Not provided by Greenhouse
                role: "hiring_manager" as const,
                timezone: "America/New_York",
              },
            ]
          : []),
        ...(recruiter
          ? [
              {
                id: recruiter.id.toString(),
                name: recruiter.name,
                email: "",
                role: "recruiter" as const,
                timezone: "America/New_York",
              },
            ]
          : []),
      ],
      primaryRecruiter: recruiter?.id.toString() || "",
      status: this.mapJobStatus(ghj.status),
      openedAt: ghj.opened_at ? new Date(ghj.opened_at) : undefined,
      numberOfOpenings: 1,
      supportedLanguages: ["en-US"],
      createdAt: new Date(ghj.created_at),
      updatedAt: new Date(ghj.created_at),
      createdBy: "",
    };
  }

  private mapJobStatus(
    ghStatus: string
  ): "draft" | "open" | "on_hold" | "filled" | "closed" {
    const mapping: Record<string, any> = {
      open: "open",
      closed: "closed",
      draft: "draft",
    };
    return mapping[ghStatus] || "draft";
  }
}
