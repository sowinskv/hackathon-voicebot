import React, { useState, useEffect } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { getBotVersions, revertToVersion, BotVersion } from '@/services/api';
import { History, RotateCcw, CheckCircle, FileText, Loader } from 'lucide-react';
import { format } from 'date-fns';

export const VersionHistory: React.FC = () => {
  const { botConfig, setBotConfig } = useFlowState();
  const [versions, setVersions] = useState<BotVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReverting, setIsReverting] = useState<string | null>(null);

  useEffect(() => {
    if (botConfig?.id) {
      loadVersions();
    }
  }, [botConfig?.id]);

  const loadVersions = async () => {
    if (!botConfig?.id) return;

    setIsLoading(true);
    try {
      const versionList = await getBotVersions(botConfig.id);
      setVersions(versionList);
    } catch (error) {
      console.error('Failed to load versions:', error);
      alert('Failed to load version history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (versionId: string) => {
    if (!botConfig?.id) return;

    if (!confirm('Are you sure you want to revert to this version? This will create a new version with this configuration.')) {
      return;
    }

    setIsReverting(versionId);
    try {
      const revertedConfig = await revertToVersion(botConfig.id, versionId);
      setBotConfig(revertedConfig);
      await loadVersions();
      alert('Successfully reverted to previous version!');
    } catch (error) {
      console.error('Failed to revert version:', error);
      alert('Failed to revert to this version. Please try again.');
    } finally {
      setIsReverting(null);
    }
  };

  if (!botConfig?.id) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <History className="w-16 h-16 text-gray-300 mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          No Bot Configuration
        </h4>
        <p className="text-gray-600 max-w-md">
          Save your bot configuration first to view and manage version history.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Version History</h3>
              <p className="text-sm text-gray-500">
                View and manage configuration versions
              </p>
            </div>
          </div>
          <button
            onClick={loadVersions}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="mb-2">No versions yet</p>
            <p className="text-sm">
              Versions will appear here after you publish your configuration
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`card p-4 ${
                  version.version === botConfig.version
                    ? 'ring-2 ring-primary-500 bg-primary-50'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        Version {version.version}
                      </h4>
                      {version.status === 'published' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          Draft
                        </span>
                      )}
                      {version.version === botConfig.version && (
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        Created: {format(new Date(version.createdAt), 'PPpp')}
                      </p>
                      <p>By: {version.createdBy}</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Nodes:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {version.flow.nodes.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Edges:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {version.flow.edges.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Fields:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {version.requiredFields.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {version.requiredFields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-1">Required Fields:</p>
                        <div className="flex flex-wrap gap-1">
                          {version.requiredFields.map((field, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {field.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {version.version !== botConfig.version && (
                    <button
                      onClick={() => handleRevert(version.id)}
                      disabled={isReverting === version.id}
                      className="btn btn-secondary ml-4 flex items-center gap-2"
                    >
                      {isReverting === version.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
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
      </div>

      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Reverting to a previous version will create a new
          version with that configuration. The current version will remain in the history.
        </p>
      </div>
    </div>
  );
};
