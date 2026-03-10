import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

interface ConversationData {
  messages: Message[];
  collectedData?: Record<string, any>;
  reason?: string;
}

export class SummaryGenerator {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  /**
   * Generate a conversation summary using Gemini AI
   */
  async generateSummary(conversationData: ConversationData): Promise<string> {
    try {
      const { messages, collectedData, reason } = conversationData;

      // Format the conversation
      const formattedConversation = messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      // Build the prompt
      const prompt = `
You are a customer service assistant. Analyze the following conversation between a user and a chatbot and create a concise summary for a human consultant who will take over.

CONVERSATION:
${formattedConversation}

${collectedData ? `\nCOLLECTED DATA:\n${JSON.stringify(collectedData, null, 2)}` : ''}

${reason ? `\nESCALATION REASON: ${reason}` : ''}

Please provide a summary that includes:
1. The main issue or request from the user
2. What information has been collected so far
3. The current state of the conversation
4. What the user is expecting or needs help with
5. Any important context or urgency factors

Keep the summary concise but informative (3-5 sentences).
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      console.log('Generated conversation summary successfully');
      return summary.trim();
    } catch (error) {
      console.error('Error generating summary with Gemini:', error);

      // Fallback to basic summary if AI fails
      return this.generateBasicSummary(conversationData);
    }
  }

  /**
   * Generate a basic summary without AI (fallback)
   */
  private generateBasicSummary(conversationData: ConversationData): string {
    const { messages, collectedData, reason } = conversationData;

    const messageCount = messages.length;
    const userMessages = messages.filter((m) => m.role === 'user').length;

    let summary = `Conversation with ${messageCount} messages (${userMessages} from user). `;

    if (reason) {
      summary += `Escalation reason: ${reason}. `;
    }

    if (collectedData && Object.keys(collectedData).length > 0) {
      summary += `Collected data: ${Object.keys(collectedData).join(', ')}. `;
    }

    // Get last user message
    const lastUserMessage = messages
      .filter((m) => m.role === 'user')
      .slice(-1)[0];

    if (lastUserMessage) {
      summary += `Last user message: "${lastUserMessage.content.substring(0, 100)}${
        lastUserMessage.content.length > 100 ? '...' : ''
      }"`;
    }

    return summary;
  }

  /**
   * Extract key information from conversation
   */
  async extractKeyInfo(messages: Message[]): Promise<Record<string, any>> {
    try {
      const formattedConversation = messages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      const prompt = `
Analyze this conversation and extract key information as JSON:

${formattedConversation}

Extract:
- customer_name: Name if mentioned
- contact_info: Email or phone if mentioned
- product_interest: What product/service they're asking about
- issue_type: Type of issue (technical, billing, general inquiry, etc.)
- urgency: Low, medium, or high based on conversation tone
- sentiment: Positive, neutral, or negative

Return ONLY valid JSON with these fields. Use null for unknown values.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {};
    } catch (error) {
      console.error('Error extracting key info:', error);
      return {};
    }
  }
}

export default new SummaryGenerator();
