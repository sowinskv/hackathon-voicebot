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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Logo - Top Left */}
      <div className="fixed top-8 left-8 z-50">
        <div className="flex items-center gap-3">
          <div className="accent-dot"></div>
          <h1 className="text-xl font-bold text-white tracking-tight">super kitties</h1>
        </div>
      </div>

      {/* Ambient glow particles */}
      <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-[glowFloat_6s_ease-in-out_infinite]" />
      <div className="fixed top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-[glowFloat_8s_ease-in-out_infinite_1s]" />
      <div className="fixed bottom-1/4 right-1/3 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-[glowFloat_10s_ease-in-out_infinite_2s]" />

      {/* Decorative Lines */}
      <div className="fixed top-0 left-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />
      <div className="fixed top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-white/[0.08] to-transparent" />

      {/* Left Side - Hero */}
      <div className="flex-1 flex items-center justify-center p-12 relative z-10">
        <div className="max-w-lg">
          <div className="mb-8">
            <div className="inline-block px-4 py-1.5 bg-white/[0.08] border border-white/10 rounded-full mb-6">
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">AI Voice Assistant</span>
            </div>
            <h2 className="text-6xl font-bold text-white mb-4 leading-tight">
              Start Your
              <br />
              <span className="bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
                Conversation
              </span>
            </h2>
            <p className="text-white/50 text-lg leading-relaxed">
              Connect with intelligent voice bots that understand and respond naturally
            </p>
          </div>

          {/* Stats/Features */}
          <div className="grid grid-cols-3 gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/[0.03] rounded-xl blur-sm" />
              <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">{flows.length}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Active Bots</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-white/[0.03] rounded-xl blur-sm" />
              <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">2</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Modes</div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-white/[0.03] rounded-xl blur-sm" />
              <div className="relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">24/7</div>
                <div className="text-xs text-white/50 uppercase tracking-wider">Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Control Panel */}
      <div className="w-[480px] flex items-center justify-center p-12 relative z-10">
        <div className="w-full">
          <div className="glass-card p-8">
            {error && (
              <div className="mb-6 bg-white/[0.08] border border-white/20 rounded-xl p-4">
                <p className="text-white/90 text-sm">{error}</p>
              </div>
            )}

            {/* Flow Selector */}
            <div className="mb-6">
              <label className="block text-[11px] font-semibold text-white/50 mb-3 uppercase tracking-widest">
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
            <div className="mb-8">
              <label className="block text-[11px] font-semibold text-white/50 mb-3 uppercase tracking-widest">
                Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode('chat')}
                  className={`relative px-6 py-4 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
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
                  className={`relative px-6 py-4 rounded-xl font-medium transition-all duration-300 overflow-hidden ${
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

            {/* Start Button */}
            <button
              onClick={startCall}
              disabled={!selectedFlowId}
              className="w-full btn btn-success text-base py-4 shadow-lg mb-6"
            >
              {mode === 'chat' ? 'Start Chat' : 'Start Call'}
            </button>

            {selectedFlowId && (
              <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/50">Selected:</span>
                  <span className="text-white/90 font-medium">{flows.find(f => f.id === selectedFlowId)?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Mode:</span>
                  <span className="text-white/90 font-medium">{mode === 'chat' ? 'Text chat' : 'Voice call'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
