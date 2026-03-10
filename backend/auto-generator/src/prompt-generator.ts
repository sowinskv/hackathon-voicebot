import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationPattern } from './transcript-analyzer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SystemPrompt {
  mainPrompt: string;
  personalityTraits: string[];
  conversationGuidelines: string[];
  responseTemplates: Record<string, string>;
  errorHandling: Record<string, string>;
  contextVariables: string[];
}

export async function generateSystemPrompt(
  pattern: ConversationPattern,
  projectName?: string
): Promise<SystemPrompt> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `Based on the following conversation pattern, generate a comprehensive system prompt for a voice bot.

CONVERSATION PATTERN:
${JSON.stringify(pattern, null, 2)}

PROJECT: ${projectName || 'Voice Bot'}

Create a detailed system prompt that includes:
1. Main system prompt with role, personality, and objectives
2. Specific personality traits to maintain
3. Conversation guidelines and best practices
4. Response templates for common scenarios
5. Error handling instructions
6. Context variables to track

Return ONLY valid JSON in this format:
{
  "mainPrompt": "You are a helpful voice assistant for [company/purpose]...",
  "personalityTraits": [
    "Professional yet friendly",
    "Patient and understanding",
    "Clear and concise"
  ],
  "conversationGuidelines": [
    "Always greet the caller warmly",
    "Speak in short, clear sentences",
    "Confirm information before proceeding"
  ],
  "responseTemplates": {
    "greeting": "Template for greeting",
    "dataCollection": "Template for asking questions",
    "confirmation": "Template for confirming information",
    "error": "Template for handling errors",
    "closing": "Template for ending conversation"
  },
  "errorHandling": {
    "noResponse": "What to do when user doesn't respond",
    "invalidInput": "How to handle invalid input",
    "technicalError": "How to handle technical errors",
    "escalation": "When and how to escalate to human"
  },
  "contextVariables": [
    "userName",
    "conversationStage",
    "dataCollected"
  ]
}

Guidelines:
1. Match the tone and style from the analyzed conversation
2. Include industry-specific knowledge and terminology
3. Provide clear instructions for handling edge cases
4. Make the prompt actionable and specific
5. Include examples where helpful
6. Ensure consistency with identified business rules

Return ONLY the JSON, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const systemPrompt = JSON.parse(jsonMatch[0]);
    return systemPrompt;
  } catch (error) {
    console.error('Error generating system prompt:', error);
    throw new Error('Failed to generate system prompt');
  }
}

export async function generateValidationRules(
  pattern: ConversationPattern
): Promise<Record<string, any>> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const rules: Record<string, any> = {};

  for (const field of pattern.dataCollected) {
    const prompt = `Generate validation rules for this data field:

Field: ${field.fieldName}
Type: ${field.fieldType}
Required: ${field.required}
Current Rules: ${JSON.stringify(field.validationRules)}
Examples: ${JSON.stringify(field.exampleValues)}

Return a JSON object with:
{
  "regex": "Regular expression for validation (if applicable)",
  "minLength": number,
  "maxLength": number,
  "allowedValues": ["array", "of", "values"] (for choice fields),
  "customValidation": "Description of custom validation logic",
  "errorMessage": "User-friendly error message"
}

Return ONLY the JSON object.`;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rules[field.fieldName] = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error(`Error generating validation rules for ${field.fieldName}:`, error);
    }
  }

  return rules;
}

export function formatPromptForDeployment(systemPrompt: SystemPrompt): string {
  let formatted = `${systemPrompt.mainPrompt}\n\n`;

  formatted += '## Personality Traits\n';
  systemPrompt.personalityTraits.forEach(trait => {
    formatted += `- ${trait}\n`;
  });

  formatted += '\n## Conversation Guidelines\n';
  systemPrompt.conversationGuidelines.forEach(guideline => {
    formatted += `- ${guideline}\n`;
  });

  formatted += '\n## Response Templates\n';
  Object.entries(systemPrompt.responseTemplates).forEach(([key, template]) => {
    formatted += `### ${key}\n${template}\n\n`;
  });

  formatted += '## Error Handling\n';
  Object.entries(systemPrompt.errorHandling).forEach(([key, instruction]) => {
    formatted += `### ${key}\n${instruction}\n\n`;
  });

  formatted += '## Context Variables to Track\n';
  systemPrompt.contextVariables.forEach(variable => {
    formatted += `- ${variable}\n`;
  });

  return formatted;
}
