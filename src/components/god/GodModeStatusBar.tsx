import React, { useState } from 'react';
import { Moon, Sun, Zap } from 'lucide-react';
import { usePlatformAuth } from '../../context/PlatformAuthContext';

// Persistent amber status bar inside the God Mode shell. Always visible.
// Includes a light/dark toggle (toggles the global html.dark class).
export function GodModeStatusBar() {
  const { admin, logout } = usePlatformAuth();
  const [start] = useState(() => new Date());
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  if (!admin) return null;

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const onAmberBtn = {
    background: 'rgba(0,0,0,0.15)', color: '#0a0a0a', borderRadius: 6,
    padding: '3px 7px', display: 'inline-flex', alignItems: 'center',
  } as const;

  return (
    <div className="flex items-center justify-between px-4" style={{ height: 36, background: 'var(--god-accent)', color: '#0a0a0a' }}>
      <div className="flex items-center gap-2" style={{ fontSize: 12, fontWeight: 600 }}>
        <Zap size={14} />
        <span>GOD MODE ACTIVE — {admin.fullName} · {admin.role} · All actions are logged and audited</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: 11, opacity: 0.85 }}>
          Session: {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button onClick={toggleTheme} style={onAmberBtn} title="Toggle light / dark" aria-label="Toggle theme">
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button onClick={logout} style={{ background: '#0a0a0a', color: '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
          End Session
        </button>
      </div>
    </div>
  );
}
export default GodModeStatusBar;
