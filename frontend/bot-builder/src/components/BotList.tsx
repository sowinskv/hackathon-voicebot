import React, { useState, useEffect } from 'react';
import { Plus, Bot, Clock, CheckCircle, Archive, FileText, Trash2, Edit2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Flow {
  id: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  language: 'pl' | 'en';
  system_prompt: string;
  flow_definition: any;
  required_fields: any[];
  created_at: string;
  updated_at: string;
  published_at?: string;
}

interface Props {
  onCreateNew: () => void;
  onEditBot: (bot: Flow) => void;
}

export const BotList: React.FC<Props> = ({ onCreateNew, onEditBot }) => {
  const { t } = useLanguage();
  const [bots, setBots] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');

  useEffect(() => {
    fetchBots();
  }, [filter]);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError('');

      const url = filter === 'all'
        ? `${import.meta.env.VITE_API_URL}/api/flows`
        : `${import.meta.env.VITE_API_URL}/api/flows?status=${filter}`;

      console.log('[BOT-LIST] Fetching bots from:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch bots: ${response.status}`);
      }

      const result = await response.json();
      console.log('[BOT-LIST] Bots loaded:', result.data.length);

      setBots(result.data || []);
    } catch (err: any) {
      console.error('[BOT-LIST] Error:', err);
      setError(err.message || 'Nie udało się pobrać listy botów');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t('botList.delete.confirm')} "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete bot');
      }

      fetchBots();
    } catch (err: any) {
      alert(err.message || 'Error deleting');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-white" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-white/70" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-white/50" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return t('botList.filter.published');
      case 'draft':
        return t('botList.filter.draft');
      case 'archived':
        return t('botList.filter.archived');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto mb-4"></div>
          <p className="text-white/70">{t('botList.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-300/90 mb-4">{error}</p>
        <button
          onClick={fetchBots}
          className="btn btn-danger"
        >
          {t('botList.error.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-white mb-3">{t('botList.title')}</h1>
          <p className="text-white text-xl">
            {t('botList.subtitle')}
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="btn btn-primary flex items-center gap-2 text-base px-6 py-3 font-normal"
        >
          <Plus className="w-4 h-4" />
          {t('botList.createNew')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 relative">
        {['all', 'draft', 'published', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`relative px-4 py-2 text-sm font-normal transition-all duration-300 ${
              filter === f
                ? 'text-white'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            {f === 'all' ? t('botList.filter.all') : getStatusLabel(f)}
            {filter === f && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
            )}
          </button>
        ))}
      </div>

      {/* Bot List */}
      {bots.length === 0 ? (
        <div key={filter} className="p-16 text-center animate-[fadeIn_0.4s_ease-out]">
          <h3 className="text-2xl font-semibold text-white mb-3">
            {filter === 'all' ? t('botList.empty') : `${t('botList.empty.filtered')} "${getStatusLabel(filter)}"`}
          </h3>
          <p className="text-white/60 text-lg mb-8">
            {t('botList.empty.cta')}
          </p>
          <button
            onClick={onCreateNew}
            className="btn btn-primary text-lg px-8 py-4"
          >
            {t('botList.createFirst')}
          </button>
        </div>
      ) : (
        <div key={filter} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot, index) => (
            <div
              key={bot.id}
              className="card-hover-enhanced animate-[fadeInUp_0.4s_ease-out_forwards] group"
              style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
              onClick={() => onEditBot(bot)}
            >
              {/* Accent border */}
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent transition-all duration-300 group-hover:via-white/30" />

              {/* Header with icon and title */}
              <div className="relative flex items-start justify-between mb-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="relative mt-1">
                    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-white/70" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-xl mb-2 truncate leading-tight tracking-tight">{bot.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/5 text-white/60 border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                        <span className="w-1 h-1 rounded-full bg-white/60" />
                        {getStatusLabel(bot.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description with better spacing */}
              {bot.description && (
                <p className="relative text-sm text-white/60 mb-6 line-clamp-2 leading-relaxed">{bot.description}</p>
              )}

              {/* Metadata grid - more elegant layout */}
              <div className="relative grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{t('botList.fields')}</span>
                  <span className="text-lg font-semibold text-white/90">{bot.required_fields.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Updated</span>
                  <span className="text-xs text-white/70">{new Date(bot.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Action buttons - cleaner */}
              <div className="relative flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBot(bot);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('botList.edit')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bot.id, bot.name);
                  }}
                  className="px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 transition-all duration-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotList;
