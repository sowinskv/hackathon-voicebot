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
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium">
            {translate('metrics.firstTryCompletion')}
          </div>
          <div className={`text-lg font-light ${loading ? 'text-white/40' : 'text-white'}`}>
            {loading ? '...' : `${(firstTryCompletionRate * 100).toFixed(1)}%`}
          </div>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{ width: loading ? '0%' : `${firstTryCompletionRate * 100}%` }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium">
            {translate('metrics.angryCustomers')}
          </div>
          <div className={`text-lg font-light ${loading ? 'text-white/40' : 'text-white'}`}>
            {loading ? '...' : `${(angryCustomersRate * 100).toFixed(1)}%`}
          </div>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{ width: loading ? '0%' : `${angryCustomersRate * 100}%` }}
          ></div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-widest text-white/40 font-medium">
            {translate('metrics.legalThreats')}
          </div>
          <div className={`text-lg font-light ${loading ? 'text-white/40' : 'text-white'}`}>
            {loading ? '...' : `${(legalThreatsRate * 100).toFixed(1)}%`}
          </div>
        </div>
        <div className="w-full bg-white/[0.08] rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500"
            style={{ width: loading ? '0%' : `${legalThreatsRate * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}