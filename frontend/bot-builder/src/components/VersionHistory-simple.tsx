import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { History, RotateCcw, Loader2 } from 'lucide-react';

interface VersionHistoryProps {
  botId: string | null;
}

interface BotVersion {
  id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  name: string;
  description?: string;
  flow_definition: any;
  required_fields: any[];
  system_prompt: string;
  created_at: string;
  created_by: string;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ botId }) => {
  const { t } = useLanguage();
  const [versions, setVersions] = useState<BotVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReverting, setIsReverting] = useState<string | null>(null);

  useEffect(() => {
    if (botId) {
      loadVersions();
    }
  }, [botId]);

  const loadVersions = async () => {
    if (!botId) return;

    setIsLoading(true);
    try {
      console.log('[VERSION-HISTORY] Loading versions for bot:', botId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${botId}/versions`);

      if (!response.ok) {
        throw new Error(`Failed to fetch versions: ${response.status}`);
      }

      const result = await response.json();
      console.log('[VERSION-HISTORY] Loaded versions:', result);

      const versionList = result.data || result;
      setVersions(versionList);
    } catch (error) {
      console.error('[VERSION-HISTORY] Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!botId) return;

    if (!window.confirm('Are you sure you want to revert to this version? This will restore the configuration from this version.')) {
      return;
    }

    setIsReverting(versionId);
    try {
      console.log('[VERSION-HISTORY] Reverting to version:', versionId);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${botId}/revert/${versionId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to revert: ${response.status}`);
      }

      const result = await response.json();
      console.log('[VERSION-HISTORY] Reverted successfully:', result);

      alert('Successfully reverted! Please refresh the page to see the changes.');
      await loadVersions();
    } catch (error) {
      console.error('[VERSION-HISTORY] Error reverting:', error);
      alert('Failed to revert to this version. Please try again.');
    } finally {
      setIsReverting(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!botId) {
    return (
      <div className="max-w-5xl mx-auto py-4 space-y-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-1 h-1 rounded-full bg-white/60"></div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">{t('versions.title')}</h2>
        </div>
        <p className="text-white/60 text-sm mb-6 -mt-4 ml-5">
          {t('versions.subtitle')}
        </p>

        <div className="relative overflow-visible p-12 text-center">
          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/30 rounded-full blur-xl animate-[glowFloat_3s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/20 rounded-full blur-2xl animate-[glowFloat_4s_ease-in-out_infinite_0.5s]" />

          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-white/40 mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2 font-medium">Save your bot first</p>
            <p className="text-sm text-white/60">
              Version history will be available after you save your bot configuration
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-1 h-1 rounded-full bg-white/60"></div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">{t('versions.title')}</h2>
        </div>
        <button
          onClick={loadVersions}
          disabled={isLoading}
          className="btn btn-secondary flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <History className="w-4 h-4" />
          )}
          Refresh
        </button>
      </div>
      <p className="text-white/60 text-sm mb-6 -mt-4 ml-5">
        {versions.length} version{versions.length !== 1 ? 's' : ''} saved
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
        </div>
      ) : versions.length === 0 ? (
        <div className="relative overflow-visible p-12 text-center">
          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/30 rounded-full blur-xl animate-[glowFloat_3s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-1/4 w-12 h-12 bg-white/20 rounded-full blur-2xl animate-[glowFloat_4s_ease-in-out_infinite_0.5s]" />

          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-white/40 mx-auto mb-4"></div>
            <p className="text-white text-lg mb-2 font-medium">{t('versions.empty')}</p>
            <p className="text-sm text-white/60">
              Make changes to your bot and save to create version history
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version, idx) => (
            <div
              key={version.id}
              className="relative group bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/10 rounded-xl p-6 transition-all duration-300"
            >
              <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start justify-between gap-4 pl-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white text-lg tracking-tight">
                      Version {version.version}
                    </h3>
                    {version.status === 'published' ? (
                      <span className="badge badge-success">Published</span>
                    ) : (
                      <span className="badge badge-gray">Draft</span>
                    )}
                    {idx === 0 && (
                      <span className="badge badge-info">Current</span>
                    )}
                  </div>

                  <div className="text-sm text-white/60 space-y-1 mb-3">
                    <p>Created: {formatDate(version.created_at)}</p>
                    <p>By: {version.created_by}</p>
                  </div>

                  <div className="pt-3 border-t border-white/5">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-white/50">Nodes:</span>{' '}
                        <span className="font-medium text-white">
                          {version.flow_definition?.nodes?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Edges:</span>{' '}
                        <span className="font-medium text-white">
                          {version.flow_definition?.edges?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">Fields:</span>{' '}
                        <span className="font-medium text-white">
                          {version.required_fields?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {version.required_fields && version.required_fields.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-xs text-white/50 mb-2">Required Fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {version.required_fields.map((field: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-white/5 text-white/70 text-xs rounded border border-white/10"
                          >
                            {field.name || field.label || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {idx !== 0 && (
                  <button
                    onClick={() => handleRevert(version.id)}
                    disabled={isReverting === version.id}
                    className="btn btn-secondary flex items-center gap-2 flex-shrink-0"
                  >
                    {isReverting === version.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    Revert
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4">
        <p className="text-sm text-white/60">
          <strong className="text-white/80">Note:</strong> Versions are automatically created when you save or publish changes to your bot's system prompt, flow, required fields, or status.
        </p>
      </div>
    </div>
  );
};

export default VersionHistory;
