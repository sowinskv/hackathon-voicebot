import React, { useState, useEffect } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { saveBotConfig, updateBotConfig, publishBotConfig, validateFlow } from '@/services/api';
import { Canvas } from '@/components/FlowEditor/Canvas';
import { PromptEditor } from '@/components/PromptEditor';
import { SlotConfigurator } from '@/components/SlotConfigurator';
import { TestConsole } from '@/components/TestConsole';
import { VersionHistory } from '@/components/VersionHistory';
import {
  Workflow,
  FileText,
  Database,
  TestTube,
  History,
  Save,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
} from 'lucide-react';

function App() {
  const {
    activeTab,
    setActiveTab,
    botConfig,
    setBotConfig,
    isDirty,
    setIsDirty,
    isSaving,
    setIsSaving,
    nodes,
    edges,
    systemPrompt,
    requiredFields,
  } = useFlowState();

  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (botConfig) {
      setBotName(botConfig.name);
      setBotDescription(botConfig.description || '');
    }
  }, [botConfig]);

  const handleSave = async (status: 'draft' | 'published') => {
    if (!botName.trim()) {
      alert('Please enter a bot name');
      setShowSettings(true);
      return;
    }

    // Validate flow before saving
    try {
      const validation = await validateFlow({ nodes, edges });
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        alert(`Flow validation failed:\n${validation.errors.join('\n')}`);
        return;
      }
      setValidationErrors([]);
    } catch (error) {
      console.error('Validation failed:', error);
    }

    setIsSaving(true);
    try {
      const configData = {
        name: botName,
        description: botDescription,
        flow: { nodes, edges },
        systemPrompt,
        requiredFields,
        status,
      };

      let savedConfig;
      if (botConfig?.id) {
        savedConfig = await updateBotConfig(botConfig.id, configData);
      } else {
        savedConfig = await saveBotConfig(configData);
      }

      setBotConfig(savedConfig);
      setIsDirty(false);
      alert(`Bot configuration saved as ${status}!`);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save bot configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!botConfig?.id) {
      alert('Please save as draft first before publishing');
      return;
    }

    if (!confirm('Are you sure you want to publish this configuration? It will be available for production use.')) {
      return;
    }

    setIsSaving(true);
    try {
      const publishedConfig = await publishBotConfig(botConfig.id);
      setBotConfig(publishedConfig);
      setIsDirty(false);
      alert('Bot configuration published successfully!');
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish bot configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'flow', label: 'Flow Editor', icon: Workflow },
    { id: 'prompt', label: 'System Prompt', icon: FileText },
    { id: 'fields', label: 'Required Fields', icon: Database },
    { id: 'test', label: 'Test Console', icon: TestTube },
    { id: 'versions', label: 'Version History', icon: History },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bot Builder</h1>
                <p className="text-sm text-gray-500">
                  {botConfig?.name || 'No-Code Voicebot Configuration'}
                </p>
              </div>
            </div>

            {isDirty && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Unsaved changes
              </span>
            )}

            {botConfig?.status === 'published' && !isDirty && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Published
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>

            <button
              onClick={() => handleSave('draft')}
              disabled={isSaving || !isDirty}
              className="btn btn-secondary flex items-center gap-2"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Draft
            </button>

            <button
              onClick={handlePublish}
              disabled={isSaving || !botConfig?.id || botConfig.status === 'published'}
              className="btn btn-success flex items-center gap-2"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Publish
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Bot Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bot Name *
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => {
                    setBotName(e.target.value);
                    setIsDirty(true);
                  }}
                  className="input"
                  placeholder="e.g., Customer Support Bot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={botDescription}
                  onChange={(e) => {
                    setBotDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  className="input"
                  placeholder="Brief description of the bot's purpose"
                />
              </div>
            </div>
            {botConfig && (
              <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Version:</span>{' '}
                  <span className="font-medium text-gray-900">{botConfig.version || 1}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  <span className="font-medium text-gray-900 capitalize">{botConfig.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>{' '}
                  <span className="font-medium text-gray-900">
                    {botConfig.updatedAt
                      ? new Date(botConfig.updatedAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-2">Flow Validation Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`tab flex items-center gap-2 ${
                  activeTab === tab.id ? 'tab-active' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'flow' && <Canvas />}
        {activeTab === 'prompt' && <PromptEditor />}
        {activeTab === 'fields' && <SlotConfigurator />}
        {activeTab === 'test' && <TestConsole />}
        {activeTab === 'versions' && <VersionHistory />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-6">
            <span>Nodes: {nodes.length}</span>
            <span>Edges: {edges.length}</span>
            <span>Fields: {requiredFields.length}</span>
          </div>
          <div>
            Bot Builder v1.0.0 - No-Code Voicebot Platform
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
