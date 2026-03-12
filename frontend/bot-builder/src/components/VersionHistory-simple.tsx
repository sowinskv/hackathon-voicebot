import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { History, RotateCcw, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Modal } from './Modal';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [revertModal, setRevertModal] = useState<{
    isOpen: boolean;
    versionId: string | null;
  }>({ isOpen: false, versionId: null });

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

  const handleRevert = async () => {
    if (!botId || !revertModal.versionId) return;

    const versionId = revertModal.versionId;
    setRevertModal({ isOpen: false, versionId: null });
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

      await loadVersions();
      window.location.reload(); // Reload to see changes
    } catch (error) {
      console.error('[VERSION-HISTORY] Error reverting:', error);
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
      <p className="text-white/60 text-sm mb-12 -mt-4 ml-5">
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
        <div className="relative pt-16">
          {/* Stacked cards container with navigation */}
          <div className="relative flex items-center justify-center min-h-[450px]">
            <div className="relative w-full max-w-3xl" style={{ height: '400px' }}>
              {versions.map((version, idx) => {
                // Color variations for cards
                const colors = [
                  { gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)', border: 'rgba(139, 92, 246, 0.4)' },
                  { gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(249, 115, 22, 0.6) 100%)', border: 'rgba(249, 115, 22, 0.4)' },
                  { gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.6) 0%, rgba(6, 182, 212, 0.6) 100%)', border: 'rgba(6, 182, 212, 0.4)' },
                ];
                const colorScheme = colors[idx % 3];

                // Calculate position relative to active card
                const relativePosition = idx - activeIndex;
                const isActive = idx === activeIndex;

                // Calculate stacking transforms
                let scale, translateY, translateX, zIndex, opacity, pointerEvents;

                if (relativePosition === 0) {
                  // Active card - front and center
                  scale = 1;
                  translateY = 0;
                  translateX = 0;
                  zIndex = 100;
                  opacity = 1;
                  pointerEvents = 'auto';
                } else if (relativePosition > 0) {
                  // Cards behind active (older versions)
                  const stackPos = Math.min(relativePosition, 3);
                  scale = 1 - (stackPos * 0.03);
                  translateY = -(stackPos * 45); // Move up to show title
                  translateX = 0;
                  zIndex = 100 - relativePosition;
                  opacity = 0.8;
                  pointerEvents = 'auto';
                } else {
                  // Cards in front of active (hidden)
                  scale = 1 - (Math.abs(relativePosition) * 0.03);
                  translateY = Math.abs(relativePosition) * 45;
                  translateX = 0;
                  zIndex = 100 + relativePosition;
                  opacity = 0;
                  pointerEvents = 'none';
                }

                return (
                  <div
                    key={version.id}
                    onClick={() => relativePosition > 0 && setActiveIndex(idx)}
                    className={`absolute inset-x-0 top-0 rounded-3xl border-2 transition-all duration-500 ease-out ${
                      relativePosition > 0 ? 'cursor-pointer hover:scale-[1.01]' : ''
                    }`}
                    style={{
                      transform: `translateY(${translateY}px) translateX(${translateX}px) scale(${scale})`,
                      transformOrigin: 'top center',
                      zIndex,
                      opacity,
                      pointerEvents,
                      borderColor: colorScheme.border,
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    {/* Card header - always visible */}
                    <div className="px-6 py-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className={`font-bold tracking-tight ${
                            isActive ? 'text-xl text-white' : 'text-lg text-white/90'
                          }`}>
                            Version {version.version}
                          </h3>
                          {version.status === 'published' ? (
                            <span className="badge badge-success text-xs">Published</span>
                          ) : (
                            <span className="badge badge-gray text-xs">Draft</span>
                          )}
                          {idx === 0 && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 text-xs rounded-full border border-blue-400/30 font-medium">
                              Current
                            </span>
                          )}
                        </div>

                        {isActive && idx !== 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevertModal({ isOpen: true, versionId: version.id });
                            }}
                            disabled={isReverting === version.id}
                            className="btn btn-primary flex items-center gap-2 text-sm px-4 py-2"
                          >
                            {isReverting === version.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            Revert to this version
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card content - full details */}
                    <div className="px-6 py-5">
                      {/* Metadata */}
                      <div className="text-sm text-white/60 space-y-1 mb-5">
                        <p className="flex items-center gap-2">
                          <span className="text-white/40">•</span>
                          {formatDate(version.created_at)}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="text-white/40">•</span>
                          By {version.created_by}
                        </p>
                      </div>

                      {/* Stats grid */}
                      <div className="pb-5 border-b border-white/10">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Nodes</span>
                            <span className="text-2xl font-bold text-white">
                              {version.flow_definition?.nodes?.length || 0}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Edges</span>
                            <span className="text-2xl font-bold text-white">
                              {version.flow_definition?.edges?.length || 0}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Fields</span>
                            <span className="text-2xl font-bold text-white">
                              {version.required_fields?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fields list */}
                      {version.required_fields && version.required_fields.length > 0 && (
                        <div className="mt-5">
                          <p className="text-xs text-white/50 uppercase tracking-wider font-medium mb-3">Required Fields</p>
                          <div className="flex flex-wrap gap-2">
                            {version.required_fields.map((field: any, fieldIdx: number) => (
                              <span
                                key={fieldIdx}
                                className="px-3 py-1 bg-white/[0.06] text-white/80 text-xs rounded-full border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                              >
                                {field.name || field.label || 'Unknown'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Vertical navigation arrows on the right */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
              {/* Older (up arrow) */}
              <button
                onClick={() => setActiveIndex(Math.min(versions.length - 1, activeIndex + 1))}
                disabled={activeIndex === versions.length - 1}
                className="text-white/40 hover:text-white hover:-translate-y-1 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                title="Older version"
              >
                <ChevronUp className="w-8 h-8" strokeWidth={1.5} />
              </button>

              {/* Separator line */}
              <div className="w-px h-32 bg-white/20"></div>

              {/* Newer (down arrow) */}
              <button
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                className="text-white/40 hover:text-white hover:translate-y-1 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
                title="Newer version"
              >
                <ChevronDown className="w-8 h-8" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 px-4">
        <p className="text-sm text-white/60">
          <strong className="text-white/80">Note:</strong> Versions are automatically created when you save or publish changes to your bot's system prompt, flow, required fields, or status.
        </p>
      </div>

      {/* Revert confirmation modal */}
      <Modal
        isOpen={revertModal.isOpen}
        onClose={() => setRevertModal({ isOpen: false, versionId: null })}
        title="Revert to previous version"
        message="Are you sure you want to revert to this version? This will restore the configuration and reload the page."
        type="confirm"
        onConfirm={handleRevert}
        confirmText="Revert"
        cancelText="Cancel"
      />
    </div>
  );
};

export default VersionHistory;
