import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatModeProps {
  flowId: string;
  onEnd: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RequiredField {
  name: string;
  type: string;
  label: { pl?: string; en?: string };
  required: boolean;
}

export const ChatMode: React.FC<ChatModeProps> = ({ flowId, onEnd }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [extractingData, setExtractingData] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get initial greeting and flow config from bot
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      getInitialGreeting();
      fetchFlowConfig();
    }
  }, [initialized]);

  const fetchFlowConfig = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${flowId}`);
      if (response.ok) {
        const data = await response.json();
        const fields = data.data.required_fields || [];
        setRequiredFields(fields);
        console.log('[Chat] Required fields:', fields);
      }
    } catch (err) {
      console.error('[Chat] Error fetching flow config:', err);
    }
  };

  const getInitialGreeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/greeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flowId }),
      });

      if (response.ok) {
        const data = await response.json();

        // Add empty user message first, then greeting
        const emptyUserMessage: Message = {
          id: `user-${Date.now()}-init`,
          role: 'user',
          content: '', // Empty initial message
          timestamp: new Date(),
        };

        const greetingMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        };

        setMessages([emptyUserMessage, greetingMessage]);
      }
    } catch (err) {
      console.error('[Chat] Error getting greeting:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();

    // Check if user wants to manually end the call
    if (userInput.toLowerCase() === 'end' || userInput.toLowerCase() === 'koniec') {
      console.log('[Chat] User manually ended call');
      setIsLoading(true);
      await extractCollectedData(messages);
      setIsLoading(false);
      setCallEnded(true);
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      // Build conversation history for context
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call API Gateway to process the message
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          message: userMessage.content,
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error(errorData.message || 'Rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Check if bot wants to end the call
      console.log('[Chat] shouldEndCall:', data.shouldEndCall);
      if (data.shouldEndCall) {
        console.log('[Chat] Bot signaled to end call');
        // Wait 2 seconds to let user read the final message
        setTimeout(async () => {
          // Extract collected data from conversation using LLM
          await extractCollectedData([...messages, assistantMessage]);
          // Show summary screen
          setCallEnded(true);
        }, 2000);
      } else {
        // Re-focus input after bot responds
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    } catch (err: any) {
      console.error('[Chat] Error:', err);
      setError(err.message || 'Failed to send message');
      // Re-focus on error too
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCollectedData = async (conversationMessages: Message[]) => {
    console.log('[Chat] Extracting data from conversation...');
    setExtractingData(true);

    try {
      // Call backend to extract data using LLM
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/extract-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          messages: conversationMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const extractedData: Record<string, string> = {};

        // Convert extracted data, filtering out null values
        for (const [key, value] of Object.entries(result.data)) {
          if (value !== null && value !== 'null') {
            extractedData[key] = value as string;
          }
        }

        setCollectedData(extractedData);
        console.log('[Chat] Extracted data:', extractedData);
      } else {
        console.error('[Chat] Failed to extract data:', await response.text());
        // Fallback to empty data
        setCollectedData({});
      }
    } catch (err) {
      console.error('[Chat] Error extracting data:', err);
      // Fallback to empty data
      setCollectedData({});
    } finally {
      setExtractingData(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const submitSatisfaction = async () => {
    console.log('[Chat] Satisfaction rating:', satisfaction);

    try {
      // Calculate session duration (in seconds)
      const startTime = messages[0]?.timestamp?.getTime() || Date.now();
      const endTime = messages[messages.length - 1]?.timestamp?.getTime() || Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);

      // Save session data to database
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          language: 'en', // or detect from flow
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          collectedData,
          satisfactionScore: satisfaction,
          duration
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Chat] Session saved:', data.sessionId);
      } else {
        console.error('[Chat] Failed to save session:', await response.text());
      }
    } catch (err) {
      console.error('[Chat] Error saving session:', err);
    }

    // Always close, even if save fails
    onEnd();
  };

  // Show summary screen after call ends
  if (callEnded) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Call Summary</h2>

          {/* Collected Data */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Collected Information</h3>

            {extractingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Analyzing conversation and extracting data...</span>
              </div>
            ) : requiredFields.length > 0 ? (
              <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                <tbody>
                  {requiredFields.map((field) => {
                    const value = collectedData[field.name];
                    const label = field.label.en || field.label.pl || field.name;
                    const isRequired = field.required;

                    return (
                      <tr key={field.name} className="border-b border-gray-200">
                        <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 w-1/3">
                          {label}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className={`px-4 py-3 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {value || '(None)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No required fields configured</p>
            )}
          </div>

          {/* Satisfaction Survey */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              How satisfied are you with this call?
            </h3>
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSatisfaction(rating)}
                  className={`w-16 h-16 rounded-full text-2xl font-bold transition-all ${
                    satisfaction === rating
                      ? 'bg-blue-600 text-white scale-110 shadow-lg'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-8">
              <span>Very Dissatisfied</span>
              <span>Very Satisfied</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={submitSatisfaction}
            disabled={satisfaction === null}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {satisfaction === null ? 'Please rate your experience' : 'Submit & Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Chat Mode</h2>
            <p className="text-xs text-gray-500">Type "end" to finish call manually</p>
          </div>
        </div>

        <button
          onClick={onEnd}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition"
        >
          End Chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {messages.filter(msg => msg.content).length === 0 && !isLoading && (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-lg">Waiting for bot greeting...</p>
          </div>
        )}

        {messages.filter(msg => msg.content).map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-md'
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === 'user' ? 'You' : 'Bot'}
              </p>
              <p className="text-base whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 shadow-md rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Bot is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={callEnded ? "Call ended" : "Type your message..."}
            disabled={isLoading || callEnded}
            autoFocus
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || callEnded}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;
