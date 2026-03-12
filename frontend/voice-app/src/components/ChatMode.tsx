import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, PhoneOff } from 'lucide-react';

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
      <div className="flex flex-col h-screen items-center justify-center p-6">
        <div className="max-w-2xl w-full glass-card p-8">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="accent-dot"></div>
            <h2 className="text-3xl font-bold text-white">Call Summary</h2>
          </div>

          {/* Collected Data */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Collected Information</h3>

            {extractingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-white/80 mr-3" />
                <span className="text-white/70">Analyzing conversation and extracting data...</span>
              </div>
            ) : requiredFields.length > 0 ? (
              <table className="w-full border border-white/10 rounded-lg overflow-hidden">
                <tbody>
                  {requiredFields.map((field) => {
                    const value = collectedData[field.name];
                    const label = field.label.en || field.label.pl || field.name;
                    const isRequired = field.required;

                    return (
                      <tr key={field.name} className="border-b border-white/10">
                        <td className="px-4 py-3 bg-white/[0.05] font-semibold text-white/90 w-1/3">
                          {label}
                          {isRequired && <span className="text-red-400 ml-1">*</span>}
                        </td>
                        <td className={`px-4 py-3 ${value ? 'text-white/90' : 'text-white/40 italic'}`}>
                          {value || '(None)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-white/50 text-center py-4">No required fields configured</p>
            )}
          </div>

          {/* Satisfaction Survey */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              How satisfied are you with this call?
            </h3>
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSatisfaction(rating)}
                  className={`w-16 h-16 rounded-full text-2xl font-bold transition-all ${
                    satisfaction === rating
                      ? 'bg-white/90 text-[#1a0510] scale-110 shadow-lg shadow-white/20'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-white/60 px-8">
              <span>Very Dissatisfied</span>
              <span>Very Satisfied</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={submitSatisfaction}
            disabled={satisfaction === null}
            className="w-full btn btn-success text-lg"
          >
            {satisfaction === null ? 'Please rate your experience' : 'Submit & Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-lg shadow-white/50" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-white animate-ping opacity-40" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Chat Mode</h2>
            <p className="text-xs text-white/60">Type "end" to finish call manually</p>
          </div>
        </div>

        <button
          onClick={onEnd}
          className="glass-button group relative w-14 h-14 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center border border-white/40"
          style={{
            background: 'rgba(255, 255, 255, 0.15)'
          }}
        >
          <PhoneOff size={22} className="text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="text-center py-8">
            <p className="font-semibold text-white mb-2">Something went wrong</p>
            <p className="text-white/70 text-sm">{error}</p>
          </div>
        )}

        {messages.filter(msg => msg.content).length === 0 && !isLoading && (
          <div className="text-center text-white/60 mt-20">
            <p className="text-lg">Waiting for bot greeting...</p>
          </div>
        )}

        {messages.filter(msg => msg.content).map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/[0.08] text-white border border-white/10'
              }`}
            >
              <p className="text-sm font-semibold mb-1 opacity-70">
                {message.role === 'user' ? 'You' : 'Bot'}
              </p>
              <p className="text-base whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-50">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/[0.08] text-white border border-white/10 rounded-xl px-4 py-3">
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
      <div className="p-4">
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
            className="input flex-1"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || callEnded}
            className="glass-button px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <Send size={20} className="text-white" />
            <span className="text-white">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;
