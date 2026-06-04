import React from 'react';
import { Search } from 'lucide-react';

/** Shared search box for list pages. Controlled; client-side filtering. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  width = 280,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
}) {
  return (
    <div style={{ position: 'relative', width, maxWidth: '100%' }}>
      <Search
        size={14}
        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
      />
      <input
        className="tv-input"
        style={{ paddingLeft: 30, width: '100%' }}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
