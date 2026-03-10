import React, { useEffect, useState } from 'react';

interface MetricsWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  loading?: boolean;
  animate?: boolean;
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
};

export function MetricsWidget({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  loading = false,
  animate = true,
}: MetricsWidgetProps) {
  const [prevValue, setPrevValue] = useState<string | number>(value);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Detect when value changes and trigger animation
  useEffect(() => {
    if (value !== prevValue && animate) {
      setPrevValue(value);
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue, animate]);

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading && (
              <div className="w-3 h-3 rounded-full bg-primary-200 animate-pulse" />
            )}
          </div>
          <div className="mt-2 flex items-baseline">
            <p className={`text-3xl font-semibold ${isHighlighted
              ? 'text-primary-600 transition-colors duration-1000'
              : 'text-gray-900'}`}
            >
              {loading ? '...' : value}
            </p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
