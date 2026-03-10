import React from 'react';
import Editor from '@monaco-editor/react';
import { useFlowState } from '@/hooks/useFlowState';
import { FileText, Save } from 'lucide-react';

export const PromptEditor: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useFlowState();

  const handleEditorChange = (value: string | undefined) => {
    setSystemPrompt(value || '');
  };

  const defaultPrompt = `You are a helpful voice assistant designed to collect information from users in a conversational manner.

Your responsibilities:
1. Greet users warmly and professionally
2. Collect required information through natural conversation
3. Validate user inputs and ask for clarification when needed
4. Confirm collected information before completing the conversation
5. Handle errors gracefully and provide helpful feedback

Guidelines:
- Keep responses concise and clear
- Use natural, conversational language
- Be patient and understanding
- Handle interruptions and corrections smoothly
- Maintain context throughout the conversation
- Use appropriate voice-friendly formatting

Required Fields:
{REQUIRED_FIELDS}

Conversation Flow:
{CONVERSATION_FLOW}

Remember to:
- Always confirm before ending the conversation
- Ask one question at a time when collecting multiple pieces of information
- Provide examples when users seem confused
- Escalate to a human agent when necessary`;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">System Prompt</h3>
            <p className="text-sm text-gray-500">
              Define the bot's behavior and personality
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={systemPrompt || defaultPrompt}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            wrappingIndent: 'indent',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-start gap-3 text-sm">
          <div className="text-blue-600 font-medium">Tips:</div>
          <div className="text-gray-600 space-y-1">
            <div>• Use {'{REQUIRED_FIELDS}'} to reference configured fields</div>
            <div>• Use {'{CONVERSATION_FLOW}'} to reference the visual flow</div>
            <div>• Keep instructions clear and specific for best results</div>
          </div>
        </div>
      </div>
    </div>
  );
};
