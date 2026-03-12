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
    const selectedFlow = flows.find(f => f.id === selectedFlowId);
    const language = selectedFlow?.language || 'en';

    if (mode === 'chat') {
      return <ChatMode flowId={selectedFlowId} onEnd={endCall} />;
    } else {
      return <PipecatVoiceCall flowId={selectedFlowId} language={language} onEnd={endCall} />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white/40 mx-auto mb-4"></div>
          <p className="text-white/80">Loading bots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-8 bg-transparent">
      {/* Logo - Top Left */}
      <div className="fixed top-8 left-8 z-50">
        <div className="flex items-center gap-3">
          <div className="accent-dot"></div>
          <h1 className="text-xl font-light text-white tracking-tight">super kitties</h1>
        </div>
      </div>

      {/* Centered Card */}
      <div className="max-w-4xl w-full p-12 relative z-10">
        <div className="mb-12">
          <div className="inline-block px-4 py-1.5 bg-white/[0.08] border border-white/10 rounded-full mb-6">
            <span className="text-xs font-medium text-white uppercase tracking-wider">AI Voice Assistant</span>
          </div>
          <h2 className="text-7xl font-light text-white mb-6 leading-tight">
            Start Your
            <br />
            Conversation
          </h2>
          <p className="text-white text-xl leading-relaxed max-w-2xl">
            Connect with intelligent voice bots that understand and respond naturally
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Flow Selector */}
          <div>
            <label className="block text-[11px] font-light text-white/50 mb-3 uppercase tracking-widest">
              Select Bot
            </label>
            <select
              value={selectedFlowId || ''}
              onChange={(e) => setSelectedFlowId(e.target.value)}
              className="input"
            >
              <option value="" disabled>Select a bot</option>
              {flows.map(flow => (
                <option key={flow.id} value={flow.id}>
                  {flow.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-[11px] font-light text-white/50 mb-3 uppercase tracking-widest">
              Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('chat')}
                className={`relative px-4 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                  mode === 'chat'
                    ? 'bg-white/20 text-white border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.04] text-white/70 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {mode === 'chat' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                )}
                <span className="relative">Chat</span>
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`relative px-4 py-3 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
                  mode === 'voice'
                    ? 'bg-white/20 text-white border border-white/40 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                    : 'bg-white/[0.04] text-white/70 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                {mode === 'voice' && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                )}
                <span className="relative">Voice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startCall}
          disabled={!selectedFlowId}
          className="group relative mt-8 px-12 py-5 rounded-full font-medium text-lg overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)'
          }}
        >
          <span className="relative text-white flex items-center justify-center gap-3">
            {mode === 'chat' ? 'Start Chat' : 'Start Call'}
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
          <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {error && (
          <div className="mt-8 text-center">
            <h3 className="text-xl font-light text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-white/70 text-sm mb-6">{error}</p>
            <button
              onClick={fetchPublishedFlows}
              className="px-6 py-3 bg-transparent hover:bg-white/10 border border-white/20 hover:border-white/40 text-white rounded-xl font-medium transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
