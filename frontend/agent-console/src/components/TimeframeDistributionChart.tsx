import { useMemo, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
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
  const progress = useMotionValue(0);
  const previousDataRef = useRef<number[]>([]);
  const currentDataRef = useRef<number[]>([]);

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

  // Interpolate values to get a smooth dataset with fixed number of points
  const getInterpolatedValue = (data: [string, number][], position: number) => {
    if (data.length === 0) return 0;
    if (data.length === 1) return data[0][1];

    const scaledPos = position * (data.length - 1);
    const lowerIndex = Math.floor(scaledPos);
    const upperIndex = Math.min(lowerIndex + 1, data.length - 1);
    const fraction = scaledPos - lowerIndex;

    const lowerValue = data[lowerIndex][1];
    const upperValue = data[upperIndex][1];

    return lowerValue + (upperValue - lowerValue) * fraction;
  };

  // Convert sortedData to normalized array of values
  const normalizedValues = useMemo(() => {
    const numPoints = 100; // Increased from 50 for smoother curves
    return Array.from({ length: numPoints }, (_, i) => {
      const t = i / (numPoints - 1);
      return getInterpolatedValue(sortedData, t);
    });
  }, [sortedData]);

  // Update refs and trigger animation when data changes
  useEffect(() => {
    if (normalizedValues.length > 0) {
      // Store previous data for interpolation
      if (currentDataRef.current.length > 0) {
        previousDataRef.current = [...currentDataRef.current];
      } else {
        // First render - use current as previous (no animation)
        previousDataRef.current = [...normalizedValues];
      }

      currentDataRef.current = [...normalizedValues];

      // Animate from 0 to 1 to interpolate between previous and current
      progress.set(0);
      animate(progress, 1, {
        duration: 0.8,
        ease: [0.4, 0.0, 0.2, 1]
      });
    }
  }, [normalizedValues, progress]);

  // Generate smooth curve path using interpolated values
  const generateSmoothPath = (values: number[], maxVal: number) => {
    if (values.length === 0) return '';

    const width = 800;
    const height = 300;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = values.map((value, i) => {
      const t = i / (values.length - 1);
      return {
        x: padding + t * chartWidth,
        y: padding + chartHeight - (value / maxVal) * chartHeight,
      };
    });

    // Create smooth curve using cubic bezier with better control points
    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      // Calculate control points for smoother curves
      const tension = 0.3; // Controls curve smoothness
      const prev = i > 0 ? points[i - 1] : current;
      const after = i < points.length - 2 ? points[i + 2] : next;

      const cp1x = current.x + (next.x - prev.x) * tension;
      const cp1y = current.y + (next.y - prev.y) * tension;
      const cp2x = next.x - (after.x - current.x) * tension;
      const cp2y = next.y - (after.y - current.y) * tension;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }

    // Close the path to create filled area
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x} ${height - padding}`;
    path += ` L ${points[0].x} ${height - padding}`;
    path += ` Z`;

    return path;
  };

  // Use useTransform to interpolate between paths based on progress
  const animatedPath = useTransform(progress, (p) => {
    if (previousDataRef.current.length === 0 || currentDataRef.current.length === 0) {
      return generateSmoothPath(currentDataRef.current, maxValue);
    }

    // Interpolate between previous and current values
    const interpolatedValues = currentDataRef.current.map((currentVal, i) => {
      const previousVal = previousDataRef.current[i] || 0;
      return previousVal + (currentVal - previousVal) * p;
    });

    return generateSmoothPath(interpolatedValues, maxValue);
  });


  if (loading) {
    return (
      <div className="h-72 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If no data, display a message
  if (Object.keys(data).length === 0) {
    return (
      <div className="h-72 flex items-center justify-center text-white/60">
        {language === 'en' ? 'No distribution data available' : 'Brak danych do wykresu'}
      </div>
    );
  }

  return (
    <div className="relative pt-2">
      {/* Header with title and Y-axis label */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-sm font-light text-white/80 mb-1">
            {language === 'en' ? 'Call Distribution' : 'Rozkład połączeń'}
          </h3>
          <p className="text-xs text-white/40">
            {language === 'en' ? 'Number of sessions over time' : 'Liczba sesji w czasie'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/40">{language === 'en' ? 'Sessions' : 'Sesje'}</p>
          <p className="text-sm font-light text-white/60">{maxValue}</p>
        </div>
      </div>

      <div className="relative">
        {/* Y-axis scale */}
        <motion.div
          className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-white/40 pr-4"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            key={`max-${maxValue}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {maxValue}
          </motion.span>
          <motion.span
            key={`75-${maxValue}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {Math.round(maxValue * 0.75)}
          </motion.span>
          <motion.span
            key={`50-${maxValue}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {Math.round(maxValue * 0.5)}
          </motion.span>
          <motion.span
            key={`25-${maxValue}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {Math.round(maxValue * 0.25)}
          </motion.span>
          <span>0</span>
        </motion.div>

        <div className="pl-12">
          <svg
            viewBox="0 0 800 300"
            className="w-full h-72"
            preserveAspectRatio="none"
          >
            {/* Background grid - only in chart area */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1"
                />
              </pattern>

              {/* Gradient for wave fill - fades from top to bottom */}
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
              </linearGradient>
            </defs>
            <rect x="40" y="40" width="720" height="220" fill="url(#grid)" />

            {/* Wave area */}
            <motion.path
              d={animatedPath}
              fill="url(#waveGradient)"
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="2"
            />
          </svg>

          {/* X-axis Labels */}
          <div className="flex items-start justify-between px-10 mt-4">
            {sortedData.map(([unit], index) => {
              // Show labels only at start, middle, and end to avoid crowding
              if (
                index === 0 ||
                index === Math.floor(sortedData.length / 2) ||
                index === sortedData.length - 1
              ) {
                return (
                  <div key={`label-${unit}`} className="text-[10px] text-white/40 text-center">
                    {getLabelForTimeUnit(unit, timeframe)}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}