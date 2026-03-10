#!/bin/bash

# Example usage script for Auto-Generator Service
# This demonstrates the full workflow

BASE_URL="http://localhost:3003"

echo "=========================================="
echo "Auto-Generator Service - Example Usage"
echo "=========================================="
echo ""

# 1. Check health
echo "1. Checking service health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""
echo ""

# 2. Upload transcript (text)
echo "2. Uploading sample transcript..."
TRANSCRIPT='Agent: Hello, thank you for calling ABC Company. My name is Sarah, how can I help you today?
Customer: Hi, I need to schedule a service appointment.
Agent: I would be happy to help with that. Can I get your name please?
Customer: It is John Smith.
Agent: Thank you, John. And what is your phone number?
Customer: It is 555-0123.
Agent: Perfect. What day works best for you?
Customer: How about next Tuesday?
Agent: Tuesday works great. What time would you prefer?
Customer: Morning, around 10 AM?
Agent: 10 AM on Tuesday it is. Let me confirm: John Smith, 555-0123, Tuesday at 10 AM. Is that correct?
Customer: Yes, that is right.
Agent: Perfect! You are all set. We will see you on Tuesday at 10 AM. Have a great day!
Customer: Thank you, you too!'

TRANSCRIPT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/upload/transcript" \
  -H "Content-Type: application/json" \
  -d "{
    \"transcript\": \"$TRANSCRIPT\",
    \"description\": \"Sample appointment scheduling call\",
    \"source\": \"example\"
  }")

echo "$TRANSCRIPT_RESPONSE" | jq '.'
TRANSCRIPT_ID=$(echo "$TRANSCRIPT_RESPONSE" | jq -r '.transcriptId')
echo ""
echo "Transcript ID: $TRANSCRIPT_ID"
echo ""
echo ""

# 3. Run the full wizard
echo "3. Running generation wizard (this may take 30-60 seconds)..."
WIZARD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/generate/wizard/$TRANSCRIPT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Appointment Scheduling Bot",
    "optimize": true
  }')

echo "$WIZARD_RESPONSE" | jq '.'
echo ""
echo ""

# 4. Save results to files
echo "4. Saving results to files..."
echo "$WIZARD_RESPONSE" | jq -r '.data.pattern' > pattern.json
echo "$WIZARD_RESPONSE" | jq -r '.data.flow' > flow.json
echo "$WIZARD_RESPONSE" | jq -r '.data.systemPrompt' > system-prompt.json
echo "$WIZARD_RESPONSE" | jq -r '.data.formattedPrompt' > formatted-prompt.txt
echo "$WIZARD_RESPONSE" | jq -r '.data.validationRules' > validation-rules.json
echo ""
echo "Results saved to:"
echo "  - pattern.json"
echo "  - flow.json"
echo "  - system-prompt.json"
echo "  - formatted-prompt.txt"
echo "  - validation-rules.json"
echo ""
echo ""

# 5. Get history
echo "5. Getting generation history..."
curl -s "$BASE_URL/api/generate/history/$TRANSCRIPT_ID" | jq '.'
echo ""
echo ""

# 6. List all transcripts
echo "6. Listing all transcripts..."
curl -s "$BASE_URL/api/upload/transcripts" | jq '.'
echo ""
echo ""

echo "=========================================="
echo "Example workflow complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review the generated files"
echo "  2. Test the generated flow in your bot platform"
echo "  3. Upload actual call recordings for better results"
echo "  4. Use /api/generate/improvements to optimize over time"
echo ""
