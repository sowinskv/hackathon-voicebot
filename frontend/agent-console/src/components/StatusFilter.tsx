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
    <div className="flex gap-2">
      {statuses.map(status => (
        <button
          key={status.value}
          onClick={() => onChange(status.value)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            value === status.value
              ? 'bg-white/20 text-white border border-white/40'
              : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
}
