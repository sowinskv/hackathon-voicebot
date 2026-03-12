import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SessionList } from './pages/SessionList';
import { SessionDetail } from './pages/SessionDetail';
import { NotificationBell } from './components/NotificationBell';
import { useWebSocket, WebSocketMessage } from './hooks/useWebSocket';
import { api } from './services/api';

// Create a context for metrics updates
export const MetricsContext = createContext<{
  refreshMetrics: () => Promise<void>;
}>({
  refreshMetrics: async () => {}
});

function Navigation() {
  const location = useLocation();
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        // Near top - always show
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down - hide
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY - 20) {
        // Scrolling up with momentum - show
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      isHeaderVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16">
          {/* Left - Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3">
              <div className="accent-dot"></div>
              <h1 className="text-xl font-bold text-white tracking-tight">super kitties</h1>
            </Link>
          </div>

          {/* Center - Navigation */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex gap-8 items-center">
            <Link
              to="/"
              className="relative px-2 py-2 text-base font-semibold transition-all duration-300"
            >
              <span className={isActive('/') ? 'text-white' : 'text-white/70 hover:text-white/95'}>
                Dashboard
              </span>
              {isActive('/') && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
              )}
            </Link>
            <Link
              to="/sessions"
              className="relative px-2 py-2 text-base font-semibold transition-all duration-300"
            >
              <span className={isActive('/sessions') ? 'text-white' : 'text-white/70 hover:text-white/95'}>
                Sessions
              </span>
              {isActive('/sessions') && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white animate-[slideIn_0.3s_ease-out]" />
              )}
            </Link>
          </div>

          {/* Right - User info */}
          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="text-right pl-6 border-l border-white/10">
              <p className="text-sm font-light text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.25)' }}>Agent User</p>
              <p className="text-xs text-white/60 font-light" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>Consultant</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      {/* Ambient glow particles */}
      <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-[glowFloat_6s_ease-in-out_infinite] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-[glowFloat_8s_ease-in-out_infinite_1s] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-[glowFloat_10s_ease-in-out_infinite_2s] pointer-events-none" />

      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {children}
      </main>
      <footer className="border-t border-white/[0.04] mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-white/30 tracking-wide">
            Agent Console - Voice AI Management System
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  // Implement metrics refresh function
  const [lastMetricsUpdate, setLastMetricsUpdate] = useState(Date.now());

  // Handle WebSocket messages to trigger metrics updates
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('WebSocket message received:', message.type);
    // When a session is updated, created, or completed, refresh metrics
    if (['session_update', 'new_escalation', 'session_completed'].includes(message.type)) {
      refreshMetrics();
    }
  };

  const { connected } = useWebSocket(handleWebSocketMessage);

  // Function to refresh metrics that can be called from anywhere in the app
  const refreshMetrics = async () => {
    console.log('Refreshing metrics due to session change');
    // We don't actually need to do anything here since the Dashboard
    // component already periodically refreshes metrics. We just need to
    // update the timestamp to trigger re-renders when necessary.
    setLastMetricsUpdate(Date.now());
  };

  // Log WebSocket connection status
  useEffect(() => {
    console.log('WebSocket connected:', connected);
  }, [connected]);

  return (
    <MetricsContext.Provider value={{ refreshMetrics }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard key={lastMetricsUpdate} />} />
            <Route path="/sessions" element={<SessionList />} />
            <Route path="/sessions/:sessionId" element={<SessionDetail />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </MetricsContext.Provider>
  );
}

export default App;
