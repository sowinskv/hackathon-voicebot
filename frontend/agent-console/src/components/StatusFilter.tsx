import React from 'react';

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  { value: 'all', label: 'All Sessions' },
  { value: 'active', label: 'Active' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'completed', label: 'Completed' },
  { value: 'resolved', label: 'Resolved' },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {statuses.map(status => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-4 py-2 text-sm font-light transition-all duration-300 ${
            value === status.value
              ? 'text-white border-b border-white'
              : 'text-white/40 hover:text-white/70 border-b border-transparent'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
