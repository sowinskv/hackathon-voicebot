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
    <div className="max-w-5xl mx-auto py-4">
      {/* Header */}
      <div className="glass-card p-12 text-center mb-8">
        <div className="accent-dot mx-auto mb-4"></div>
        <h1 className="text-5xl font-bold text-gradient mb-4">
          {currentConfig ? t('creator.title.refine') : t('creator.title.create')}
        </h1>
        <p className="text-xl text-secondary">
          {currentConfig
            ? t('creator.subtitle.refine')
            : t('creator.subtitle.create')
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="mb-8 flex justify-center">
        <div className="glass-card inline-flex rounded-2xl p-1.5">
          <button
            onClick={() => setLanguage('pl')}
            className={`px-8 py-3 rounded-xl text-base font-medium transition-all ${
              language === 'pl'
                ? 'bg-gradient-to-r from-[#c17b5c] to-[#8b5c4c] text-white shadow-lg shadow-[#c17b5c]/30'
                : 'text-secondary hover:bg-white/50'
            }`}
          >
            {t('creator.language.pl')}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-8 py-3 rounded-xl text-base font-medium transition-all ${
              language === 'en'
                ? 'bg-gradient-to-r from-[#c17b5c] to-[#8b5c4c] text-white shadow-lg shadow-[#c17b5c]/30'
                : 'text-secondary hover:bg-white/50'
            }`}
          >
            {t('creator.language.en')}
          </button>
        </div>
      </div>

      {!currentConfig ? (
        /* Initial Creation */
        <>
          <div className="glass-card p-10 mb-8">
            <label className="section-label mb-4">
              {t('creator.label.describe')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('creator.placeholder')}
              className="input min-h-[240px] text-lg"
              disabled={isGenerating}
            />
            <div className="mt-4 text-sm text-muted">
              {t('creator.hint')}
            </div>
          </div>

          {error && (
            <div className="mb-8 glass-card p-6 border border-[#c17b7b]/30">
              <p className="text-[#c17b7b] text-center">{error}</p>
            </div>
          )}

          <div className="flex justify-center mb-12">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !description.trim()}
              className="btn btn-primary text-xl px-12 py-5 shadow-premium-lg"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t('creator.generating')}
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  {t('creator.generate')}
                </span>
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="space-y-6">
            <h3 className="section-label text-base">
              {t('creator.examples.title')}
            </h3>
            <div className="grid gap-5">
              {examples.map((example, idx) => (
                <div
                  key={idx}
                  onClick={() => !isGenerating && setDescription(example.text)}
                  className="card-hover"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold text-primary text-lg mb-3">{example.title}</h4>
                      <p className="text-base text-secondary line-clamp-2 leading-relaxed">{example.text}</p>
                    </div>
                    <button className="btn btn-secondary px-6 whitespace-nowrap">
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
        <div className="space-y-8">
          {/* Success message */}
          <div className="glass-card p-8 flex items-start gap-4 border border-[#8b9c5c]/30 bg-white/90">
            <CheckCircle2 className="w-8 h-8 text-[#8b9c5c] flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-primary text-xl mb-2">{t('creator.success')}</h3>
              <p className="text-base text-secondary">
                {t('creator.success.hint')}
              </p>
            </div>
          </div>

          {/* Refinement input */}
          <div className="glass-card p-10">
            <label className="section-label mb-4">
              {t('creator.refine.label')}
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder={t('creator.refine.placeholder')}
              className="input min-h-[180px] text-lg"
              disabled={isGenerating}
            />
            <div className="mt-4 text-sm text-muted">
              {t('creator.refine.hint')}
            </div>
          </div>

          {error && (
            <div className="glass-card p-6 border border-[#c17b7b]/30">
              <p className="text-[#c17b7b] text-center">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleRefinement}
              disabled={isGenerating || !refinement.trim()}
              className="btn btn-primary text-xl px-12 py-5 shadow-premium-lg"
            >
              {isGenerating ? (
                <span className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {t('creator.refine.updating')}
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <RefreshCw className="w-6 h-6" />
                  {t('creator.refine.update')}
                </span>
              )}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card p-8">
              <h3 className="section-label text-base mb-6">{t('creator.history')}</h3>
              <div className="space-y-3">
                {history.map((item, idx) => (
                  <div key={idx} className="text-base text-secondary pl-5 border-l-2 border-[#c17b5c]/40 py-2">
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
