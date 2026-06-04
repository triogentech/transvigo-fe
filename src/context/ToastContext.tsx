import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ToastKind } from '../api/client';

interface ToastItem { id: number; kind: ToastKind; message: string }
interface ToastApi {
  success: (m: string) => void;
  error: (m: string) => void;
  warning: (m: string) => void;
  info: (m: string) => void;
}

const ToastCtx = createContext<ToastApi>({ success() {}, error() {}, warning() {}, info() {} });
export function useToast(): ToastApi { return useContext(ToastCtx); }

const KIND_STYLE: Record<ToastKind, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  success: { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)', border: 'var(--status-success-border)', icon: <CheckCircle2 size={16} /> },
  error: { bg: 'var(--status-danger-bg)', text: 'var(--status-danger-text)', border: 'var(--status-danger-border)', icon: <XCircle size={16} /> },
  warning: { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)', border: 'var(--status-warning-border)', icon: <AlertTriangle size={16} /> },
  info: { bg: 'var(--status-info-bg)', text: 'var(--status-info-text)', border: 'var(--status-info-border)', icon: <Info size={16} /> },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
  }, []);

  const api = useRef<ToastApi>({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    warning: (m) => push('warning', m),
    info: (m) => push('info', m),
  });

  // Bridge: Axios client emits window 'app:toast' events.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ kind: ToastKind; message: string }>).detail;
      if (detail) push(detail.kind, detail.message);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, [push]);

  return (
    <ToastCtx.Provider value={api.current}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((t) => {
          const s = KIND_STYLE[t.kind];
          return (
            <Toast.Root
              key={t.id}
              className="toast-root flex items-center gap-2.5 px-4 py-3"
              style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}`, borderRadius: 8 }}
              onOpenChange={(open) => { if (!open) setToasts((arr) => arr.filter((x) => x.id !== t.id)); }}
            >
              <span style={{ color: s.text }}>{s.icon}</span>
              <Toast.Title style={{ fontSize: 13, fontWeight: 500 }}>{t.message}</Toast.Title>
            </Toast.Root>
          );
        })}
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 z-[100]" style={{ width: 360, maxWidth: '100vw' }} />
      </Toast.Provider>
    </ToastCtx.Provider>
  );
}
