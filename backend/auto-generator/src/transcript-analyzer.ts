import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ConversationPattern {
  stages: ConversationStage[];
  dataCollected: DataField[];
  commonQuestions: string[];
  conversationStyle: ConversationStyle;
  domainKnowledge: DomainKnowledge;
}

export interface ConversationStage {
  name: string;
  description: string;
  typicalDuration: string;
  keyPhrases: string[];
  purpose: string;
}

export interface DataField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'email' | 'phone' | 'date' | 'choice';
  required: boolean;
  validationRules: string[];
  exampleValues: string[];
  howAsked: string;
}

export interface ConversationStyle {
  tone: string;
  formality: string;
  pace: string;
  empathy: string;
  characteristics: string[];
}

export interface DomainKnowledge {
  industry: string;
  specificTerms: string[];
  commonScenarios: string[];
  businessRules: string[];
}

export async function analyzeTranscript(transcript: string): Promise<ConversationPattern> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `Analyze the following conversation transcript and extract detailed patterns.

TRANSCRIPT:
${transcript}

Provide a comprehensive analysis in JSON format with the following structure:
{
  "stages": [
    {
      "name": "Stage name",
      "description": "What happens in this stage",
      "typicalDuration": "Estimated duration",
      "keyPhrases": ["Key phrases used"],
      "purpose": "The goal of this stage"
    }
  ],
  "dataCollected": [
    {
      "fieldName": "Field name",
      "fieldType": "text|number|email|phone|date|choice",
      "required": true/false,
      "validationRules": ["Validation rules identified"],
      "exampleValues": ["Example values from transcript"],
      "howAsked": "How the agent asks for this information"
    }
  ],
  "commonQuestions": ["Questions the agent asks"],
  "conversationStyle": {
    "tone": "Professional/Friendly/Casual/etc",
    "formality": "Formal/Informal/Semi-formal",
    "pace": "Fast/Moderate/Slow",
    "empathy": "High/Medium/Low",
    "characteristics": ["Key style characteristics"]
  },
  "domainKnowledge": {
    "industry": "Industry name",
    "specificTerms": ["Technical or industry terms used"],
    "commonScenarios": ["Common scenarios discussed"],
    "businessRules": ["Business rules or policies mentioned"]
  }
}

Focus on:
1. Identifying distinct conversation stages (greeting, information gathering, confirmation, etc.)
2. All data fields collected with their types and validation needs
3. The conversational style and tone used
4. Industry-specific knowledge and terminology
5. Business rules and decision logic

Return ONLY valid JSON, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    throw new Error('Failed to analyze transcript');
  }
}

export async function extractKeyInsights(transcript: string): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Extract 5-10 key insights from this conversation transcript that would be useful for building an automated bot.

TRANSCRIPT:
${transcript}

Return as a JSON array of strings, e.g.: ["insight 1", "insight 2", ...]`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error extracting insights:', error);
    return [];
  }
}
