import React from 'react';
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react';

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="tv-card" style={{ padding: 20 }}>
      <div className="skeleton" style={{ height: 12, width: '50%' }} />
      <div className="skeleton" style={{ height: 28, width: '70%', marginTop: 14 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 10, width: `${60 - i * 10}%`, marginTop: 10 }} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="tv-card-flat overflow-hidden">
      <div style={{ background: 'var(--bg-sunken)', height: 38, borderBottom: '1px solid var(--border)' }} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-3" style={{ height: 44, borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="skeleton" style={{ height: 12, flex: c === 0 ? 0.6 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} lines={3} />)}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', color: 'var(--status-danger-text)', borderRadius: 8 }}>
      <AlertTriangle size={16} />
      <span style={{ fontSize: 13, flex: 1 }}>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'var(--status-danger-text)', fontWeight: 500 }}>
          <RefreshCw size={13} /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16">
      <span style={{ color: 'var(--text-tertiary)' }}>{icon ?? <Inbox size={28} />}</span>
      <div className="font-display font-semibold" style={{ fontSize: 15, color: 'var(--text-primary)' }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function LoadingButton({ loading, children, className, disabled, ...props }: {
  loading?: boolean; children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} disabled={loading || disabled} className={className} style={{ ...props.style, opacity: loading || disabled ? 0.7 : 1 }}>
      <span className="inline-flex items-center justify-center gap-2">
        {loading && <Loader2 size={15} className="animate-spin" />}
        {children}
      </span>
    </button>
  );
}
