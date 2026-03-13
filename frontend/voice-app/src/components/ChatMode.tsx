import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
  const [ratings, setRatings] = useState<Record<string, number>>({
    response_quality: 3,
    bot_helpfulness: 3,
    conversation_flow: 3,
    speed_efficiency: 3,
    overall_satisfaction: 3
  });
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [extractingData, setExtractingData] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Create session when component mounts
  useEffect(() => {
    const createSession = async () => {
      try {
        console.log('[Chat] Creating session...');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flow_id: flowId,
            language: 'en',
            client_metadata: { source: 'chat' }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.data.id);
          console.log('[Chat] Session created:', data.data.id);
        } else {
          console.error('[Chat] Failed to create session:', await response.text());
        }
      } catch (err) {
        console.error('[Chat] Error creating session:', err);
      }
    };

    createSession();
  }, [flowId]);

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
    console.log('[Chat] Satisfaction ratings:', ratings);

    try {
      if (!sessionId) {
        console.error('[Chat] No sessionId available');
        onEnd();
        return;
      }

      // Calculate session duration (in seconds)
      const startTime = messages[0]?.timestamp?.getTime() || Date.now();
      const endTime = messages[messages.length - 1]?.timestamp?.getTime() || Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);

      // Update session with completion data
      await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          satisfaction_score: ratings.overall_satisfaction, // Keep overall for backward compatibility
          satisfaction_details: ratings, // Store all dimensional ratings
          ended_at: new Date().toISOString(),
          client_metadata: {
            source: 'chat',
            collected_data: collectedData,
            satisfaction_details: ratings
          }
        }),
      });

      // Save transcripts
      for (const msg of messages) {
        if (!msg.content) continue;
        await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}/transcript`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            speaker: msg.role === 'user' ? 'client' : 'bot',
            text: msg.content,
            timestamp: msg.timestamp,
            language: 'en'
          }),
        });
      }

      // Save collected data fields
      for (const [fieldName, fieldValue] of Object.entries(collectedData)) {
        if (!fieldValue) continue;
        await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionId}/data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            field_name: fieldName,
            field_value: fieldValue,
            field_type: 'text'
          }),
        });
      }

      console.log('[Chat] Session completed:', sessionId);
    } catch (err) {
      console.error('[Chat] Error completing session:', err);
    }

    // Always close, even if save fails
    onEnd();
  };

  // Show summary screen after call ends
  if (callEnded) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8 py-8">
          {/* Collected Data Section */}
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="accent-dot"></div>
              <h2 className="text-2xl font-light text-white">Collected Information</h2>
            </div>

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
                      <tr key={field.name} className="border-b border-white/10 last:border-0">
                        <td className="px-4 py-3 bg-white/[0.03] font-light text-white/90 w-1/3">
                          {label}
                          {isRequired && <span className="text-red-400 ml-1">*</span>}
                        </td>
                        <td className={`px-4 py-3 ${value ? 'text-white/90 font-light' : 'text-white/40 italic font-light'}`}>
                          {value || '(None)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-white/50 text-center py-4 font-light">No required fields configured</p>
            )}
          </div>

          {/* Rating Section */}
          <div className="glass-card p-8 relative">
            <div className="flex items-center gap-3 mb-8 relative z-10">
              <div className="accent-dot"></div>
              <h2 className="text-2xl font-light text-white">Rate Your Experience</h2>
            </div>

            <div className="space-y-10 relative">
              {/* Background gradient blobs for each selected rating - positioned inside the sliders container */}
              <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
                {/* Response Quality glow */}
                <div
                  className="absolute w-80 h-80 rounded-full"
                  style={{
                    left: `calc(${((ratings.response_quality - 1) / 4) * 100}% - 160px)`,
                    top: '0px',
                    background: 'radial-gradient(circle, rgba(144, 202, 249, 0.5) 0%, rgba(255, 158, 128, 0.3) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, left'
                  }}
                />
                {/* Bot Helpfulness glow */}
                <div
                  className="absolute w-80 h-80 rounded-full"
                  style={{
                    left: `calc(${((ratings.bot_helpfulness - 1) / 4) * 100}% - 160px)`,
                    top: '100px',
                    background: 'radial-gradient(circle, rgba(255, 158, 128, 0.6) 0%, rgba(144, 202, 249, 0.4) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, left'
                  }}
                />
                {/* Conversation Flow glow */}
                <div
                  className="absolute w-80 h-80 rounded-full"
                  style={{
                    left: `calc(${((ratings.conversation_flow - 1) / 4) * 100}% - 160px)`,
                    top: '200px',
                    background: 'radial-gradient(circle, rgba(144, 202, 249, 0.5) 0%, rgba(255, 158, 128, 0.4) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, left'
                  }}
                />
                {/* Speed glow */}
                <div
                  className="absolute w-80 h-80 rounded-full"
                  style={{
                    left: `calc(${((ratings.speed_efficiency - 1) / 4) * 100}% - 160px)`,
                    top: '300px',
                    background: 'radial-gradient(circle, rgba(255, 158, 128, 0.5) 0%, rgba(144, 202, 249, 0.3) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, left'
                  }}
                />
                {/* Overall glow */}
                <div
                  className="absolute w-80 h-80 rounded-full"
                  style={{
                    left: `calc(${((ratings.overall_satisfaction - 1) / 4) * 100}% - 160px)`,
                    top: '400px',
                    background: 'radial-gradient(circle, rgba(144, 202, 249, 0.6) 0%, rgba(255, 158, 128, 0.4) 50%, transparent 70%)',
                    filter: 'blur(60px)',
                    transition: 'all 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform, left'
                  }}
                />
              </div>
              {/* Response Quality */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Poor Quality</span>
                  <span className="text-base text-white/90 font-light">Response Quality</span>
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Excellent</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={ratings.response_quality}
                    onChange={(e) => setRatings({...ratings, response_quality: parseInt(e.target.value)})}
                    className="w-full slider-minimal"
                  />
                  <div className="flex justify-between absolute top-0 w-full pointer-events-none" style={{ marginTop: '-6px' }}>
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div
                        key={pos}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          ratings.response_quality === pos
                            ? 'bg-white shadow-[0_0_30px_rgba(255,158,128,0.8),0_0_15px_rgba(255,255,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bot Helpfulness */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Unhelpful</span>
                  <span className="text-base text-white/90 font-light">Bot Helpfulness</span>
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Very Helpful</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={ratings.bot_helpfulness}
                    onChange={(e) => setRatings({...ratings, bot_helpfulness: parseInt(e.target.value)})}
                    className="w-full slider-minimal"
                  />
                  <div className="flex justify-between absolute top-0 w-full pointer-events-none" style={{ marginTop: '-6px' }}>
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div
                        key={pos}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          ratings.bot_helpfulness === pos
                            ? 'bg-white shadow-[0_0_30px_rgba(255,158,128,0.8),0_0_15px_rgba(255,255,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversation Flow */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Confusing</span>
                  <span className="text-base text-white/90 font-light">Conversation Flow</span>
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Natural</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={ratings.conversation_flow}
                    onChange={(e) => setRatings({...ratings, conversation_flow: parseInt(e.target.value)})}
                    className="w-full slider-minimal"
                  />
                  <div className="flex justify-between absolute top-0 w-full pointer-events-none" style={{ marginTop: '-6px' }}>
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div
                        key={pos}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          ratings.conversation_flow === pos
                            ? 'bg-white shadow-[0_0_30px_rgba(255,158,128,0.8),0_0_15px_rgba(255,255,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Speed/Efficiency */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Slow</span>
                  <span className="text-base text-white/90 font-light">Speed & Efficiency</span>
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Fast</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={ratings.speed_efficiency}
                    onChange={(e) => setRatings({...ratings, speed_efficiency: parseInt(e.target.value)})}
                    className="w-full slider-minimal"
                  />
                  <div className="flex justify-between absolute top-0 w-full pointer-events-none" style={{ marginTop: '-6px' }}>
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div
                        key={pos}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          ratings.speed_efficiency === pos
                            ? 'bg-white shadow-[0_0_30px_rgba(255,158,128,0.8),0_0_15px_rgba(255,255,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Overall Satisfaction */}
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Dissatisfied</span>
                  <span className="text-base text-white/90 font-light">Overall Satisfaction</span>
                  <span className="text-sm text-white/60 font-light uppercase tracking-wider">Very Satisfied</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={ratings.overall_satisfaction}
                    onChange={(e) => setRatings({...ratings, overall_satisfaction: parseInt(e.target.value)})}
                    className="w-full slider-minimal"
                  />
                  <div className="flex justify-between absolute top-0 w-full pointer-events-none" style={{ marginTop: '-6px' }}>
                    {[1, 2, 3, 4, 5].map((pos) => (
                      <div
                        key={pos}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          ratings.overall_satisfaction === pos
                            ? 'bg-white shadow-[0_0_30px_rgba(255,158,128,0.8),0_0_15px_rgba(255,255,255,0.5)]'
                            : 'bg-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitSatisfaction}
              className="w-full mt-10 px-6 py-4 rounded-2xl font-light text-base bg-white/[0.08] backdrop-blur-sm text-white border border-white/10 hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300 shadow-none"
            >
              Submit & Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent relative z-10 animate-blurIn">
      {/* Header */}
      <div className="p-4 flex items-center justify-between relative z-20">
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
          onClick={async () => {
            console.log('[Chat] User clicked End chat button');
            setIsLoading(true);
            await extractCollectedData(messages);
            setIsLoading(false);
            setCallEnded(true);
          }}
          className="text-white/70 hover:text-white transition-colors font-light text-base"
        >
          End chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
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
              <p className="text-base whitespace-pre-wrap" style={{ color: 'rgb(255, 255, 255)' }}>{message.content}</p>
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
      <div className="p-6 relative z-20">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={callEnded ? "Call ended" : "Type your message..."}
              disabled={isLoading || callEnded}
              autoFocus
              className="w-full bg-transparent border-0 border-b border-white/20 focus:border-white/40 outline-none pb-2 text-white placeholder:text-white/40 transition-colors"
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || callEnded}
            className="text-white/70 hover:text-white transition-colors font-light text-base disabled:opacity-30 disabled:cursor-not-allowed pb-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;
