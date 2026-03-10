import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'pl';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translate: (key: string) => string;
}

const translations = {
  en: {
    // General
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Overview of your Voice AI system performance',
    'dashboard.updated': 'Updated',
    'dashboard.updatingMetrics': 'Updating metrics...',

    // Timeframes
    'timeframe.allTime': 'All Time',
    'timeframe.thisYear': 'This Year',
    'timeframe.thisMonth': 'This Month',
    'timeframe.thisWeek': 'This Week',
    'timeframe.thisDay': 'Today',
    'timeframe.label': 'Timeframe',

    // Main metrics
    'metrics.totalSessions': 'Total Sessions',
    'metrics.activeSessions': 'Active Sessions',
    'metrics.escalationRate': 'Escalation Rate',
    'metrics.avgSatisfaction': 'Avg Satisfaction',
    'metrics.avgCallDuration': 'Avg Call Duration',
    'metrics.completed': 'Completed',

    // Side metrics
    'metrics.firstTryCompletion': 'First-try Form Completion',
    'metrics.angryCustomers': 'Extremely Angry Customers',
    'metrics.legalThreats': 'Legal Action Threats',

    // Comparison
    'comparison.title': 'Bot Comparison Stats',
    'comparison.viewAll': 'View All',

    // Escalations
    'escalations.title': 'Recent Escalations',
    'escalations.total': 'Total Escalated Sessions',
    'escalations.byBot': 'Escalations by Bot',
    'escalations.viewAll': 'View All',
    'escalations.noEscalations': 'No escalations',
    'escalations.runningSmooth': 'All sessions are running smoothly',
  },
  pl: {
    // General
    'dashboard.title': 'Panel kontrolny',
    'dashboard.subtitle': 'Przegląd wydajności systemu głosowego AI',
    'dashboard.updated': 'Zaktualizowano',
    'dashboard.updatingMetrics': 'Aktualizowanie metryk...',

    // Timeframes
    'timeframe.allTime': 'Cały okres',
    'timeframe.thisYear': 'Ten rok',
    'timeframe.thisMonth': 'Ten miesiąc',
    'timeframe.thisWeek': 'Ten tydzień',
    'timeframe.thisDay': 'Dziś',
    'timeframe.label': 'Okres czasu',

    // Main metrics
    'metrics.totalSessions': 'Wszystkie sesje',
    'metrics.activeSessions': 'Aktywne sesje',
    'metrics.escalationRate': 'Wskaźnik eskalacji',
    'metrics.avgSatisfaction': 'Średnia satysfakcja',
    'metrics.avgCallDuration': 'Średni czas połączenia',
    'metrics.completed': 'Ukończone',

    // Side metrics
    'metrics.firstTryCompletion': 'Wypełnienie formularzy za pierwszym razem',
    'metrics.angryCustomers': 'Bardzo zdenerwowani klienci',
    'metrics.legalThreats': 'Groźby działań prawnych',

    // Comparison
    'comparison.title': 'Statystyki porównawcze botów',
    'comparison.viewAll': 'Zobacz wszystkie',

    // Escalations
    'escalations.title': 'Ostatnie eskalacje',
    'escalations.total': 'Łączna liczba eskalowanych sesji',
    'escalations.byBot': 'Eskalacje według bota',
    'escalations.viewAll': 'Zobacz wszystkie',
    'escalations.noEscalations': 'Brak eskalacji',
    'escalations.runningSmooth': 'Wszystkie sesje działają sprawnie',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const translate = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}