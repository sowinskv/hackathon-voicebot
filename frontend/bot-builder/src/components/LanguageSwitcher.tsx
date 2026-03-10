import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-secondary" />
      <div className="inline-flex rounded-xl bg-white/60 backdrop-blur-sm p-1 border border-[#d4b69c]/30">
        <button
          onClick={() => setLanguage('pl')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            language === 'pl'
              ? 'bg-gradient-to-r from-[#c17b5c] to-[#8b5c4c] text-white shadow-md'
              : 'text-secondary hover:bg-white/50'
          }`}
        >
          PL
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            language === 'en'
              ? 'bg-gradient-to-r from-[#c17b5c] to-[#8b5c4c] text-white shadow-md'
              : 'text-secondary hover:bg-white/50'
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
};
