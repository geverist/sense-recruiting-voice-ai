/**
 * Local Testing Script
 * Test the screening agent without making actual calls
 */

import "dotenv-flow/config";
import { getMakeLogger } from "./lib/logger.js";

const log = getMakeLogger("test");

// Simulate a screening conversation
async function testScreeningAgent() {
  log.info("test", "🧪 Starting local test...\n");

  // Test 1: Validate environment
  log.info("test", "📋 Step 1: Checking environment variables...");
  const requiredVars = [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_API_KEY",
    "TWILIO_API_SECRET",
    "OPENAI_API_KEY",
    "DEFAULT_TWILIO_NUMBER",
    "HOSTNAME",
  ];

  const missing: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    log.error("test", `❌ Missing environment variables: ${missing.join(", ")}`);
    log.yellow(
      "\n💡 Tip: Copy .env.example to .env and fill in your credentials\n"
    );
    process.exit(1);
  }

  log.success("test", "✅ All environment variables present\n");

  // Test 2: Validate Twilio credentials
  log.info("test", "📋 Step 2: Validating Twilio credentials...");
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(
      process.env.TWILIO_API_KEY,
      process.env.TWILIO_API_SECRET,
      {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
      }
    );

    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    log.success("test", "✅ Twilio credentials valid\n");
  } catch (error: any) {
    log.error("test", `❌ Twilio authentication failed: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Validate OpenAI API key
  log.info("test", "📋 Step 3: Validating OpenAI API key...");
  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    await openai.models.list();
    log.success("test", "✅ OpenAI API key valid\n");
  } catch (error: any) {
    log.error("test", `❌ OpenAI authentication failed: ${error.message}`);
    process.exit(1);
  }

  // Test 4: Validate data models
  log.info("test", "📋 Step 4: Testing data models...");
  try {
    const { CandidateSchema, canContactCandidate } = await import(
      "./shared/models/candidate.js"
    );

    const testCandidate = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      atsId: "GH-456",
      firstName: "Justin",
      lastName: "Smith",
      email: "justin@example.com",
      phone: "+15555551234",
      preferredLanguage: "en-US",
      timezone: "America/New_York",
      tcpaConsent: { granted: true },
      dncStatus: "safe" as const,
      optedOut: false,
      appliedFor: {
        jobId: "550e8400-e29b-41d4-a716-446655440001",
        jobTitle: "Senior Software Engineer",
        requisitionNumber: "REQ-001",
        appliedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validated = CandidateSchema.parse(testCandidate);
    const canCall = canContactCandidate(validated);

    if (canCall.allowed) {
      log.success("test", "✅ Candidate model validation passed");
      log.info("test", `   Candidate: ${validated.firstName} ${validated.lastName}`);
      log.info("test", `   Can contact: ${canCall.allowed}\n`);
    } else {
      log.error("test", `❌ Cannot contact candidate: ${canCall.reason}`);
    }
  } catch (error: any) {
    log.error("test", `❌ Data model test failed: ${error.message}`);
    process.exit(1);
  }

  // Test 5: Simulate screening conversation
  log.info("test", "📋 Step 5: Simulating screening conversation...\n");

  const conversation = [
    { speaker: "AI", text: "Hi Justin! This is Simon from Twilio. Thanks for your interest in our Senior Software Engineer role. Do you have a few minutes to chat?" },
    { speaker: "Candidate", text: "Yes, I do!" },
    { speaker: "AI", text: "Brilliant! Can you tell me about your experience with React and Node.js?" },
    { speaker: "Candidate", text: "I have 5 years of experience with React and 3 years with Node.js." },
    { speaker: "AI", text: "That's excellent! What salary range are you targeting?" },
    { speaker: "Candidate", text: "I'm looking for something in the $140-160k range." },
    { speaker: "AI", text: "Perfect! You sound like a great fit. I'll pass your details to our hiring team. Thanks so much!" },
  ];

  for (const turn of conversation) {
    if (turn.speaker === "AI") {
      log.info("🤖 AI", turn.text);
    } else {
      log.success("👤 Candidate", turn.text);
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
  }

  log.green("\n✨ Test completed successfully!\n");

  log.info("next-steps", "🚀 Next steps:");
  log.info("next-steps", "   1. Run: npm run dev");
  log.info("next-steps", "   2. In another terminal: npm run grok");
  log.info("next-steps", "   3. Make a test call to trigger screening\n");
}

// Run the test
testScreeningAgent().catch((error) => {
  log.error("test", "Test failed:", error);
  process.exit(1);
});
