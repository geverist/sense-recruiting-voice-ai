/**
 * ATS Integration Factory
 * Creates the appropriate ATS adapter based on configuration
 */

import { GreenhouseAdapter } from "./greenhouse.js";
import type { ATSAdapter } from "./adapter.js";

export * from "./adapter.js";
export * from "./greenhouse.js";

/**
 * Create an ATS adapter instance based on environment configuration
 */
export function createATSAdapter(
  provider: string = process.env.ATS_PROVIDER || "greenhouse",
  apiKey: string = process.env.ATS_API_KEY || "",
  baseUrl?: string,
  webhookSecret?: string
): ATSAdapter {
  switch (provider.toLowerCase()) {
    case "greenhouse":
      return new GreenhouseAdapter(
        apiKey,
        baseUrl || process.env.ATS_BASE_URL,
        webhookSecret || process.env.ATS_WEBHOOK_SECRET
      );

    case "lever":
      // Future implementation
      throw new Error("Lever adapter not yet implemented");

    case "workday":
      // Future implementation
      throw new Error("Workday adapter not yet implemented");

    default:
      throw new Error(`Unknown ATS provider: ${provider}`);
  }
}
