import React, { useState, useEffect } from 'react';
import { Plus, Bot, Clock, CheckCircle, Archive, FileText, Trash2, Edit2 } from 'lucide-react';

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
    if (!confirm(`Czy na pewno chcesz usunąć bota "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Nie udało się usunąć bota');
      }

      fetchBots();
    } catch (err: any) {
      alert(err.message || 'Błąd podczas usuwania');
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
        return 'Opublikowany';
      case 'draft':
        return 'Szkic';
      case 'archived':
        return 'Zarchiwizowany';
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink mx-auto mb-4"></div>
          <p className="text-ink-medium">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 text-center border-danger">
        <p className="text-danger">{error}</p>
        <button
          onClick={fetchBots}
          className="mt-4 px-4 py-2 bg-danger text-white rounded-lg hover:opacity-90"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Moje Voiceboty</h1>
          <p className="text-ink-medium mt-1">
            Zarządzaj wszystkimi swoimi botami głosowymi w jednym miejscu
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-3 bg-ink text-white rounded-lg hover:opacity-80 transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Utwórz nowego bota
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'draft', 'published', 'archived'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-ink text-white'
                : 'bg-white border border-border-light text-ink hover:bg-cream'
            }`}
          >
            {f === 'all' ? 'Wszystkie' : getStatusLabel(f)}
          </button>
        ))}
      </div>

      {/* Bot List */}
      {bots.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-border-light p-12 text-center">
          <Bot className="w-16 h-16 text-ink-light mx-auto mb-4" />
          <h3 className="text-xl font-medium text-ink mb-2">
            {filter === 'all' ? 'Nie masz jeszcze żadnych botów' : `Brak botów w statusie "${getStatusLabel(filter)}"`}
          </h3>
          <p className="text-ink-medium mb-6">
            Zacznij od stworzenia swojego pierwszego voicebota
          </p>
          <button
            onClick={onCreateNew}
            className="px-6 py-3 bg-ink text-white rounded-lg hover:opacity-80 transition font-medium"
          >
            Utwórz pierwszego bota
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <div
              key={bot.id}
              className="card p-6 card-hover cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-ink rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink truncate">{bot.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(bot.status)}
                      <span className="text-xs text-ink-medium">{getStatusLabel(bot.status)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {bot.description && (
                <p className="text-sm text-ink-medium mb-4 line-clamp-2">{bot.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-ink-light">
                  <FileText className="w-4 h-4" />
                  <span>{bot.required_fields.length} pól</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ink-light">
                  <Clock className="w-4 h-4" />
                  <span>Zaktualizowano {formatDate(bot.updated_at)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border-light">
                <button
                  onClick={() => onEditBot(bot)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-ink text-white rounded-lg hover:bg-ink-medium transition text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edytuj
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bot.id, bot.name);
                  }}
                  className="px-4 py-2 border border-border-light text-ink rounded-lg hover:bg-danger hover:border-danger hover:text-white transition text-sm"
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
