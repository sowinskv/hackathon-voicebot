import React, { useState } from 'react';
import ConversationalCreator from './components/ConversationalCreator';
import FlowEditor from './components/FlowEditor';
import TestConsole from './components/TestConsole-simple';
import VersionHistory from './components/VersionHistory-simple';
import BotList from './components/BotList';
import { Save, Eye, EyeOff, ArrowLeft, List } from 'lucide-react';

interface Flow {
  nodes: any[];
  edges: any[];
  collectionSequence?: Array<{
    fieldName: string;
    order: number;
  }>;
}

interface Field {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation?: any;
  promptTemplate: string;
}

interface GeneratedConfig {
  prompt: string;
  fields: Field[];
  flow: Flow;
}

type Tab = 'create' | 'prompt' | 'fields' | 'flow' | 'test' | 'versions';
type View = 'list' | 'editor';

interface SavedBot {
  id: string;
  name: string;
  description?: string;
  status: string;
  language: string;
  system_prompt: string;
  flow_definition: any;
  required_fields: any[];
}

function App() {
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [botName, setBotName] = useState('Nowy Voicebot');
  const [botDescription, setBotDescription] = useState('');
  const [botLanguage, setBotLanguage] = useState<'pl' | 'en'>('pl');
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleGenerate = (generated: GeneratedConfig) => {
    setConfig(generated);
    setHasUnsavedChanges(true);
    setShowAdvanced(true);
  };

  const handleCreateNew = () => {
    setView('editor');
    setConfig(null);
    setCurrentBotId(null);
    setBotName('Nowy Voicebot');
    setBotDescription('');
    setBotLanguage('pl');
    setActiveTab('create');
    setShowAdvanced(false);
    setHasUnsavedChanges(false);
  };

  const handleEditBot = (bot: SavedBot) => {
    setView('editor');
    setCurrentBotId(bot.id);
    setBotName(bot.name);
    setBotDescription(bot.description || '');
    setBotLanguage(bot.language as 'pl' | 'en');
    setConfig({
      prompt: bot.system_prompt,
      fields: bot.required_fields,
      flow: bot.flow_definition,
    });
    setActiveTab('create');
    setShowAdvanced(true);
    setHasUnsavedChanges(false);
  };

  const handleBackToList = () => {
    if (hasUnsavedChanges && !window.confirm('Masz niezapisane zmiany. Czy na pewno chcesz wrócić?')) {
      return;
    }
    setView('list');
    setShowAdvanced(false);
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      console.log('[BOT-SAVE] Saving bot...', { currentBotId, botName });

      const payload = {
        name: botName,
        description: botDescription,
        language: botLanguage,
        system_prompt: config.prompt,
        flow_definition: config.flow,
        required_fields: config.fields,
        status: currentBotId ? undefined : 'draft', // Keep existing status on update
      };

      const url = currentBotId
        ? `${import.meta.env.VITE_API_URL}/api/flows/${currentBotId}`
        : `${import.meta.env.VITE_API_URL}/api/flows`;

      const method = currentBotId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.status}`);
      }

      const result = await response.json();
      console.log('[BOT-SAVE] Saved successfully:', result.data);

      if (!currentBotId) {
        setCurrentBotId(result.data.id);
      }

      setHasUnsavedChanges(false);
      alert(currentBotId ? 'Bot zaktualizowany!' : 'Bot zapisany!');
    } catch (error: any) {
      console.error('[BOT-SAVE] Error:', error);
      alert('Błąd zapisu: ' + error.message);
    }
  };

  const handlePublish = async () => {
    if (!config) return;

    // Save first if unsaved
    if (hasUnsavedChanges) {
      await handleSave();
    }

    if (!currentBotId) {
      alert('Najpierw zapisz bota');
      return;
    }

    if (!window.confirm('Opublikować bota? Stanie się on dostępny dla użytkowników.')) return;

    try {
      console.log('[BOT-PUBLISH] Publishing...', currentBotId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${currentBotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to publish: ${response.status}`);
      }

      console.log('[BOT-PUBLISH] Published successfully');
      alert('Bot opublikowany!');
    } catch (error: any) {
      console.error('[BOT-PUBLISH] Error:', error);
      alert('Błąd publikacji: ' + error.message);
    }
  };

  const updatePrompt = (prompt: string) => {
    if (config) {
      setConfig({ ...config, prompt });
      setHasUnsavedChanges(true);
    }
  };

  const updateFields = (fields: Field[]) => {
    if (config) {
      setConfig({ ...config, fields });
      setHasUnsavedChanges(true);
    }
  };

  const updateFlow = (flow: Flow) => {
    if (config) {
      setConfig({ ...config, flow });
      setHasUnsavedChanges(true);
    }
  };

  const tabs = [
    { id: 'create', label: 'Konwersacja', desc: 'Opisz lub zmień' },
    ...(showAdvanced ? [
      { id: 'prompt', label: 'Prompt', desc: 'System prompt' },
      { id: 'fields', label: 'Pola', desc: 'Dane' },
      { id: 'flow', label: 'Flow', desc: 'Kolejność' },
      { id: 'test', label: 'Test', desc: 'Wypróbuj' },
      { id: 'versions', label: 'Wersje', desc: 'Historia' },
    ] : []) as Array<{ id: Tab; label: string; desc: string }>,
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b border-border-light sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {view === 'list' ? (
                <h1 className="text-xl font-bold text-ink">Bot Builder</h1>
              ) : (
                <>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => {
                      setBotName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="text-xl font-bold text-ink bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue rounded px-2"
                  />
                  {hasUnsavedChanges && (
                    <span className="text-sm text-warning">• Niezapisane</span>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3">
              {view === 'editor' && (
                <>
                  <button
                    onClick={handleBackToList}
                    className="flex items-center gap-2 px-4 py-2 text-sm border border-border-light text-ink rounded-lg hover:bg-cream"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Lista botów
                  </button>
              {config && (
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-border-light text-ink rounded-lg hover:bg-cream"
                >
                  {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAdvanced ? 'Ukryj' : 'Pokaż'} zaawansowane
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!config || !hasUnsavedChanges}
                className="flex items-center gap-2 px-5 py-2 text-sm border border-border-light text-ink rounded-lg hover:bg-cream disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Zapisz
              </button>
              <button
                onClick={handlePublish}
                disabled={!config}
                className="px-5 py-2 text-sm text-white bg-ink rounded-lg hover:opacity-80 disabled:opacity-50 font-medium"
              >
                Opublikuj
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAdvanced && (
        <div className="bg-white border-b border-border-light sticky top-[73px] z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-ink text-ink'
                      : 'border-transparent text-ink-medium hover:text-ink'
                  }`}
                >
                  <div>
                    <span>{tab.label}</span>
                    <span className="text-xs block opacity-75">{tab.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {view === 'list' ? (
            <BotList onCreateNew={handleCreateNew} onEditBot={handleEditBot} />
          ) : (
            <>
              {activeTab === 'create' && (
                <ConversationalCreator onGenerate={handleGenerate} currentConfig={config || undefined} />
              )}
          {activeTab === 'prompt' && config && (
            <div className="card p-6">
              <h2 className="text-h2 mb-4">System Prompt</h2>
              <textarea
                value={config.prompt}
                onChange={(e) => updatePrompt(e.target.value)}
                className="input min-h-[500px] font-mono"
              />
            </div>
          )}
          {activeTab === 'fields' && config && (
            <div className="card p-6">
              <h2 className="text-h2 mb-4">Required Fields</h2>
              <div className="space-y-4">
                {config.fields.map((field, idx) => {
                  // Handle translation objects - extract the string value
                  const getDisplayValue = (value: any) => {
                    if (typeof value === 'string') return value;
                    if (typeof value === 'object' && value !== null) {
                      // If it's a translation object {en: "...", pl: "..."}, use current language or first available
                      return value[botLanguage] || value.pl || value.en || Object.values(value)[0] || JSON.stringify(value);
                    }
                    return String(value);
                  };

                  return (
                    <div key={idx} className="card p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-ink">{getDisplayValue(field.label)}</h3>
                          <p className="text-sm text-ink-light mt-1">
                            <span className="font-mono">{getDisplayValue(field.name)}</span>
                            <span className="mx-2">•</span>
                            <span>{getDisplayValue(field.type)}</span>
                          </p>
                          {field.required && (
                            <span className="inline-block mt-2 text-xs font-medium text-white bg-ink px-2 py-1 rounded">
                              * Wymagane
                            </span>
                          )}
                          {field.promptTemplate && (
                            <p className="text-sm text-ink-medium mt-2 italic">
                              "{getDisplayValue(field.promptTemplate)}"
                            </p>
                          )}
                          {field.validation && Object.keys(field.validation).length > 0 && (
                            <div className="mt-3 text-xs text-ink-light space-y-1">
                              <p className="font-medium">Walidacja:</p>
                              {field.validation.min && <p>Min: {field.validation.min}</p>}
                              {field.validation.max && <p>Max: {field.validation.max}</p>}
                              {field.validation.pattern && <p>Pattern: <code className="bg-cream px-1 rounded">{field.validation.pattern}</code></p>}
                              {field.validation.errorMessage && <p>Error: {getDisplayValue(field.validation.errorMessage)}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {activeTab === 'flow' && config && (
            <FlowEditor flow={config.flow} onChange={updateFlow} fields={config.fields} />
          )}
          {activeTab === 'test' && config && (
            <TestConsole flow={config.flow} prompt={config.prompt} fields={config.fields} />
          )}
          {activeTab === 'versions' && <VersionHistory />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
