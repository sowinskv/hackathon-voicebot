import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TranscriptMessage {
  speaker: 'agent' | 'client';
  text: string;
  timestamp: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptMessage[];
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg
          className="w-12 h-12 mx-auto mb-2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <p>No transcript available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transcript.map((message, index) => (
        <div
          key={index}
          className={`flex ${
            message.speaker === 'agent' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-3 ${
              message.speaker === 'agent'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold opacity-90">
                {message.speaker === 'agent' ? 'AI Agent' : 'Client'}
              </span>
              <span className="text-xs opacity-75">
                {formatDistanceToNow(new Date(message.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
