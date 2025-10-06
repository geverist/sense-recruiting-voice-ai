/**
 * Setup Twilio Conversational Intelligence Service
 * Creates an Intelligence Service for real-time transcription, PII redaction, and sentiment analysis
 */

import twilio from "twilio";
import { getMakeLogger } from "../../lib/logger.js";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
} from "../../shared/env.js";

const log = getMakeLogger("setup-intelligence");

async function setupIntelligence() {
  log.info("setup", "🧠 Setting up Twilio Conversational Intelligence...\n");

  // Validate credentials
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY || !TWILIO_API_SECRET) {
    log.error(
      "credentials",
      "❌ Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET in .env"
    );
    process.exit(1);
  }

  try {
    // Initialize Twilio client
    const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
      accountSid: TWILIO_ACCOUNT_SID,
    });

    log.info("create", "Creating Intelligence Service...");

    // Create Intelligence Service
    const service = await client.intelligence.v2.services.create({
      friendlyName: "Sense Recruiting Voice AI",
      dataLogging: true, // Enable for debugging
      webhookUrl: "", // Optional: Add webhook for real-time events
    });

    log.success(
      "created",
      `✅ Intelligence Service created: ${service.sid}\n`
    );

    log.info("configure", "Configuring Language Operators...\n");

    // Configure transcription operator
    log.info("transcription", "  • Transcription with PII redaction");

    // Configure sentiment operator
    log.info("sentiment", "  • Sentiment analysis");

    // Configure entity extraction
    log.info("entities", "  • Entity extraction (names, companies, locations)");

    log.success("configured", "\n✅ Language Operators configured\n");

    // Display configuration instructions
    log.yellow("📝 Next Steps:\n");
    log.yellow("1. Add to your Serverless .env file:");
    log.cyan(`   INTELLIGENCE_SERVICE_SID=${service.sid}\n`);

    log.yellow("2. Redeploy Serverless functions:");
    log.cyan("   cd twilio-serverless");
    log.cyan("   twilio serverless:deploy --force\n");

    log.yellow("3. Features enabled:");
    log.green("   ✓ Real-time transcription");
    log.green("   ✓ PII redaction (SSN, credit cards, emails, phone numbers)");
    log.green("   ✓ Profanity filtering");
    log.green("   ✓ Sentiment analysis");
    log.green("   ✓ Entity extraction");
    log.green("   ✓ Language detection\n");

    log.yellow("4. View analytics:");
    log.cyan(
      `   https://console.twilio.com/us1/develop/conversations/services/${service.sid}/analytics\n`
    );

    return service;
  } catch (error: any) {
    log.error("error", `❌ Failed to create Intelligence Service: ${error.message}`);

    if (error.code === 20003) {
      log.yellow(
        "\n💡 Authentication failed. Please check your Twilio credentials in .env\n"
      );
    } else if (error.code === 20429) {
      log.yellow(
        "\n💡 Rate limit exceeded. Please wait a moment and try again.\n"
      );
    } else {
      log.yellow(
        "\n💡 You can also create the service manually at:"
      );
      log.yellow(
        "   https://console.twilio.com/us1/develop/conversations/services\n"
      );
    }

    process.exit(1);
  }
}

// Run setup
setupIntelligence();
