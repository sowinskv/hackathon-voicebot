import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type Timeframe = 'all' | 'year' | 'month' | 'week' | 'day';

interface TimeframeSelectorProps {
  onChange: (timeframe: Timeframe) => void;
  defaultValue?: Timeframe;
}

export function TimeframeSelector({ onChange, defaultValue = 'all' }: TimeframeSelectorProps) {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultValue);

  // Set initial value on mount
  useEffect(() => {
    onChange(defaultValue);
  }, []);

  const handleChange = (value: Timeframe) => {
    setTimeframe(value);
    onChange(value);
    console.log('Timeframe changed:', value);
  };

  const timeframes: { value: Timeframe; label: string }[] = [
    { value: 'all', label: translate('timeframe.allTime') },
    { value: 'year', label: translate('timeframe.thisYear') },
    { value: 'month', label: translate('timeframe.thisMonth') },
    { value: 'week', label: translate('timeframe.thisWeek') },
    { value: 'day', label: translate('timeframe.thisDay') },
  ];

  return (
    <div className="flex items-center gap-2">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => handleChange(tf.value)}
          className={`px-4 py-2 text-sm font-light transition-all duration-300 ${
            timeframe === tf.value
              ? 'text-white border-b border-white'
              : 'text-white/40 hover:text-white/70 border-b border-transparent'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}