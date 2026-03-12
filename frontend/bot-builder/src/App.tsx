import React, { useState } from 'react';
import ConversationalCreator from './components/ConversationalCreator';
import FlowEditor from './components/FlowEditor';
import TestConsole from './components/TestConsole-simple';
import VersionHistory from './components/VersionHistory-simple';
import BotList from './components/BotList';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useLanguage } from './i18n/LanguageContext';

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
  const { t } = useLanguage();
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [botName, setBotName] = useState('Nowy Voicebot');
  const [botDescription, setBotDescription] = useState('');
  const [botLanguage, setBotLanguage] = useState<'pl' | 'en'>('pl');
  const [currentBotId, setCurrentBotId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        // Near top - always show
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY - 20) {
        // Scrolling up with some momentum - show
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleGenerate = (generated: GeneratedConfig) => {
    setConfig(generated);
    setHasUnsavedChanges(true);
    setShowAdvanced(true);
  };

  const handleCreateNew = () => {
    setView('editor');
    setConfig(null);
    setCurrentBotId(null);
    setBotName('super kitties');
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
    if (hasUnsavedChanges && !window.confirm(t('common.unsavedChanges'))) {
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
      alert(currentBotId ? t('common.updated') : t('common.saved'));
    } catch (error: any) {
      console.error('[BOT-SAVE] Error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handlePublish = async () => {
    if (!config) return;

    // Save first if unsaved
    if (hasUnsavedChanges) {
      await handleSave();
    }

    if (!currentBotId) {
      alert(t('common.saveFirst'));
      return;
    }

    if (!window.confirm(t('common.publishConfirm'))) return;

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
      alert(t('common.published'));
    } catch (error: any) {
      console.error('[BOT-PUBLISH] Error:', error);
      alert('Error: ' + error.message);
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
    { id: 'create', label: t('tabs.conversation'), desc: t('tabs.conversation.desc') },
    ...(showAdvanced ? [
      { id: 'prompt', label: t('tabs.prompt'), desc: t('tabs.prompt.desc') },
      { id: 'fields', label: t('tabs.fields'), desc: t('tabs.fields.desc') },
      { id: 'flow', label: t('tabs.flow'), desc: t('tabs.flow.desc') },
      { id: 'test', label: t('tabs.test'), desc: t('tabs.test.desc') },
      { id: 'versions', label: t('tabs.versions'), desc: t('tabs.versions.desc') },
    ] : []) as Array<{ id: Tab; label: string; desc: string }>,
  ];

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Fixed Language Switcher - Top Right */}
      <div className="fixed top-4 right-8 z-50">
        <LanguageSwitcher />
      </div>

      <header className={`sticky top-4 z-40 mx-4 mb-6 transition-all duration-300 ${
        isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {view === 'list' ? (
                <div className="flex items-center gap-3">
                  <div className="accent-dot"></div>
                  <h1 className="text-2xl font-bold text-gradient">super kitties</h1>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="accent-dot"></div>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => {
                      setBotName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    className="text-xl font-bold text-gradient bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-[#c17b5c]/50 rounded-lg px-2"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {view === 'editor' && (
                <>
                  <button
                    onClick={handleBackToList}
                    className="btn btn-secondary"
                  >
                    {t('header.backToList')}
                  </button>
              {config && (
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="btn btn-secondary"
                >
                  {showAdvanced ? t('header.hideAdvanced') : t('header.showAdvanced')}
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!config || !hasUnsavedChanges}
                className="btn btn-secondary"
              >
                {t('header.save')}
              </button>
              <button
                onClick={handlePublish}
                disabled={!config}
                className="btn btn-primary"
              >
                {t('header.publish')}
              </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAdvanced && (
        <div className={`sticky top-24 z-40 mx-4 mb-12 transition-all duration-300 ${
          isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
        }`}>
          <div className="max-w-7xl mx-auto px-8 py-2">
            <div className="flex gap-8 justify-center relative">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'text-white'
                      : 'text-white/60 hover:text-white/90'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{tab.label}</span>
                    <span className="text-[10px] opacity-60 mt-0.5">{tab.desc}</span>
                  </div>
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pb-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          {view === 'list' ? (
            <BotList onCreateNew={handleCreateNew} onEditBot={handleEditBot} />
          ) : (
            <>
              {activeTab === 'create' && (
                <ConversationalCreator onGenerate={handleGenerate} currentConfig={config || undefined} />
              )}
          {activeTab === 'prompt' && config && (
            <div className="max-w-5xl mx-auto py-4 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-1 h-1 rounded-full bg-white/60"></div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">{t('prompt.title')}</h2>
              </div>
              <p className="text-white/60 text-sm mb-6 -mt-4 ml-5">
                The system prompt defines your bot's personality, behavior, and instructions
              </p>

              {/* Prompt editor */}
              <div className="relative group">
                {/* Subtle accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                <textarea
                  value={config.prompt}
                  onChange={(e) => updatePrompt(e.target.value)}
                  className="w-full min-h-[500px] bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] rounded-xl p-8 pl-10 text-white/90 text-[15px] leading-[1.7] tracking-[-0.01em] focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/10 focus:bg-white/[0.04] placeholder:text-white/30 transition-all duration-300 resize-y hover:bg-white/[0.03] hover:border-white/10"
                  placeholder="Enter your system prompt here..."
                  spellCheck="false"
                />

                {/* Character count */}
                <div className="absolute bottom-4 right-4 text-xs text-white/40 font-mono">
                  {config.prompt.length} characters
                </div>
              </div>

              {/* Helpful tips */}
              <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 mt-1.5 flex-shrink-0"></div>
                <div className="text-xs text-white/60 leading-relaxed">
                  <span className="font-medium text-white/80">Tip:</span> Be specific about tone, format, and constraints. Include examples if needed.
                </div>
              </div>
            </div>
          )}
          {activeTab === 'fields' && config && (
            <div className="max-w-5xl mx-auto py-4 space-y-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-1 h-1 rounded-full bg-white/60"></div>
                <h2 className="text-2xl font-semibold text-white tracking-tight">{t('fields.title')}</h2>
              </div>
              <p className="text-white/60 text-sm mb-6 -mt-4 ml-5">
                {config.fields.length} {config.fields.length === 1 ? 'field' : 'fields'} will be collected during conversations
              </p>

              {/* Fields list */}
              <div className="space-y-3">
                {config.fields.map((field, idx) => {
                  // Handle translation objects - extract the string value
                  const getDisplayValue = (value: any) => {
                    if (typeof value === 'string') return value;
                    if (typeof value === 'object' && value !== null) {
                      return value[botLanguage] || value.pl || value.en || Object.values(value)[0] || JSON.stringify(value);
                    }
                    return String(value);
                  };

                  return (
                    <div
                      key={idx}
                      className="relative group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/10 rounded-xl p-6 transition-all duration-300"
                    >
                      {/* Accent line */}
                      <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0 pl-4">
                          {/* Field label */}
                          <h3 className="font-semibold text-white text-lg mb-2 tracking-tight">{getDisplayValue(field.label)}</h3>

                          {/* Field metadata */}
                          <div className="flex items-center gap-3 text-sm text-white/50">
                            <code className="px-2 py-0.5 bg-white/5 rounded text-xs text-white/70 font-mono">{getDisplayValue(field.name)}</code>
                            <span className="text-white/30">•</span>
                            <span className="text-xs uppercase tracking-wider">{getDisplayValue(field.type)}</span>
                            {field.required && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className="text-xs text-white/60 font-medium">Required</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Prompt template */}
                      {field.promptTemplate && (
                        <div className="pl-4 mb-3">
                          <p className="text-sm text-white/60 leading-relaxed italic">
                            "{getDisplayValue(field.promptTemplate)}"
                          </p>
                        </div>
                      )}

                      {/* Validation rules */}
                      {field.validation && Object.keys(field.validation).length > 0 && (
                        <div className="pl-4 mt-4 pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-1 h-1 rounded-full bg-white/40"></div>
                            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Validation</span>
                          </div>
                          <div className="space-y-1.5 text-xs text-white/50 pl-3">
                            {field.validation.min && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30">→</span>
                                <span>Min: {field.validation.min}</span>
                              </div>
                            )}
                            {field.validation.max && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30">→</span>
                                <span>Max: {field.validation.max}</span>
                              </div>
                            )}
                            {field.validation.pattern && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30">→</span>
                                <span>Pattern: <code className="bg-white/5 px-1.5 py-0.5 rounded text-white/60">{field.validation.pattern}</code></span>
                              </div>
                            )}
                            {field.validation.errorMessage && (
                              <div className="flex items-center gap-2">
                                <span className="text-white/30">→</span>
                                <span>Error: {getDisplayValue(field.validation.errorMessage)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
