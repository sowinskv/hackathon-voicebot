import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export type Timeframe = 'all' | 'year' | 'month' | 'week' | 'day';

interface TimeframeSelectorProps {
  onChange: (timeframe: Timeframe) => void;
  defaultValue?: Timeframe;
}

export function TimeframeSelector({ onChange, defaultValue = 'all' }: TimeframeSelectorProps) {
  const { translate } = useLanguage();
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultValue);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Timeframe;
    setTimeframe(value);
    onChange(value);
  };

  return (
    <div className="flex items-center">
      <label htmlFor="timeframe-selector" className="mr-2 text-sm font-medium text-gray-700">
        {translate('timeframe.label')}:
      </label>
      <select
        id="timeframe-selector"
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
        value={timeframe}
        onChange={handleChange}
      >
        <option value="all">{translate('timeframe.allTime')}</option>
        <option value="year">{translate('timeframe.thisYear')}</option>
        <option value="month">{translate('timeframe.thisMonth')}</option>
        <option value="week">{translate('timeframe.thisWeek')}</option>
        <option value="day">{translate('timeframe.thisDay')}</option>
      </select>
    </div>
  );
}