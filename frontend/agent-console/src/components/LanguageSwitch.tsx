import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pl' : 'en');
  };

  return (
    <div className="flex items-center">
      <span className="mr-2 text-sm text-gray-600">
        {language === 'en' ? 'EN' : 'PL'}
      </span>
      <button
        onClick={toggleLanguage}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 bg-gray-200"
        role="switch"
        aria-checked={language === 'pl'}
      >
        <span
          className={`${
            language === 'pl' ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
      <span className="ml-2 text-sm text-gray-600">
        {language === 'en' ? 'PL' : 'EN'}
      </span>
    </div>
  );
}