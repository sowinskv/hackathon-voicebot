import express from 'express';
import pool from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Greeting endpoint - get initial bot message
router.post('/greeting', async (req, res) => {
  try {
    const { flowId } = req.body;

    if (!flowId) {
      return res.status(400).json({ error: 'flowId is required' });
    }

    // Get flow configuration
    const flowResult = await pool.query(
      'SELECT * FROM flows WHERE id = $1',
      [flowId]
    );

    if (flowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const flow = flowResult.rows[0];
    const systemPrompt = flow.system_prompt || 'You are a helpful AI assistant.';

    console.log(`[Chat Greeting] Flow: ${flow.name}`);

    // Call Gemini API for initial greeting
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    const result = await model.generateContent('Start the conversation with a brief greeting. Be specific and professional - do not use placeholders like [Your Name] or [Company Name]. Directly greet the customer and ask how you can help them with their insurance claim.');
    const response = result.response;
    const text = response.text();

    res.json({
      response: text,
      flowId,
    });
  } catch (error: any) {
    console.error('[Chat Greeting] Error:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Gemini API. Please wait a moment and try again.',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to get greeting',
      message: error.message || 'An error occurred',
      details: error.statusText || error.message
    });
  }
});

// Chat endpoint - text-based conversation
router.post('/', async (req, res) => {
  try {
    const { flowId, message, history } = req.body;

    if (!flowId || !message) {
      return res.status(400).json({ error: 'flowId and message are required' });
    }

    // Get flow configuration
    const flowResult = await pool.query(
      'SELECT * FROM flows WHERE id = $1',
      [flowId]
    );

    if (flowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const flow = flowResult.rows[0];
    const baseSystemPrompt = flow.system_prompt || 'You are a helpful AI assistant.';

    // Enhance system prompt with ending instructions
    const systemPrompt = `${baseSystemPrompt}

CRITICAL ENDING INSTRUCTION:
After you have:
1. Collected ALL required information (policy number, date, location, description, other party info)
2. Confirmed the information with the customer
3. Provided information about next steps

You MUST end the conversation by:
1. Summarizing what will happen next
2. Then saying EXACTLY one of these phrases as your FINAL sentence:
   - In Polish: "Dziękuję za rozmowę i życzę miłego dnia. Do widzenia!"
   - In English: "Thank you for calling and have a nice day. Goodbye!"

Do NOT continue the conversation after saying this goodbye phrase. This is the END of the conversation.`;

    console.log(`[Chat] Flow: ${flow.name}`);
    console.log(`[Chat] Message: ${message}`);
    console.log(`[Chat] History length: ${history ? history.length : 0}`);

    // Call Gemini API with conversation history
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }],
      },
    });

    // Use chat interface with history
    // Convert history for Gemini (exclude current message)
    const geminiHistory = history && history.length > 1
      ? history.slice(0, -1).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '(start)' }], // Empty messages become "(start)"
        }))
      : [];

    const chat = model.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();

    // Check if bot wants to end the conversation
    // Look for ending phrases or completion signals
    const lowerText = text.toLowerCase();

    // Multiple ways to detect ending:
    // 1. Explicit goodbye phrases
    const hasGoodbyePhrase =
      lowerText.includes('dziękuję za rozmowę') ||
      lowerText.includes('thank you for calling') ||
      lowerText.includes('życzę miłego dnia. do widzenia') ||
      lowerText.includes('have a nice day. goodbye') ||
      (lowerText.includes('dziękuj') && lowerText.includes('do widzenia')) ||
      (lowerText.includes('thank') && lowerText.includes('goodbye'));

    // 2. Check if ends with goodbye
    const endsWithGoodbye =
      lowerText.match(/do\s+widzenia[!.]*\s*$/i) !== null ||
      lowerText.match(/goodbye[!.]*\s*$/i) !== null;

    // 3. Check if key information seems collected (basic heuristic)
    const hasKeyInfo = history && history.length > 10; // At least 10 messages = good conversation

    const shouldEndCall = hasGoodbyePhrase || endsWithGoodbye || (hasKeyInfo && endsWithGoodbye);

    console.log(`[Chat] Bot response: "${text}"`);
    console.log(`[Chat] Has goodbye phrase: ${hasGoodbyePhrase}`);
    console.log(`[Chat] Ends with goodbye: ${endsWithGoodbye}`);
    console.log(`[Chat] History length: ${history ? history.length : 0}`);
    console.log(`[Chat] Should end call: ${shouldEndCall}`);

    res.json({
      response: text,
      flowId,
      shouldEndCall,
    });
  } catch (error: any) {
    console.error('[Chat API] Error:', error);

    // Handle rate limiting
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Gemini API. Please wait a moment and try again.',
        details: error.message
      });
    }

    res.status(500).json({
      error: 'Failed to process chat message',
      message: error.message || 'An error occurred',
      details: error.statusText || error.message
    });
  }
});

// Extract structured data from conversation
router.post('/extract-data', async (req, res) => {
  try {
    const { flowId, messages } = req.body;

    if (!flowId || !messages) {
      return res.status(400).json({ error: 'flowId and messages are required' });
    }

    // Get flow configuration
    const flowResult = await pool.query(
      'SELECT * FROM flows WHERE id = $1',
      [flowId]
    );

    if (flowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Flow not found' });
    }

    const flow = flowResult.rows[0];
    const requiredFields = flow.required_fields || [];

    console.log('[Chat Extract] Extracting data for', requiredFields.length, 'fields');

    // Build conversation text
    const conversationText = messages
      .filter((msg: any) => msg.content)
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create extraction prompt
    const fieldsDescription = requiredFields.map((field: any) => {
      const label = field.label.en || field.label.pl || field.name;
      return `- ${field.name}: ${label} (${field.type})${field.required ? ' [REQUIRED]' : ''}`;
    }).join('\n');

    const extractionPrompt = `You are a data extraction assistant. Analyze the following conversation and extract the requested information.

CONVERSATION:
${conversationText}

REQUIRED FIELDS TO EXTRACT:
${fieldsDescription}

INSTRUCTIONS:
- Extract the value for each field from the conversation
- If a field was not mentioned or cannot be determined, return null for that field
- Return ONLY valid JSON in this exact format:
{
  "field_name_1": "extracted value or null",
  "field_name_2": "extracted value or null",
  ...
}

Extract the data now:`;

    // Call Gemini for extraction
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    const result = await model.generateContent(extractionPrompt);
    const responseText = result.response.text();

    console.log('[Chat Extract] Raw response:', responseText);

    // Parse JSON response
    let extractedData: Record<string, string | null> = {};
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        extractedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('[Chat Extract] Failed to parse JSON:', parseError);
      return res.status(500).json({
        error: 'Failed to parse extracted data',
        rawResponse: responseText
      });
    }

    console.log('[Chat Extract] Extracted data:', extractedData);

    res.json({
      success: true,
      data: extractedData
    });

  } catch (error: any) {
    console.error('[Chat Extract] Error:', error);

    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests to Gemini API. Please wait a moment and try again.',
      });
    }

    res.status(500).json({
      error: 'Failed to extract data',
      message: error.message || 'An error occurred',
    });
  }
});

export default router;
