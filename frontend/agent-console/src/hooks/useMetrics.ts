import { useState, useEffect, useCallback } from 'react';
import { api, SessionMetrics } from '../services/api';
import { Timeframe } from '../components/TimeframeSelector';

/**
 * Hook for fetching and managing dashboard metrics
 *
 * @param timeframe - Timeframe for metrics (default: 'all')
 * @param refreshInterval - How often to refresh metrics in milliseconds (default: 10000ms)
 * @param initialFetch - Whether to fetch metrics on hook mount (default: true)
 * @returns Metrics state and control functions
 */
export function useMetrics(
  timeframe: Timeframe = 'all',
  refreshInterval = 10000,
  initialFetch = true
) {
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Function to fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      console.log(`Fetching metrics for timeframe: ${timeframe}...`);
      setError(null);
      setLoading(true);

      const data = await api.getMetrics(timeframe);
      setMetrics(data);
      setLastUpdated(new Date());
      console.log('Metrics updated:', data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      console.error('Metrics error:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Set up automatic refresh interval
  useEffect(() => {
    if (initialFetch) {
      fetchMetrics();
    }

    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, initialFetch, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh: fetchMetrics
  };
}