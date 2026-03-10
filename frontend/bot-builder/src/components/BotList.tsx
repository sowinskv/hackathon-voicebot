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
        return <CheckCircle className="w-4 h-4 text-ink" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-ink-medium" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-ink-light" />;
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c17b5c] mx-auto mb-4"></div>
          <p className="text-secondary">{t('botList.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[#c17b7b] mb-4">{error}</p>
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
          <p className="text-white/70 text-xl">
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
      <div className="flex gap-4">
        {['all', 'draft', 'published', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-sm font-normal transition-all ${
              filter === f
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white/90 border-b-2 border-transparent'
            }`}
          >
            {f === 'all' ? t('botList.filter.all') : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Bot List */}
      {bots.length === 0 ? (
        <div className="glass-card p-16 text-center border-2 border-dashed border-[#d4b69c]/40">
          <Bot className="w-20 h-20 text-secondary/40 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-primary mb-3">
            {filter === 'all' ? t('botList.empty') : `${t('botList.empty.filtered')} "${getStatusLabel(filter)}"`}
          </h3>
          <p className="text-secondary text-lg mb-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="card-hover"
              onClick={() => onEditBot(bot)}
            >
              <div className="flex items-start gap-4 mb-5">
                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#c17b5c] to-[#8b5c4c] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#c17b5c]/30">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(bot.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-primary text-lg mb-1 truncate">{bot.name}</h3>
                  <span className="text-xs text-muted uppercase tracking-wider font-medium">
                    {getStatusLabel(bot.status)}
                  </span>
                </div>
              </div>

              {bot.description && (
                <p className="text-sm text-secondary mb-5 line-clamp-2 leading-relaxed">{bot.description}</p>
              )}

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <FileText className="w-4 h-4" />
                  <span>{bot.required_fields.length} {t('botList.fields')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(bot.updated_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-5 border-t border-[#d4b69c]/30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditBot(bot);
                  }}
                  className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('botList.edit')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bot.id, bot.name);
                  }}
                  className="btn btn-secondary px-4"
                >
                  <Trash2 className="w-4 h-4" />
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
