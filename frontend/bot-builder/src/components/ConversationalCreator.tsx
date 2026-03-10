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
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          {currentConfig ? 'Udoskonalaj swojego bota' : 'Stwórz voicebota'}
        </h1>
        <p className="text-lg text-gray-600">
          {currentConfig
            ? 'Powiedz co chcesz zmienić, a AI zaktualizuje konfigurację'
            : 'Opisz czym ma się zajmować Twój voicebot, a AI wygeneruje wszystko za Ciebie'
          }
        </p>
      </div>

      {/* Language Selection */}
      <div className="mb-8 flex justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setLanguage('pl')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              language === 'pl'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Polski
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              language === 'en'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            English
          </button>
        </div>
      </div>

      {!currentConfig ? (
        /* Initial Creation */
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Opisz swojego voicebota
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Przykład: Chcę bota który zbiera informacje o szkodzie komunikacyjnej. Powinien zapytać o datę zdarzenia, numer rejestracyjny pojazdu sprawcy, dane zgłaszającego i opis zdarzenia. Bot powinien być empatyczny ale rzeczowy."
              className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-gray-500">
              Bądź konkretny: jakie informacje ma zbierać, jaki ma być ton, jakie specjalne wymagania
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-center mb-12">
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating || !description.trim()}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Przykłady - kliknij aby użyć
            </h3>
            <div className="grid gap-4">
              {examples.map((example, idx) => (
                <div
                  key={idx}
                  onClick={() => !isGenerating && setDescription(example.text)}
                  className="p-5 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">{example.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{example.text}</p>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-4">
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">Bot został wygenerowany!</h3>
              <p className="text-sm text-green-700">
                Przejdź do zakładek powyżej aby zobaczyć szczegóły (Prompt, Pola, Flow) lub opisz poniżej co chcesz zmienić.
              </p>
            </div>
          </div>

          {/* Refinement input */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Co chcesz zmienić?
            </label>
            <textarea
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder="Przykład: Dodaj pole 'Numer VIN pojazdu', usuń pole 'Adres email', zmień ton na bardziej formalny, pole z numerem telefonu powinno być opcjonalne"
              className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base"
              disabled={isGenerating}
            />
            <div className="mt-3 text-sm text-gray-500">
              Opisz zmiany naturalnym językiem. AI zaktualizuje konfigurację.
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={handleRefinement}
              disabled={isGenerating || !refinement.trim()}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Historia zmian</h3>
              <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-600 pl-3 border-l-2 border-gray-300">
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
