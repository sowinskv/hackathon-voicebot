import { useState, useEffect } from 'react'
import ChatMode from './components/ChatMode'
import PipecatVoiceCall from './components/PipecatVoiceCall'

interface Flow {
  id: string;
  name: string;
  description?: string;
  status: string;
  language: string;
}

type Mode = 'voice' | 'chat';

function App() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inCall, setInCall] = useState(false)
  const [mode, setMode] = useState<Mode>('chat')
  useEffect(() => {
    fetchPublishedFlows();
  }, []);

  const fetchPublishedFlows = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows?status=published`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setFlows(result.data || []);

      // Auto-select first flow
      if (result.data && result.data.length > 0) {
        setSelectedFlowId(result.data[0].id);
      }
    } catch (err: any) {
      console.error('[APP] Error fetching flows:', err);
      setError(err.message || 'Nie udało się pobrać listy botów');
    } finally {
      setLoading(false);
    }
  };

  const startCall = () => {
    if (!selectedFlowId) {
      alert('Wybierz bota aby rozpocząć rozmowę');
      return;
    }
    setInCall(true);
  };

  const endCall = () => {
    setInCall(false);
  };

  if (inCall && selectedFlowId) {
    if (mode === 'chat') {
      return <ChatMode flowId={selectedFlowId} onEnd={endCall} />;
    } else {
      return <PipecatVoiceCall flowId={selectedFlowId} onEnd={endCall} />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie botów...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VoiceBot Demo</h1>
        <p className="text-gray-600 mb-8">Wybierz bota i rozpocznij rozmowę</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Flow Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wybierz bota
          </label>
          <select
            value={selectedFlowId || ''}
            onChange={(e) => setSelectedFlowId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>-- Wybierz bota --</option>
            {flows.map(flow => (
              <option key={flow.id} value={flow.id}>
                {flow.name}
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tryb rozmowy
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('chat')}
              className={`px-6 py-4 rounded-lg font-medium transition-all ${
                mode === 'chat'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              💬 Czat (Tekst)
            </button>
            <button
              onClick={() => setMode('voice')}
              className={`px-6 py-4 rounded-lg font-medium transition-all ${
                mode === 'voice'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🎤 Głos
            </button>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startCall}
          disabled={!selectedFlowId}
          className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {mode === 'chat' ? 'Rozpocznij czat' : 'Rozpocznij rozmowę'}
        </button>

        {selectedFlowId && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Wybrany bot:</strong> {flows.find(f => f.id === selectedFlowId)?.name}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Tryb:</strong> {mode === 'chat' ? 'Czat tekstowy' : 'Rozmowa głosowa'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
