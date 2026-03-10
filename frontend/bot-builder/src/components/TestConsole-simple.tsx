import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  flow: any;
  prompt: string;
  fields: any[];
}

const TestConsole: React.FC<Props> = ({ flow, prompt, fields }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('test.title')}</h2>
      <p className="text-gray-600 mb-6">
        {t('test.subtitle')}
      </p>
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-500">{t('test.comingSoon')}</p>
        <p className="text-sm text-gray-400 mt-2">
          {t('test.comingSoon.hint')}
        </p>
      </div>
    </div>
  );
};

export default TestConsole;
