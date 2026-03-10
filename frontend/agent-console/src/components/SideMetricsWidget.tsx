import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface SideMetricsWidgetProps {
  firstTryCompletionRate: number;
  angryCustomersRate: number;
  legalThreatsRate: number;
  loading?: boolean;
}

export function SideMetricsWidget({
  firstTryCompletionRate,
  angryCustomersRate,
  legalThreatsRate,
  loading = false
}: SideMetricsWidgetProps) {
  const { translate } = useLanguage();

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-700 mb-4">
        {translate('metrics.firstTryCompletion')}
      </h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-gray-600">
              {translate('metrics.firstTryCompletion')}
            </div>
            <div className={`text-sm font-semibold ${loading ? 'text-gray-400' : 'text-gray-800'}`}>
              {loading ? '...' : `${(firstTryCompletionRate * 100).toFixed(1)}%`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: loading ? '0%' : `${firstTryCompletionRate * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-gray-600">
              {translate('metrics.angryCustomers')}
            </div>
            <div className={`text-sm font-semibold ${loading ? 'text-gray-400' : 'text-gray-800'}`}>
              {loading ? '...' : `${(angryCustomersRate * 100).toFixed(1)}%`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full"
              style={{ width: loading ? '0%' : `${angryCustomersRate * 100}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-medium text-gray-600">
              {translate('metrics.legalThreats')}
            </div>
            <div className={`text-sm font-semibold ${loading ? 'text-gray-400' : 'text-gray-800'}`}>
              {loading ? '...' : `${(legalThreatsRate * 100).toFixed(1)}%`}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full"
              style={{ width: loading ? '0%' : `${legalThreatsRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}