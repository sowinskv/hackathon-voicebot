import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationMessage } from '../conversation/state-manager';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Generate conversational response using Gemini 2.5 Flash
 */
export async function generateResponse(
  userMessage: string,
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  context?: Record<string, any>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: buildSystemInstruction(systemPrompt, context),
    });

    // Build conversation history for Gemini
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(userMessage || 'Start the conversation');
    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate response');
  }
}

/**
 * Build enhanced system instruction with context
 */
function buildSystemInstruction(
  basePrompt: string,
  context?: Record<string, any>
): string {
  let instruction = basePrompt;

  if (context) {
    if (context.isGreeting) {
      instruction += '\n\nGenerate a warm, professional greeting introducing yourself and your purpose.';
    }

    if (context.nextSlot) {
      instruction += `\n\nNext information needed: ${context.nextSlot}. Ask for this information naturally in conversation.`;
    }

    if (context.collectedData && Object.keys(context.collectedData).length > 0) {
      instruction += `\n\nInformation already collected: ${JSON.stringify(context.collectedData)}. Don't ask for this again.`;
    }

    if (context.extractionMode) {
      instruction += '\n\nYou are in extraction mode. Return only a JSON object with extracted values.';
    }
  }

  // Add general conversation guidelines
  instruction += `

Guidelines:
- Be natural, conversational, and professional
- Keep responses concise (1-3 sentences)
- Show empathy and understanding
- Acknowledge information the user provides
- Ask one question at a time
- If the user seems confused, offer to clarify
- Never make up information or assumptions
- Stay focused on collecting the required information`;

  return instruction;
}

/**
 * Analyze user intent using Gemini
 */
export async function analyzeIntent(
  userMessage: string,
  availableIntents: string[]
): Promise<{
  intent: string;
  confidence: number;
  entities: Record<string, any>;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze the user's intent from this message: "${userMessage}"

Available intents: ${availableIntents.join(', ')}

Return a JSON object with:
- intent: the detected intent
- confidence: confidence score (0-1)
- entities: any extracted entities as key-value pairs

JSON:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
    };
  } catch (error) {
    console.error('Intent analysis error:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      entities: {},
    };
  }
}

/**
 * Summarize conversation for handoff to human consultant
 */
export async function summarizeConversation(
  conversationHistory: ConversationMessage[],
  collectedData: Record<string, any>
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const conversation = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `Summarize this conversation for a human consultant taking over:

Conversation:
${conversation}

Collected Information:
${JSON.stringify(collectedData, null, 2)}

Provide a concise summary covering:
1. What the customer wants
2. Information collected so far
3. Any concerns or special requests
4. Recommended next steps

Summary:`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Conversation summarization error:', error);
    return 'Unable to generate summary';
  }
}

/**
 * Detect if user wants to end conversation or escalate
 */
export async function detectConversationSignal(
  userMessage: string
): Promise<{
  type: 'continue' | 'end' | 'escalate' | 'repeat';
  confidence: number;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Analyze if the user wants to:
- continue: keep talking with the bot
- end: end the conversation
- escalate: talk to a human
- repeat: have something repeated or clarified

User message: "${userMessage}"

Return JSON with type and confidence (0-1):`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { type: 'continue', confidence: 1.0 };
  } catch (error) {
    console.error('Signal detection error:', error);
    return { type: 'continue', confidence: 1.0 };
  }
}
