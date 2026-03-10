import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationPattern } from './transcript-analyzer';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface FlowNode {
  id: string;
  type: 'start' | 'message' | 'input' | 'condition' | 'action' | 'end';
  label: string;
  data: any;
  position?: { x: number; y: number };
  next?: string[];
}

export interface FlowDiagram {
  nodes: FlowNode[];
  edges: Array<{ from: string; to: string; label?: string }>;
  metadata: {
    name: string;
    description: string;
    estimatedDuration: string;
    complexity: string;
  };
}

export async function generateFlowFromPattern(
  pattern: ConversationPattern,
  projectName?: string
): Promise<FlowDiagram> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `Based on the following conversation pattern analysis, generate a detailed flow diagram for a voice bot.

CONVERSATION PATTERN:
${JSON.stringify(pattern, null, 2)}

PROJECT NAME: ${projectName || 'Voice Bot Flow'}

Create a flow diagram with nodes and edges that represents the conversation flow. Use these node types:
- "start": Entry point
- "message": Bot speaks to user
- "input": Bot collects information from user
- "condition": Decision point based on user input or data
- "action": Perform an action (save data, API call, etc.)
- "end": Conversation end

Return ONLY valid JSON in this exact format:
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "start|message|input|condition|action|end",
      "label": "Node label",
      "data": {
        "text": "What the bot says (for message nodes)",
        "variable": "Variable name (for input nodes)",
        "validation": "Validation rules (for input nodes)",
        "condition": "Condition logic (for condition nodes)",
        "action": "Action description (for action nodes)"
      },
      "position": { "x": 100, "y": 100 },
      "next": ["next-node-id"]
    }
  ],
  "edges": [
    {
      "from": "node-id",
      "to": "next-node-id",
      "label": "Optional label for condition branches"
    }
  ],
  "metadata": {
    "name": "Flow name",
    "description": "Flow description",
    "estimatedDuration": "X minutes",
    "complexity": "Simple|Medium|Complex"
  }
}

Guidelines:
1. Create a logical flow following the conversation stages
2. Include input nodes for all data fields identified
3. Add validation nodes after inputs that require validation
4. Include condition nodes for branching logic
5. Position nodes in a readable layout (start at top, flow downward)
6. Add helpful labels and descriptions
7. Ensure all paths lead to an end node

Return ONLY the JSON, no additional text.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const flow = JSON.parse(jsonMatch[0]);
    return flow;
  } catch (error) {
    console.error('Error generating flow:', error);
    throw new Error('Failed to generate flow diagram');
  }
}

export async function optimizeFlow(flow: FlowDiagram): Promise<FlowDiagram> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Optimize the following flow diagram to make it more efficient and user-friendly.

CURRENT FLOW:
${JSON.stringify(flow, null, 2)}

Improvements to consider:
1. Combine redundant nodes
2. Reduce unnecessary steps
3. Add error handling paths
4. Improve node positioning for better visualization
5. Add helpful context to messages
6. Optimize validation logic

Return the optimized flow in the same JSON format.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return flow; // Return original if optimization fails
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error optimizing flow:', error);
    return flow; // Return original flow if optimization fails
  }
}

export function generateFlowVisualization(flow: FlowDiagram): string {
  // Generate a simple text-based visualization
  let viz = `Flow: ${flow.metadata.name}\n`;
  viz += `Description: ${flow.metadata.description}\n`;
  viz += `Estimated Duration: ${flow.metadata.estimatedDuration}\n`;
  viz += `Complexity: ${flow.metadata.complexity}\n\n`;
  viz += 'Nodes:\n';

  flow.nodes.forEach(node => {
    viz += `  [${node.type}] ${node.id}: ${node.label}\n`;
    if (node.next && node.next.length > 0) {
      viz += `    -> ${node.next.join(', ')}\n`;
    }
  });

  return viz;
}
