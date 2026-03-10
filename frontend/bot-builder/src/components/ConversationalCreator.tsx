import React, { useState } from 'react';
import { Loader2, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

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
  const [description, setDescription] = useState('');
  const [refinement, setRefinement] = useState('');
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const examples = [
    {
      title: 'Zgłoszenie szkody OC',
      text: 'Chcę bota który zbiera informacje o szkodzie komunikacyjnej OC. Powinien zapytać o datę zdarzenia, numer rejestracyjny pojazdu sprawcy, dane zgłaszającego (imię, nazwisko, email, telefon, adres), opis zdarzenia, miejsce zdarzenia i zakres uszkodzeń. Bot powinien być empatyczny ale rzeczowy.',
    },
    {
      title: 'Wsparcie techniczne',
      text: 'Potrzebuję bota do wsparcia technicznego. Powinien zebrać: imię i nazwisko, email, numer telefonu, kategorię problemu (techniczny/płatności/inny), opis problemu i pilność. Bot powinien być przyjazny i pomocny.',
    },
    {
      title: 'Rezerwacja wizyt',
      text: 'Bot do umawiania wizyt lekarskich. Zbiera: imię i nazwisko, pesel, telefon, preferowana data i godzina, powód wizyty. Bot powinien być ciepły i pomocny.',
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
          {currentConfig ? 'Udoskonalaj swojego bota' : 'Stwórz voicebota'}
        </h1>
        <p className="text-lg text-ink-medium">
          {currentConfig
            ? 'Powiedz co chcesz zmienić, a AI zaktualizuje konfigurację'
            : 'Opisz czym ma się zajmować Twój voicebot, a AI wygeneruje wszystko za Ciebie'
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
            Polski
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              language === 'en'
                ? 'bg-ink text-white shadow-sm'
                : 'text-ink-medium hover:text-ink'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {!currentConfig ? (
        /* Initial Creation */
        <>
          <div className="card rounded-xl p-8 mb-8">
            <label className="block text-sm font-semibold text-ink mb-3">
              Opisz swojego voicebota
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Przykład: Chcę bota który zbiera informacje o szkodzie komunikacyjnej. Powinien zapytać o datę zdarzenia, numer rejestracyjny pojazdu sprawcy, dane zgłaszającego i opis zdarzenia. Bot powinien być empatyczny ale rzeczowy."
              className="input min-h-[200px] text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-ink-light">
              Bądź konkretny: jakie informacje ma zbierać, jaki ma być ton, jakie specjalne wymagania
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
                  AI generuje konfigurację...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Wygeneruj bota
                </span>
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-ink mb-4">
              Przykłady - kliknij aby użyć
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
                      Użyj →
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
              <h3 className="font-semibold text-ink mb-1">Bot został wygenerowany!</h3>
              <p className="text-sm text-ink-medium">
                Przejdź do zakładek powyżej aby zobaczyć szczegóły (Prompt, Pola, Flow) lub opisz poniżej co chcesz zmienić.
              </p>
            </div>
          </div>

          {/* Refinement input */}
          <div className="card rounded-xl p-8">
            <label className="block text-sm font-semibold text-ink mb-3">
              Co chcesz zmienić?
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder="Przykład: Dodaj pole 'Numer VIN pojazdu', usuń pole 'Adres email', zmień ton na bardziej formalny, pole z numerem telefonu powinno być opcjonalne"
              className="input min-h-[150px] text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-ink-light">
              Opisz zmiany naturalnym językiem. AI zaktualizuje konfigurację.
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
                  Aktualizuję...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Zaktualizuj bota
                </span>
              )}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-ink mb-3">Historia zmian</h3>
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
