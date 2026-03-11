import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Timeframe } from './TimeframeSelector';

interface TimeframeDistributionChartProps {
  data: { [key: string]: number };
  timeframe: Timeframe;
  loading?: boolean;
}

export function TimeframeDistributionChart({
  data,
  timeframe,
  loading = false
}: TimeframeDistributionChartProps) {
  const { language } = useLanguage();

  // Helper function to get the appropriate label for each timeframe
  const getLabelForTimeUnit = (unit: string, timeframe: Timeframe) => {
    const unitNumber = parseInt(unit, 10);

    switch (timeframe) {
      case 'day':
        return `${unitNumber}:00`;
      case 'week': {
        const weekdays = language === 'en'
          ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
          : ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
        return weekdays[unitNumber];
      }
      case 'month':
        return `${unitNumber}`;
      case 'year': {
        const months = language === 'en'
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          : ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
        return months[unitNumber - 1];
      }
      default:
        return unit;
    }
  };

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...Object.values(data), 1);
  }, [data]);

  // Sort data by time unit
  const sortedData = useMemo(() => {
    return Object.entries(data).sort(([unitA], [unitB]) => {
      return parseInt(unitA, 10) - parseInt(unitB, 10);
    });
  }, [data]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no data, display a message
  if (Object.keys(data).length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-white/60">
        {language === 'en' ? 'No distribution data available' : 'Brak danych do wykresu'}
      </div>
    );
  }

  return (
    <div className="pt-4">
      <h3 className="text-sm font-medium text-white/70 mb-3">
        {language === 'en' ? 'Call Distribution' : 'Rozkład połączeń'}
      </h3>
      <div className="h-48 flex items-end gap-1">
        {sortedData.map(([unit, value]) => (
          <div key={unit} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-white/80 rounded-t"
              style={{
                height: `${Math.max(8, (value / maxValue) * 100)}%`,
              }}
            ></div>
            <div className="text-xs text-white/60 mt-1 w-full text-center truncate">
              {getLabelForTimeUnit(unit, timeframe)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}