import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3" style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Compass size={36} style={{ color: 'var(--text-tertiary)' }} />
      <div className="font-display font-bold" style={{ fontSize: 28, color: 'var(--text-primary)' }}>404</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>This page could not be found.</div>
      <Link to="/" className="btn-brand" style={{ padding: '8px 16px', fontSize: 14, marginTop: 8 }}>Back to dashboard</Link>
    </div>
  );
}
