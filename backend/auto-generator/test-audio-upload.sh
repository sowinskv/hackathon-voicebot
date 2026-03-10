#!/bin/bash

# Example script to upload and transcribe an audio file

BASE_URL="http://localhost:3003"

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-audio-file> [project-id] [description]"
  echo ""
  echo "Example:"
  echo "  $0 recording.wav 1 'Customer service call'"
  echo ""
  echo "Supported formats: WAV, MP3, M4A, WebM"
  exit 1
fi

AUDIO_FILE="$1"
PROJECT_ID="${2:-}"
DESCRIPTION="${3:-Audio recording}"

if [ ! -f "$AUDIO_FILE" ]; then
  echo "Error: File not found: $AUDIO_FILE"
  exit 1
fi

echo "=========================================="
echo "Uploading and transcribing audio file"
echo "=========================================="
echo ""
echo "File: $AUDIO_FILE"
echo "Project ID: ${PROJECT_ID:-none}"
echo "Description: $DESCRIPTION"
echo ""
echo "This may take 30-60 seconds depending on file size..."
echo ""

# Build the curl command
CURL_CMD="curl -X POST \"$BASE_URL/api/upload/transcribe\""
CURL_CMD="$CURL_CMD -F \"audio=@$AUDIO_FILE\""

if [ -n "$PROJECT_ID" ]; then
  CURL_CMD="$CURL_CMD -F \"projectId=$PROJECT_ID\""
fi

CURL_CMD="$CURL_CMD -F \"description=$DESCRIPTION\""

# Execute and save response
RESPONSE=$(eval "$CURL_CMD")
echo "$RESPONSE" | jq '.'

# Extract transcript ID
TRANSCRIPT_ID=$(echo "$RESPONSE" | jq -r '.transcriptId')

if [ "$TRANSCRIPT_ID" != "null" ] && [ -n "$TRANSCRIPT_ID" ]; then
  echo ""
  echo "=========================================="
  echo "Success! Transcript ID: $TRANSCRIPT_ID"
  echo "=========================================="
  echo ""
  echo "Next steps:"
  echo ""
  echo "1. Analyze the transcript:"
  echo "   curl -X POST $BASE_URL/api/generate/analyze/$TRANSCRIPT_ID"
  echo ""
  echo "2. Generate flow:"
  echo "   curl -X POST $BASE_URL/api/generate/flow/$TRANSCRIPT_ID -H 'Content-Type: application/json' -d '{\"projectName\":\"My Bot\",\"optimize\":true}'"
  echo ""
  echo "3. Generate prompt:"
  echo "   curl -X POST $BASE_URL/api/generate/prompt/$TRANSCRIPT_ID -H 'Content-Type: application/json' -d '{\"projectName\":\"My Bot\",\"includeValidation\":true}'"
  echo ""
  echo "4. Or run the full wizard:"
  echo "   curl -X POST $BASE_URL/api/generate/wizard/$TRANSCRIPT_ID -H 'Content-Type: application/json' -d '{\"projectName\":\"My Bot\",\"optimize\":true}'"
  echo ""
else
  echo ""
  echo "Error: Failed to upload and transcribe audio file"
  exit 1
fi
