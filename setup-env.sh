#!/bin/bash

# Quick .env setup script
echo "🔧 Setting up your .env file..."

# Create .env from template
cp .env.example .env

echo ""
echo "📝 Please fill in your credentials in .env:"
echo ""
echo "Required fields:"
echo "  - TWILIO_ACCOUNT_SID (your Account SID starting with AC...)"
echo "  - TWILIO_AUTH_TOKEN (your Auth Token)"
echo "  - DEFAULT_TWILIO_NUMBER (your Twilio phone number)"
echo "  - OPENAI_API_KEY (your OpenAI API key)"
echo "  - HOSTNAME (your ngrok domain)"
echo ""
echo "Opening .env in your default editor..."
echo ""

# Open in default editor
if command -v code &> /dev/null; then
    code .env
elif command -v nano &> /dev/null; then
    nano .env
elif command -v vim &> /dev/null; then
    vim .env
else
    echo "Please edit .env manually"
    echo "File location: $(pwd)/.env"
fi

echo ""
echo "✅ After saving, run: npm run test:local"
