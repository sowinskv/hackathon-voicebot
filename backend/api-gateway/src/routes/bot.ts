import { Router, Request, Response } from 'express';
import { AppError, asyncHandler } from '../middleware/error';

const router = Router();

// POST /api/bot/generate - Generate bot configuration from natural language description
router.post(
  '/generate',
  asyncHandler(async (req: Request, res: Response) => {
    const { description, language = 'en' } = req.body;

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new AppError('Description is required and must be a non-empty string', 400);
    }

    if (!['en', 'pl'].includes(language)) {
      throw new AppError('Language must be either "en" or "pl"', 400);
    }

    // Import Gemini API
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPromptTemplate = language === 'pl'
      ? `# Personality
Jesteś asystentką do zbierania informacji przez telefon. Jesteś empatyczna, rzeczowa i dbasz o szczegóły.
Staraj się zadawać jasne i krótkie pytania.

# Tone
Ton Twojej wypowiedzi jest empatyczny, ale rzeczowy. Pytania zadajesz w sposób zwięzły. Zawsze aktywnie słuchasz, parafrazując lub potwierdzając kluczowe informacje.
Starasz się nie zadawać zbyt wielu pytań na raz.

# Speech rules
* NIE UŻYWAJ CYFR, ZAPISUJ JE ZAWSZE SŁOWNIE
* Adres email zawsze zapisuj używając słów np. (jan.kowalski@wp.pl) zapisz jako jan kropka kowalski małpa wu pe kropka pe el
* Zamiast znaku "@" ZAWSZE ZAPISUJ "małpa"

# Rules
* ZAWSZE ZADAWAJ JEDNO PYTANIE NARAZ
* Staraj się żeby cała konwersacja byłą płynna, nie brzmiała robotycznie

{REQUIRED_FIELDS}

# Goal
{GOAL_DESCRIPTION}`
      : `# Personality
You are a helpful voice assistant designed to collect information from users in a conversational manner.
You are empathetic, professional, and detail-oriented.

# Tone
Keep responses concise and clear. Use natural, conversational language. Be patient and understanding.
Ask one question at a time when collecting multiple pieces of information.

# Rules
* ALWAYS ASK ONE QUESTION AT A TIME
* Keep the conversation flowing naturally
* Confirm important information before moving forward

{REQUIRED_FIELDS}

# Goal
{GOAL_DESCRIPTION}`;

    const prompt = `You are an expert AI bot designer. Based on the following user description, generate a complete bot configuration.

User Description:
"${description}"

Language: ${language}

Generate a JSON response with the following structure:
{
  "prompt": "Complete system prompt for the bot based on the template below",
  "fields": [
    {
      "name": "field_name",
      "type": "text|number|date|email|phone|policy_number",
      "label": "Display label",
      "required": true|false,
      "validation": {
        "pattern": "regex pattern (optional)",
        "min": number (optional, for text length or number value),
        "max": number (optional, for text length or number value),
        "minDate": "today|today-30d|YYYY-MM-DD (optional, for date fields)",
        "maxDate": "today|today+30d|YYYY-MM-DD (optional, for date fields)",
        "errorMessage": "Error message in ${language}"
      },
      "promptTemplate": "Question to ask user to collect this field"
    }
  ],
  "flow": {
    "nodes": [],
    "edges": [],
    "collectionSequence": [
      {
        "fieldName": "field_name",
        "order": 0
      }
    ]
  }
}

System Prompt Template to use:
${systemPromptTemplate}

Instructions:
1. Analyze the user description to identify:
   - What information needs to be collected
   - The bot's personality and tone
   - Any special validation requirements

2. Generate the system prompt by:
   - Replacing {GOAL_DESCRIPTION} with a detailed goal based on the user description
   - Replacing {REQUIRED_FIELDS} with a formatted list of fields you identified
   - Keeping all the template structure and rules

3. Create field definitions for each piece of information:
   - Use appropriate field types
   - Add validation rules where applicable
   - Write natural ${language} promptTemplates for collecting each field

4. Create a simple collection sequence ordering the fields logically

5. For the flow, keep nodes and edges empty arrays (visual flow not needed yet)

Return ONLY valid JSON, no markdown formatting or explanations.`;

    try {
      console.log('[BOT-GEN] Starting bot generation...');
      console.log('[BOT-GEN] Description:', description);
      console.log('[BOT-GEN] Language:', language);
      console.log('[BOT-GEN] Gemini API Key configured:', !!process.env.GEMINI_API_KEY);

      const result = await model.generateContent(prompt);
      console.log('[BOT-GEN] Gemini response received');

      const response = await result.response;
      let text = response.text();
      console.log('[BOT-GEN] Raw response length:', text.length);

      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const generated = JSON.parse(text);
      console.log('[BOT-GEN] JSON parsed successfully');
      console.log('[BOT-GEN] Fields generated:', generated.fields?.length || 0);

      // Validate the response structure
      if (!generated.prompt || !generated.fields || !generated.flow) {
        throw new Error('Invalid response structure from AI');
      }

      console.log('[BOT-GEN] ✅ Generation complete, sending response');
      res.json(generated);
    } catch (error: any) {
      console.error('[BOT-GEN] ❌ Generation error:', error);
      console.error('[BOT-GEN] Error stack:', error.stack);
      throw new AppError(
        'Failed to generate bot configuration: ' + error.message,
        500
      );
    }
  })
);

export default router;
