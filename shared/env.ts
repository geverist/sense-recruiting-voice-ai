import "dotenv-flow/config";

// Export all environment variables with validation
export const HOSTNAME = process.env.HOSTNAME || "";
export const PORT = process.env.PORT || "3333";
export const NODE_ENV = process.env.NODE_ENV || "development";

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
export const TWILIO_API_KEY = process.env.TWILIO_API_KEY || "";
export const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET || "";
export const DEFAULT_TWILIO_NUMBER = process.env.DEFAULT_TWILIO_NUMBER || "";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Optional ATS configuration
export const ATS_PROVIDER = process.env.ATS_PROVIDER || "greenhouse";
export const ATS_API_KEY = process.env.ATS_API_KEY || "";
export const ATS_BASE_URL = process.env.ATS_BASE_URL || "";
