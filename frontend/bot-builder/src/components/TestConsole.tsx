import React, { useState, useEffect, useRef } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { createTestSession, sendTestMessage, endTestSession, TestSession } from '@/services/api';
import { Play, Send, StopCircle, Loader, MessageCircle, Bot, User } from 'lucide-react';
import { format } from 'date-fns';

export const TestConsole: React.FC = () => {
  const { botConfig, nodes, edges, systemPrompt, requiredFields } = useFlowState();
  const [session, setSession] = useState<TestSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartSession = async () => {
    if (!botConfig?.id) {
      alert('Please save the bot configuration first');
      return;
    }

    setIsLoading(true);
    try {
      const newSession = await createTestSession(botConfig.id);
      setSession(newSession);
    } catch (error) {
      console.error('Failed to start test session:', error);
      alert('Failed to start test session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!session?.sessionId) return;

    try {
      await endTestSession(session.sessionId);
      setSession(null);
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !session?.sessionId || isSending) return;

    setIsSending(true);
    const userMessage = message.trim();
    setMessage('');

    try {
      const updatedSession = await sendTestMessage(session.sessionId, userMessage);
      setSession(updatedSession);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const hasUnsavedChanges = () => {
    // Check if there are unsaved changes to the flow
    return nodes.length > 0 && !botConfig?.id;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Test Console</h3>
              <p className="text-sm text-gray-500">
                Test your bot with the current draft configuration
              </p>
            </div>
          </div>
          <div>
            {!session ? (
              <button
                onClick={handleStartSession}
                disabled={isLoading || hasUnsavedChanges()}
                className="btn btn-success flex items-center gap-2"
                title={hasUnsavedChanges() ? 'Please save your changes first' : 'Start test session'}
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Test
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                className="btn btn-danger flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4" />
                End Test
              </button>
            )}
          </div>
        </div>

        {session && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              Test session active - Session ID: <code className="font-mono">{session.sessionId}</code>
            </p>
          </div>
        )}

        {hasUnsavedChanges() && !session && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Please save your bot configuration as a draft before testing.
            </p>
          </div>
        )}
      </div>

      {!session ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Ready to test your bot?
          </h4>
          <p className="text-gray-600 mb-6 max-w-md">
            Start a test session to interact with your bot using the current flow,
            system prompt, and required fields configuration.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg">
            <h5 className="font-medium text-blue-900 mb-2">Test Configuration:</h5>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Flow Nodes: {nodes.length}</li>
              <li>• Flow Edges: {edges.length}</li>
              <li>• Required Fields: {requiredFields.length}</li>
              <li>• System Prompt: {systemPrompt ? 'Configured' : 'Not set'}</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {session.messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'
                    }`}
                  >
                    {format(new Date(msg.timestamp), 'HH:mm:ss')}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="input flex-1"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!message.trim() || isSending}
                className="btn btn-primary flex items-center gap-2 px-6"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
