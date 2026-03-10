import React, { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface GeneratedConfig {
  prompt: string;
  fields: any[];
  flow: any;
}

interface Props {
  onGenerate: (config: GeneratedConfig) => void;
  currentConfig?: GeneratedConfig;
}

export const ConversationalCreator: React.FC<Props> = ({ onGenerate, currentConfig }) => {
  const { t, language: uiLanguage } = useLanguage();
  const [description, setDescription] = useState('');
  const [refinement, setRefinement] = useState('');
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const examples = [
    {
      title: t('creator.example1.title'),
      text: t('creator.example1.text'),
    },
    {
      title: t('creator.example2.title'),
      text: t('creator.example2.text'),
    },
    {
      title: t('creator.example3.title'),
      text: t('creator.example3.text'),
    },
  ];

  const handleGenerate = async (inputDescription?: string) => {
    const textToUse = inputDescription || description;

    if (!textToUse.trim()) {
      setError('Proszę opisz co ma robić Twój voicebot');
      return;
    }

    setIsGenerating(true);
    setError('');

    // Add to history
    setHistory([...history, textToUse]);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      console.log('[BOT-GEN] API URL:', apiUrl);
      console.log('[BOT-GEN] Starting generation request...');
      console.log('[BOT-GEN] Description:', textToUse);
      console.log('[BOT-GEN] Language:', language);

      const response = await fetch(`${apiUrl}/api/bot/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: textToUse,
          language,
          currentConfig: currentConfig // Send current config for refinements
        }),
      });

      console.log('[BOT-GEN] Response status:', response.status);
      console.log('[BOT-GEN] Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[BOT-GEN] Error response:', errorText);
        throw new Error(`Nie udało się wygenerować konfiguracji: ${response.status}`);
      }

      const generated = await response.json();
      console.log('[BOT-GEN] ✅ Generation successful');
      console.log('[BOT-GEN] Fields generated:', generated.fields?.length || 0);

      onGenerate(generated);

      // Clear inputs after successful generation
      setDescription('');
      setRefinement('');
    } catch (err: any) {
      console.error('[BOT-GEN] ❌ Error:', err);
      console.error('[BOT-GEN] Error message:', err.message);
      console.error('[BOT-GEN] Error stack:', err.stack);
      setError(err.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinement = () => {
    if (refinement.trim()) {
      handleGenerate(`Modyfikuj obecną konfigurację: ${refinement}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-ink mb-3">
          {currentConfig ? t('creator.title.refine') : t('creator.title.create')}
        </h1>
        <p className="text-lg text-ink-medium">
          {currentConfig
            ? t('creator.subtitle.refine')
            : t('creator.subtitle.create')
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-border-light bg-white p-1">
          <button
            onClick={() => setLanguage('pl')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              language === 'pl'
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-medium hover:text-ink'
            }`}
          >
            {t('creator.language.pl')}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              language === 'en'
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-medium hover:text-ink'
            }`}
          >
            {t('creator.language.en')}
          </button>
        </div>
      </div>

      {!currentConfig ? (
        /* Initial Creation */
        <>
          <div className="card rounded-xl p-8 mb-8">
            <label className="block text-sm font-semibold text-ink mb-3">
              {t('creator.label.describe')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('creator.placeholder')}
              className="input min-h-[200px] text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-ink-light">
              {t('creator.hint')}
            </div>
          </div>

          {error && (
            <div className="mb-6 card p-4 rounded-xl border-danger text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-12">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !description.trim()}
              className="px-8 py-4 bg-ink text-white rounded-xl font-semibold text-lg shadow-lg hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('creator.generating')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('creator.generate')}
                </span>
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-ink mb-4">
              {t('creator.examples.title')}
            </h3>
            <div className="grid gap-4">
              {examples.map((example, idx) => (
                <div
                  key={idx}
                  onClick={() => !isGenerating && setDescription(example.text)}
                  className="card-hover p-5 rounded-xl cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-ink mb-2">{example.title}</h4>
                      <p className="text-sm text-ink-medium line-clamp-2">{example.text}</p>
                    </div>
                    <button className="text-xs text-ink hover:opacity-70 font-medium ml-4">
                      {t('creator.examples.use')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Refinement Mode */
        <div className="space-y-6">
          {/* Success message */}
          <div className="card rounded-xl p-5 flex items-start gap-3 border-success bg-cream">
            <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-ink mb-1">{t('creator.success')}</h3>
              <p className="text-sm text-ink-medium">
                {t('creator.success.hint')}
              </p>
            </div>
          </div>

          {/* Refinement input */}
          <div className="card rounded-xl p-8">
            <label className="block text-sm font-semibold text-ink mb-3">
              {t('creator.refine.label')}
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder={t('creator.refine.placeholder')}
              className="input min-h-[150px] text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-ink-light">
              {t('creator.refine.hint')}
            </div>
          </div>

          {error && (
            <div className="card p-4 rounded-xl border-danger text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleRefinement}
              disabled={isGenerating || !refinement.trim()}
              className="px-8 py-4 bg-ink text-white rounded-xl font-semibold shadow-lg hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('creator.refine.updating')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  {t('creator.refine.update')}
                </span>
              )}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-ink mb-3">{t('creator.history')}</h3>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={idx} className="text-sm text-ink-medium pl-3 border-l-2 border-border-light">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationalCreator;
