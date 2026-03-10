import { GoogleGenerativeAI } from '@google/generative-ai';
import { query } from './db';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ImprovementSuggestion {
  category: 'flow' | 'prompt' | 'validation' | 'user-experience' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentBehavior: string;
  suggestedBehavior: string;
  estimatedImpact: string;
  implementationNotes: string;
}

export interface ConversationAnalytics {
  totalCalls: number;
  averageDuration: number;
  completionRate: number;
  commonDropOffPoints: string[];
  frequentErrors: Array<{ error: string; count: number }>;
  userFeedback: Array<{ sentiment: string; comment: string }>;
}

export async function analyzeConversationHistory(projectId: string): Promise<ConversationAnalytics> {
  try {
    // Get conversation statistics
    const statsQuery = `
      SELECT
        COUNT(*) as total_calls,
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as avg_duration,
        COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as completion_rate
      FROM conversations
      WHERE project_id = $1 AND ended_at IS NOT NULL
    `;
    const statsResult = await query(statsQuery, [projectId]);
    const stats = statsResult.rows[0];

    // Get common drop-off points (last message before conversation ended without completion)
    const dropOffQuery = `
      SELECT m.content, COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.project_id = $1
        AND c.status != 'completed'
        AND m.created_at = (
          SELECT MAX(created_at)
          FROM messages
          WHERE conversation_id = c.id
        )
      GROUP BY m.content
      ORDER BY count DESC
      LIMIT 5
    `;
    const dropOffResult = await query(dropOffQuery, [projectId]);
    const commonDropOffPoints = dropOffResult.rows.map(row => row.content);

    // Get frequent errors
    const errorsQuery = `
      SELECT error_type as error, COUNT(*) as count
      FROM conversation_errors
      WHERE project_id = $1
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10
    `;
    const errorsResult = await query(errorsQuery, [projectId]);
    const frequentErrors = errorsResult.rows;

    // Get user feedback (if available)
    const feedbackQuery = `
      SELECT sentiment, feedback as comment
      FROM conversation_feedback
      WHERE project_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const feedbackResult = await query(feedbackQuery, [projectId]);
    const userFeedback = feedbackResult.rows;

    return {
      totalCalls: parseInt(stats.total_calls) || 0,
      averageDuration: parseFloat(stats.avg_duration) || 0,
      completionRate: parseFloat(stats.completion_rate) || 0,
      commonDropOffPoints,
      frequentErrors,
      userFeedback,
    };
  } catch (error) {
    console.error('Error analyzing conversation history:', error);
    return {
      totalCalls: 0,
      averageDuration: 0,
      completionRate: 0,
      commonDropOffPoints: [],
      frequentErrors: [],
      userFeedback: [],
    };
  }
}

export async function generateImprovementSuggestions(
  analytics: ConversationAnalytics,
  currentFlow?: any,
  currentPrompt?: any
): Promise<ImprovementSuggestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `Analyze the following conversation analytics and suggest improvements for a voice bot system.

ANALYTICS:
${JSON.stringify(analytics, null, 2)}

CURRENT FLOW:
${currentFlow ? JSON.stringify(currentFlow, null, 2) : 'Not provided'}

CURRENT PROMPT:
${currentPrompt ? JSON.stringify(currentPrompt, null, 2) : 'Not provided'}

Based on the data, provide specific, actionable improvement suggestions. Consider:
1. Drop-off points - why users might be leaving
2. Frequent errors - what's causing issues
3. Completion rate - how to improve it
4. User feedback - what users are saying
5. Average duration - is it too long or too short?

Return ONLY valid JSON as an array of suggestions in this format:
[
  {
    "category": "flow|prompt|validation|user-experience|efficiency",
    "priority": "high|medium|low",
    "title": "Short title for the improvement",
    "description": "Detailed description of the issue",
    "currentBehavior": "What currently happens",
    "suggestedBehavior": "What should happen instead",
    "estimatedImpact": "Expected impact on metrics",
    "implementationNotes": "How to implement this change"
  }
]

Prioritize suggestions based on:
- High: Critical issues affecting many users or causing drop-offs
- Medium: Improvements that would enhance user experience
- Low: Nice-to-have optimizations

Return at least 5-10 suggestions, ONLY the JSON array.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const suggestions = JSON.parse(jsonMatch[0]);
    return suggestions;
  } catch (error) {
    console.error('Error generating improvement suggestions:', error);
    throw new Error('Failed to generate improvement suggestions');
  }
}

export async function compareFlowVersions(
  oldFlow: any,
  newFlow: any
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Compare these two flow versions and highlight the key differences and improvements.

OLD FLOW:
${JSON.stringify(oldFlow, null, 2)}

NEW FLOW:
${JSON.stringify(newFlow, null, 2)}

Provide a concise summary of:
1. What changed
2. Why these changes might be beneficial
3. Any potential concerns or considerations

Return as plain text, not JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error comparing flows:', error);
    return 'Unable to compare flows';
  }
}

export async function suggestNextSteps(
  projectId: string,
  analytics: ConversationAnalytics
): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Based on these analytics for a voice bot project, suggest 3-5 immediate next steps for improvement.

ANALYTICS:
${JSON.stringify(analytics, null, 2)}

Return as a JSON array of strings with actionable next steps, ordered by priority.
Example: ["Add error recovery for common drop-off points", "Improve validation messages", ...]`;

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
    console.error('Error suggesting next steps:', error);
    return [
      'Review conversation logs for common issues',
      'Test the bot with various input scenarios',
      'Gather user feedback',
    ];
  }
}
