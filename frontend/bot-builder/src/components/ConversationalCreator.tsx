import React, { useState } from 'react';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="py-16 text-center mb-16">
        <h1 className="text-7xl font-light text-white mb-6 tracking-tight">
          {currentConfig ? t('creator.title.refine') : t('creator.title.create')}
        </h1>
        <p className="text-lg text-white/50 font-light max-w-2xl mx-auto">
          {currentConfig
            ? t('creator.subtitle.refine')
            : t('creator.subtitle.create')
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="mb-12 flex justify-center">
        <div className="inline-flex gap-8 relative">
          <button
            onClick={() => setLanguage('pl')}
            className={`relative px-2 py-2 text-sm font-light transition-all duration-300 ${
              language === 'pl'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t('creator.language.pl')}
            {language === 'pl' && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
            )}
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`relative px-2 py-2 text-sm font-light transition-all duration-300 ${
              language === 'en'
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t('creator.language.en')}
            {language === 'en' && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
            )}
          </button>
        </div>
      </div>

      {!currentConfig ? (
        /* Initial Creation */
        <>
          <div className="mb-12">
            <label className="text-xs uppercase tracking-wider text-white/40 font-light mb-4 block">
              {t('creator.label.describe')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('creator.placeholder')}
              className="w-full min-h-[280px] bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 text-white/90 text-base leading-relaxed tracking-tight font-light focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/10 focus:bg-white/[0.04] placeholder:text-white/30 placeholder:font-light transition-all duration-300 resize-none hover:bg-white/[0.03] hover:border-white/10"
              disabled={isGenerating}
            />
            <div className="mt-3 text-xs text-white/40 font-light">
              {t('creator.hint')}
            </div>
          </div>

          {error && (
            <div className="mb-8 text-center">
              <p className="text-white/60 text-sm font-light">{error}</p>
            </div>
          )}

          <div className="flex justify-center mb-20">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !description.trim()}
              className="btn btn-primary text-base px-10 py-4 font-light"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('creator.generating')}
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4" />
                  {t('creator.generate')}
                </span>
              )}
            </button>
          </div>

          {/* Examples - Horizontal Scroll */}
          <div className="space-y-6">
            <h3 className="text-xs uppercase tracking-wider text-white/40 font-light">
              {t('creator.examples.title')}
            </h3>
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                {examples.map((example, idx) => (
                  <div
                    key={idx}
                    onClick={() => !isGenerating && setDescription(example.text)}
                    className="flex-shrink-0 w-96 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 transition-all duration-300 cursor-pointer group"
                  >
                    <h4 className="font-medium text-white text-base mb-3 tracking-tight">{example.title}</h4>
                    <p className="text-sm text-white/50 font-light line-clamp-3 leading-relaxed">{example.text}</p>
                    <div className="mt-4 pt-4 border-t border-white/[0.06]">
                      <span className="text-xs text-white/40 font-light group-hover:text-white/60 transition-colors">
                        {t('creator.examples.use')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Refinement Mode */
        <div className="space-y-12">
          {/* Success message */}
          <div className="relative overflow-visible py-12 text-center">
            {/* Ambient glow particles - more subtle */}
            <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/20 rounded-full blur-xl animate-[glowFloat_3s_ease-in-out_infinite]" />
            <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/10 rounded-full blur-2xl animate-[glowFloat_4s_ease-in-out_infinite_0.5s]" />
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-white/15 rounded-full blur-xl animate-[glowFloat_3.5s_ease-in-out_infinite_1s]" />

            {/* Message */}
            <div className="relative">
              <h3 className="font-light text-white text-3xl mb-4 animate-[subtleSlide_0.8s_ease-out] tracking-tight">
                {t('creator.success')}
              </h3>
              <p className="text-base text-white/50 font-light max-w-xl mx-auto animate-[subtleSlide_0.8s_ease-out_0.15s_both]">
                {t('creator.success.hint')}
              </p>
            </div>
          </div>

          {/* Refinement input */}
          <div>
            <label className="text-xs uppercase tracking-wider text-white/40 font-light mb-4 block">
              {t('creator.refine.label')}
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder={t('creator.refine.placeholder')}
              className="w-full min-h-[200px] bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 text-white/90 text-base leading-relaxed tracking-tight font-light focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/10 focus:bg-white/[0.04] placeholder:text-white/30 placeholder:font-light transition-all duration-300 resize-none hover:bg-white/[0.03] hover:border-white/10"
              disabled={isGenerating}
            />
            <div className="mt-3 text-xs text-white/40 font-light">
              {t('creator.refine.hint')}
            </div>
          </div>

          {error && (
            <div className="text-center py-6">
              <p className="text-white/60 text-sm font-light">{error}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleRefinement}
              disabled={isGenerating || !refinement.trim()}
              className="btn btn-primary text-base px-10 py-4 font-light"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('creator.refine.updating')}
                </span>
              ) : (
                <span className="flex items-center gap-2.5">
                  <RefreshCw className="w-4 h-4" />
                  {t('creator.refine.update')}
                </span>
              )}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mt-16 pt-12 border-t border-white/[0.06]">
              <h3 className="text-xs uppercase tracking-wider text-white/40 font-light mb-6">{t('creator.history')}</h3>
              <div className="space-y-4">
                {history.map((item, idx) => (
                  <div key={idx} className="text-sm text-white/50 font-light pl-6 border-l border-white/20 py-3">
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
