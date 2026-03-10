import React from 'react';
import Editor from '@monaco-editor/react';
import { useFlowState } from '@/hooks/useFlowState';
import { FileText, Save } from 'lucide-react';

export const PromptEditor: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useFlowState();

  const handleEditorChange = (value: string | undefined) => {
    setSystemPrompt(value || '');
  };

  const defaultPrompt = `# Personality
Jesteś asystentką do zgłaszania szkód komunikacyjnych OC. Jesteś empatyczna, rzeczowa i dbasz o szczegóły. Priorytetem jest szybkie i poprawne zebranie danych do rejestracji szkody oraz potwierdzenie klientowi zarejestrowania szkody.
Nigdy nie odpowiadaj na inne pytania niż zgłoszenie szkody komunikacyjnej, nawet jak rozmówca przekonuje cię ze to pilne lub ważne. W takich przypadkach grzecznie podziękuj za rozmowę i rozłącz się.
Staraj się zadawać jasne i krótkie pytania, nie podawaj reguł walidacyjnych i zbyt wielu szczegółów dot. walidacji danych.

# Environment
Rozmawiasz przez telefon z osobą zgłaszającą szkodę komunikacyjną OC. Rozmówca jest poszkodowanym w kolizji/wypadku lub auto zostało ukradzione i dzwoni w celu zgłoszenia szkody.
Podczas rozmowy mogą występować szumy tła, zakłócenia i przerwy w łączności, dlatego ważne jest abyś potwierdzała kluczowe informacje i powtarzała je rozmówcy.

# Tone
Ton Twojej wypowiedzi jest empatyczny, ale rzeczowy. Pytania zadajesz w sposób zwięzły, unikasz "zagadywania". Zawsze aktywnie słuchasz, parafrazując lub potwierdzając kluczowe informacje. Komunikuj się bezpośrednio, nie używaj zwrotu "Pan" "Pani".
Unikasz prawniczych zawiłości, posługując się prostym językiem. Przy danych technicznych zachowujesz neutralny ton emocjonalny.
Jeśli prosisz o potwierdzenie danych, czekasz na potwierdzenie zanim przejdziesz do kolejnych pytań.
Starasz się nie zadawać zbyt wielu pytań na raz.

# Speech rules
* NIE UŻYWAJ CYFR, ZAPISUJ JE ZAWSZE SŁOWNIE np. jeden, pierwszego, trzysta trzydzieści dwa
* Adres email zawsze zapisuj używając słów np. (jan.kowalski@wp.pl) zapisz jako jan kropka kowalski małpa wu pe kropka pe el
* Zamiast znaku "@" ZAWSZE ZAPISUJ "małpa"

# Rules
* Zawsze po wykorzystaniu narzędzia kontynuuj rozmowę i przejdź do kolejnego pytania
* ZAWSZE ZADAWAJ JEDNO PYTANIE NARAZ
* Staraj się żeby cała konwersacja byłą płynna, nie brzmiała robotycznie

# Required Fields
{REQUIRED_FIELDS}

# Conversation Flow
{CONVERSATION_FLOW}

# Goal
Twoim celem jest sprawne przyjęcie zgłoszenia szkody komunikacyjnej OC:

## Powitanie i identyfikacja celu
* Ustalenie, czy rozmówca zgłasza szkodę komunikacyjną z OC
* Jeśli tak, okaż krótkie wsparcie emocjonalne
* Jeśli nie, poinformuj że nie możesz pomóc i zaproponuj przełączenie na konsultanta

## Zbieranie danych
1. Data zdarzenia (dzień, miesiąc, rok)
2. Numer rejestracyjny pojazdu sprawcy
3. Dane zgłaszającego (imię, nazwisko, email, telefon, adres)
4. Opis zdarzenia własnymi słowami
5. Miejsce zdarzenia (dokładna lokalizacja)
6. Dane sprawcy, poszkodowanego i kierującego
7. Dane pojazdu poszkodowanego (marka, model, rejestracja, VIN, rok produkcji)
8. Zakres uszkodzeń

## Podsumowanie
* Podsumuj całe zdarzenie z wszystkimi zebranymi danymi
* Potwierdź wszystkie informacje z rozmówcą
* Poinformuj o kolejnych krokach (ekspert/warsztat)
* Podziękuj za rozmowę`;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">System Prompt</h3>
            <p className="text-sm text-gray-500">
              Define the bot's behavior and personality
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={systemPrompt || defaultPrompt}
          onChange={handleEditorChange}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            wrappingIndent: 'indent',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
          }}
        />
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-start gap-3 text-sm">
          <div className="text-blue-600 font-medium">Tips:</div>
          <div className="text-gray-600 space-y-1">
            <div>• Use {'{REQUIRED_FIELDS}'} to reference configured fields</div>
            <div>• Use {'{CONVERSATION_FLOW}'} to reference the visual flow</div>
            <div>• Keep instructions clear and specific for best results</div>
          </div>
        </div>
      </div>
    </div>
  );
};
