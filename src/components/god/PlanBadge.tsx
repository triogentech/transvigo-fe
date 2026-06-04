import React from 'react';

const PLAN: Record<string, { label: string; bg: string; text: string; border: string }> = {
  starter: { label: 'Starter', bg: '#1a1a1a', text: '#a0a0a0', border: '#333333' },
  pro: { label: 'Pro', bg: 'rgba(217,119,6,0.12)', text: '#fcd34d', border: 'rgba(217,119,6,0.4)' },
  enterprise: { label: 'Enterprise', bg: 'rgba(250,204,21,0.14)', text: '#facc15', border: 'rgba(250,204,21,0.45)' },
};

export function PlanBadge({ plan }: { plan: string }) {
  const p = PLAN[plan] ?? PLAN.starter;
  return (
    <span className="inline-flex items-center font-body font-medium uppercase"
      style={{ background: p.bg, color: p.text, border: `1px solid ${p.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 10, letterSpacing: '0.05em' }}>
      {p.label}
    </span>
  );
}
export default PlanBadge;
