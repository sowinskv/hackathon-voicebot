import React, { useState } from 'react';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { LanguageProvider } from '../context/LanguageContext';
import { MetricsOverview } from '../components/MetricsOverview';
import { BotComparison } from '../components/BotComparison';
import { RecentSessions } from '../components/RecentSessions';

type Section = 'overview' | 'bot-comparison' | 'recent-sessions';

function DashboardContent() {
  const [activeSection, setActiveSection] = useState<Section>('overview');

  return (
    <div className="flex gap-12 min-h-screen">
      {/* Left Sidebar Navigation */}
      <aside className="w-72 flex-shrink-0">
        <nav className="sticky top-24 space-y-2">
          {/* Section 1: Overview */}
          <button
            onClick={() => setActiveSection('overview')}
            className={`w-full text-left flex items-center gap-6 py-4 px-2 transition-all duration-300 group ${
              activeSection === 'overview' ? '' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <span className={`text-6xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'overview' ? 'text-white' : 'text-white/60'
            }`}>
              1
            </span>
            <span className={`text-2xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'overview' ? 'text-white' : 'text-white/60'
            }`}>
              Overview
            </span>
          </button>

          {/* Separator Line */}
          <div className="pl-8">
            <div className="w-px h-32 bg-white/20"></div>
          </div>

          {/* Section 2: Bot Comparison */}
          <button
            onClick={() => setActiveSection('bot-comparison')}
            className={`w-full text-left flex items-center gap-6 py-4 px-2 transition-all duration-300 group ${
              activeSection === 'bot-comparison' ? '' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <span className={`text-6xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'bot-comparison' ? 'text-white' : 'text-white/60'
            }`}>
              2
            </span>
            <span className={`text-2xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'bot-comparison' ? 'text-white' : 'text-white/60'
            }`}>
              Bot Comparison
            </span>
          </button>

          {/* Separator Line */}
          <div className="pl-8">
            <div className="w-px h-32 bg-white/20"></div>
          </div>

          {/* Section 3: Recent Sessions */}
          <button
            onClick={() => setActiveSection('recent-sessions')}
            className={`w-full text-left flex items-center gap-6 py-4 px-2 transition-all duration-300 group ${
              activeSection === 'recent-sessions' ? '' : 'opacity-40 hover:opacity-70'
            }`}
          >
            <span className={`text-6xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'recent-sessions' ? 'text-white' : 'text-white/60'
            }`}>
              3
            </span>
            <span className={`text-2xl font-light tracking-tight transition-all duration-300 ${
              activeSection === 'recent-sessions' ? 'text-white' : 'text-white/60'
            }`}>
              Recent Sessions
            </span>
          </button>
        </nav>
      </aside>

      {/* Right Content Area */}
      <main className="flex-1 min-w-0">
        {/* Language Switch in top right */}
        <div className="flex justify-end mb-8">
          <LanguageSwitch />
        </div>

        {/* Content Sections with fade transition */}
        <div className="animate-fadeIn">
          {activeSection === 'overview' && <MetricsOverview />}
          {activeSection === 'bot-comparison' && <BotComparison />}
          {activeSection === 'recent-sessions' && <RecentSessions />}
        </div>
      </main>
    </div>
  );
}

// Wrap the dashboard with the language provider
export function Dashboard() {
  return (
    <LanguageProvider>
      <DashboardContent />
    </LanguageProvider>
  );
}
