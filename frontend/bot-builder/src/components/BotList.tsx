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
      <div className="p-8 text-center">
        <p className="text-white font-semibold mb-2">Something went wrong</p>
        <p className="text-white/70 text-sm mb-6">{error}</p>
        <button
          onClick={fetchBots}
          className="px-6 py-3 bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/40 text-white rounded-xl font-medium transition-all duration-300"
        >
          {t('botList.error.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-16 py-8 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div style={{ position: 'relative', zIndex: 20 }}>
          <h1 className="text-6xl font-light mb-3 tracking-tight" style={{
            color: '#fff',
            WebkitTextFillColor: '#fff',
            opacity: 1,
            filter: 'none'
          }}>
            {t('botList.title')}
          </h1>
          <p className="text-lg font-light text-white/50" style={{
            color: 'rgba(255,255,255,0.5)',
            WebkitTextFillColor: 'rgba(255,255,255,0.5)',
            opacity: 1,
            filter: 'none'
          }}>
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
      <div className="flex gap-8 relative">
        {['all', 'draft', 'published', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`relative px-2 py-2 text-sm font-light transition-all duration-300 ${
              filter === f
                ? 'text-white'
                : 'text-white/40 hover:text-white/70'
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
          <h3 className="text-2xl font-light text-white mb-3">
            {filter === 'all' ? t('botList.empty') : `${t('botList.empty.filtered')} "${getStatusLabel(filter)}"`}
          </h3>
          <p className="text-white/50 text-base font-light mb-8">
            {t('botList.empty.cta')}
          </p>
          <button
            onClick={onCreateNew}
            className="btn btn-primary text-base px-8 py-4"
          >
            {t('botList.createFirst')}
          </button>
        </div>
      ) : (
        <div key={filter} className="relative">
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {bots.map((bot, index) => (
              <div
                key={bot.id}
                className="flex-shrink-0 w-72 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group animate-[fadeInUp_0.4s_ease-out_forwards]"
                style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
                onClick={() => onEditBot(bot)}
              >
                {/* Thumbnail */}
                <div className="relative h-44 bg-white/[0.02] flex items-center justify-center overflow-hidden">
                  {/* Circle with background showing through */}
                  <div className="relative w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden group-hover:border-white/30 transition-all duration-300">
                    {/* Unblurred background inside circle - different position for each bot */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'url(/bg.jpg)',
                        backgroundSize: '400%',
                        backgroundPosition: `${(index * 37) % 100}% ${(index * 53) % 100}%`
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-medium text-white text-base mb-2 truncate tracking-tight">{bot.name}</h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/90 font-medium">{bot.required_fields.length}</span>
                      <span className="text-[11px]">fields</span>
                    </div>
                    <span className="text-white/20">•</span>
                    <div className="text-[11px]">{new Date(bot.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                  </div>

                  {/* Status badge and Actions */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Status */}
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-light uppercase tracking-wider text-white/50">
                      <span className="w-1 h-1 rounded-full bg-white/50" />
                      {getStatusLabel(bot.status)}
                    </span>

                    {/* Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBot(bot);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(bot.id, bot.name);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white/80 transition-all duration-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BotList;
