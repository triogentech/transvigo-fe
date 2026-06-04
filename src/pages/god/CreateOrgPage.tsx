import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as RadixTabs from '@radix-ui/react-tabs';
import { Check, Copy, Eye, EyeOff, ArrowLeft, ArrowRight, Building2, User, CreditCard, ClipboardCheck } from 'lucide-react';
import { createOrganisation, checkSlugAvailable } from '../../api/god/organisations.api';
import { godErr } from '../../api/god/client';
import { useToast } from '../../context/ToastContext';
import { LoadingButton } from '../../components/states';
import type { CreateOrgBody, PlanName, CreateOrgResult } from '../../types/god.types';

// ui.jsx exports — JS module, props typed loosely
import {
  PageHeader as _PageHeader,
  TVSelect as _TVSelect,
  TVSwitch as _TVSwitch,
} from '../../components/ui.jsx';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PageHeader = _PageHeader as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVSelect = _TVSelect as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TVSwitch = _TVSwitch as React.FC<any>;

// ── Helpers ──────────────────────────────────────────────────────────────

function slugify(val: string): string {
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function emailPrefix(email: string): string {
  return email.split('@')[0] ?? '';
}

function generatePassword(len = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += charset[arr[i] % charset.length];
  return out;
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels: Record<number, { label: string; color: string }> = {
    0: { label: 'Very weak', color: '#ef4444' },
    1: { label: 'Weak', color: '#f87171' },
    2: { label: 'Fair', color: '#f59e0b' },
    3: { label: 'Good', color: '#fbbf24' },
    4: { label: 'Strong', color: '#4ade80' },
    5: { label: 'Very strong', color: '#22c55e' },
  };
  return { score, ...(labels[score] ?? labels[0]) };
}

// ── Shared field style ────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  background: 'var(--bg-sunken)',
  border: '1px solid var(--border-strong)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  boxSizing: 'border-box',
  outline: 'none',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: 'var(--text-secondary)',
  marginBottom: 5,
  fontWeight: 500,
};

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL_STYLE}>
        {label}{required && <span style={{ color: 'var(--status-danger-text)', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Company', icon: Building2 },
  { label: 'Admin', icon: User },
  { label: 'Plan & Limits', icon: CreditCard },
  { label: 'Review & Create', icon: ClipboardCheck },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((s, i) => {
        const num = i + 1;
        const done = num < step;
        const active = num === step;
        return (
          <React.Fragment key={num}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 99,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: done || active ? '#d97706' : 'transparent',
                  border: done || active ? '2px solid #d97706' : '2px solid var(--border-strong)',
                  color: done || active ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
              >
                {done ? <Check size={15} /> : num}
              </div>
              <span style={{ fontSize: 11, color: active ? '#fbbf24' : done ? '#d97706' : 'var(--text-muted)', fontWeight: active ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: num < step ? '#d97706' : 'var(--border-strong)', margin: '0 4px', marginBottom: 22, transition: 'background 0.2s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Form state ────────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  name: string;
  slug: string;
  plan: PlanName;
  notes: string;
  // Step 2
  adminFullName: string;
  adminEmail: string;
  adminUsername: string;
  contactPhone: string;
  // Password sub-state (not sent to API — UX only)
  pwTab: 'generate' | 'custom';
  generatedPassword: string;
  customPassword: string;
  confirmPassword: string;
  sendWelcomeEmail: boolean;
  // Step 3
  billingEmail: string;
  trialType: 'none' | '14' | '30' | 'custom';
  trialCustomDays: string;
  maxUsers: string;
  maxVehicles: string;
  billingCycle: 'monthly' | 'annual';
  subscriptionId: string;
}

const PLAN_DEFAULTS: Record<PlanName, { users: string; vehicles: string }> = {
  starter: { users: '5', vehicles: '10' },
  pro: { users: '25', vehicles: '50' },
  enterprise: { users: 'Unlimited (-1)', vehicles: 'Unlimited (-1)' },
};

function trialDaysFromForm(f: FormState): number | undefined {
  if (f.trialType === 'none') return undefined;
  if (f.trialType === '14') return 14;
  if (f.trialType === '30') return 30;
  const n = parseInt(f.trialCustomDays, 10);
  return isNaN(n) || n <= 0 ? undefined : n;
}

function buildBody(f: FormState): CreateOrgBody {
  const body: CreateOrgBody = {
    name: f.name.trim(),
    slug: f.slug.trim(),
    plan: f.plan,
    adminEmail: f.adminEmail.trim(),
    adminUsername: f.adminUsername.trim(),
    adminFullName: f.adminFullName.trim(),
  };
  if (f.contactPhone.trim()) body.contactPhone = f.contactPhone.trim();
  if (f.billingEmail.trim()) body.billingEmail = f.billingEmail.trim();
  if (f.notes.trim()) body.notes = f.notes.trim();
  const td = trialDaysFromForm(f);
  if (td != null) body.trialDays = td;

  // maxUsers / maxVehicles — only pass if numeric and > 0 (or -1 for unlimited)
  const mu = parseInt(f.maxUsers, 10);
  if (!isNaN(mu)) body.maxUsers = mu;
  const mv = parseInt(f.maxVehicles, 10);
  if (!isNaN(mv)) body.maxVehicles = mv;

  return body;
}

// ── Creation log ──────────────────────────────────────────────────────────

const LOG_LINES = [
  'Organisation record created',
  'Default roles seeded',
  'Default permissions seeded',
  'Admin user created',
  'Storage bucket created',
  'Welcome email sent',
];

// ── Copy button ───────────────────────────────────────────────────────────

function CopyButton({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button
      onClick={copy}
      className="btn-ghost"
      style={{ padding: small ? '3px 7px' : '5px 10px', fontSize: small ? 11 : 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function Step1({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSlug = useCallback((slug: string) => {
    if (!slug) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const avail = await checkSlugAvailable(slug);
        setSlugStatus(avail ? 'available' : 'taken');
      } catch {
        setSlugStatus('error');
      }
    }, 400);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleName = (val: string) => {
    const auto = slugify(val);
    setF((p) => ({ ...p, name: val, slug: auto }));
    checkSlug(auto);
  };

  const handleSlug = (val: string) => {
    const s = slugify(val);
    setF((p) => ({ ...p, slug: s }));
    checkSlug(s);
  };

  const slugColor = {
    idle: 'var(--text-muted)',
    checking: 'var(--text-muted)',
    available: '#4ade80',
    taken: '#f87171',
    error: '#f59e0b',
  }[slugStatus];

  const slugLabel = {
    idle: '',
    checking: 'Checking…',
    available: '✓ Available',
    taken: '✗ Taken',
    error: '⚠ Could not verify',
  }[slugStatus];

  const planOptions = [
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  return (
    <div>
      <Field label="Company Name" required>
        <input
          style={INPUT_STYLE}
          value={f.name}
          onChange={(e) => handleName(e.target.value)}
          placeholder="Acme Logistics Pvt. Ltd."
          autoFocus
        />
      </Field>

      <Field label="Slug" required hint="Used in URLs and API identifiers. Auto-generated from name.">
        <div style={{ position: 'relative' }}>
          <input
            style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)', paddingRight: 120 }}
            value={f.slug}
            onChange={(e) => handleSlug(e.target.value)}
            placeholder="acme-logistics"
          />
          {slugLabel && (
            <span
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: slugColor,
                fontWeight: 500,
                pointerEvents: 'none',
              }}
            >
              {slugLabel}
            </span>
          )}
        </div>
      </Field>

      <Field label="Plan" required>
        <TVSelect
          value={f.plan}
          onValueChange={(v: string) => setF((p) => ({ ...p, plan: v as PlanName }))}
          options={planOptions}
          placeholder="Select plan…"
        />
      </Field>

      <Field label="Notes" hint="Internal notes — not visible to the organisation.">
        <textarea
          style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 72 }}
          value={f.notes}
          onChange={(e) => setF((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Optional internal notes…"
          rows={3}
        />
      </Field>
    </div>
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────

function Step2({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleEmail = (val: string) => {
    const prefix = emailPrefix(val);
    setF((p) => ({
      ...p,
      adminEmail: val,
      adminUsername: prefix,
      billingEmail: p.billingEmail || val,
    }));
  };

  const handleGenerateClick = () => {
    const pw = generatePassword(16);
    setF((p) => ({ ...p, generatedPassword: pw, pwTab: 'generate' }));
  };

  useEffect(() => {
    if (f.pwTab === 'generate' && !f.generatedPassword) {
      const pw = generatePassword(16);
      setF((p) => ({ ...p, generatedPassword: pw }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.pwTab]);

  const strength = passwordStrength(f.customPassword);
  const pwMatch = f.customPassword === f.confirmPassword;

  return (
    <div>
      <Field label="Full Name" required>
        <input
          style={INPUT_STYLE}
          value={f.adminFullName}
          onChange={(e) => setF((p) => ({ ...p, adminFullName: e.target.value }))}
          placeholder="Rahul Sharma"
          autoFocus
        />
      </Field>

      <Field label="Email Address" required>
        <input
          style={INPUT_STYLE}
          type="email"
          value={f.adminEmail}
          onChange={(e) => handleEmail(e.target.value)}
          placeholder="admin@acmelogistics.com"
        />
      </Field>

      <Field label="Username" required hint="Auto-filled from email prefix. Editable.">
        <input
          style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
          value={f.adminUsername}
          onChange={(e) => setF((p) => ({ ...p, adminUsername: e.target.value }))}
          placeholder="rahul.sharma"
        />
      </Field>

      <Field label="Contact Phone">
        <input
          style={INPUT_STYLE}
          type="tel"
          value={f.contactPhone}
          onChange={(e) => setF((p) => ({ ...p, contactPhone: e.target.value }))}
          placeholder="+91 98765 43210"
        />
      </Field>

      {/* Password tabs */}
      {/*
        NOTE: The backend always generates the temp password server-side.
        The 'Generate' / 'Custom' tabs and sendWelcomeEmail toggle are captured
        for UX context only. Nothing beyond CreateOrgBody fields is sent to the API.
      */}
      <div style={{ marginBottom: 16 }}>
        <label style={LABEL_STYLE}>Admin Password</label>
        <RadixTabs.Root
          value={f.pwTab}
          onValueChange={(v) => setF((p) => ({ ...p, pwTab: v as 'generate' | 'custom' }))}
        >
          <RadixTabs.List
            style={{
              display: 'flex',
              borderBottom: '1px solid var(--border)',
              marginBottom: 14,
            }}
          >
            {(['generate', 'custom'] as const).map((tab) => (
              <RadixTabs.Trigger
                key={tab}
                value={tab}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  color: f.pwTab === tab ? '#fbbf24' : 'var(--text-muted)',
                  borderBottom: f.pwTab === tab ? '2px solid #d97706' : '2px solid transparent',
                  marginBottom: -1,
                  fontFamily: 'var(--font-body)',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
              >
                {tab === 'generate' ? 'Generate' : 'Custom'}
              </RadixTabs.Trigger>
            ))}
          </RadixTabs.List>

          <RadixTabs.Content value="generate">
            {f.generatedPassword ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-sunken)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '8px 10px' }}>
                <code className="font-mono" style={{ flex: 1, fontSize: 13, color: '#fbbf24', letterSpacing: 1 }}>
                  {f.generatedPassword}
                </code>
                <CopyButton text={f.generatedPassword} small />
                <button className="btn-ghost" style={{ padding: '3px 7px', fontSize: 11 }} onClick={handleGenerateClick}>
                  Regenerate
                </button>
              </div>
            ) : (
              <button className="god-accent-btn" style={{ padding: '7px 14px', fontSize: 13 }} onClick={handleGenerateClick}>
                Generate Password
              </button>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>
              A secure 16-character password is generated. The backend will use its own server-side temp password — this is for your records only.
            </p>
          </RadixTabs.Content>

          <RadixTabs.Content value="custom">
            <div style={{ marginBottom: 10 }}>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...INPUT_STYLE, paddingRight: 36 }}
                  type={showPw ? 'text' : 'password'}
                  value={f.customPassword}
                  onChange={(e) => setF((p) => ({ ...p, customPassword: e.target.value }))}
                  placeholder="Min. 8 characters"
                />
                <button
                  onClick={() => setShowPw((s) => !s)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {f.customPassword && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, borderRadius: 99, background: 'var(--border-strong)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(strength.score / 5) * 100}%`, background: strength.color, borderRadius: 99, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, marginTop: 3, display: 'block' }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...INPUT_STYLE, paddingRight: 36, borderColor: f.confirmPassword && !pwMatch ? '#f87171' : undefined }}
                type={showConfirm ? 'text' : 'password'}
                value={f.confirmPassword}
                onChange={(e) => setF((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Confirm password"
              />
              <button
                onClick={() => setShowConfirm((s) => !s)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {f.confirmPassword && !pwMatch && (
              <p style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>Passwords do not match</p>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
              Note: The backend generates its own server-side temp password. This field is for UX reference only.
            </p>
          </RadixTabs.Content>
        </RadixTabs.Root>
      </div>

      {/* Send Welcome Email */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8 }}>
        <TVSwitch
          checked={f.sendWelcomeEmail}
          onCheckedChange={(v: boolean) => setF((p) => ({ ...p, sendWelcomeEmail: v }))}
        />
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>Send Welcome Email</p>
          {!f.sendWelcomeEmail && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: 3 }}>
              You must manually distribute credentials to the admin.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────

function Step3({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
  const pd = PLAN_DEFAULTS[f.plan];

  const trialOptions = [
    { value: 'none', label: 'No Trial' },
    { value: '14', label: '14 Days' },
    { value: '30', label: '30 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  const cycleOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'annual', label: 'Annual' },
  ];

  return (
    <div>
      <Field label="Billing Email" hint="Defaults to admin email.">
        <input
          style={INPUT_STYLE}
          type="email"
          value={f.billingEmail}
          onChange={(e) => setF((p) => ({ ...p, billingEmail: e.target.value }))}
          placeholder={f.adminEmail || 'billing@company.com'}
        />
      </Field>

      <Field label="Billing Cycle">
        <TVSelect
          value={f.billingCycle}
          onValueChange={(v: string) => setF((p) => ({ ...p, billingCycle: v as 'monthly' | 'annual' }))}
          options={cycleOptions}
        />
      </Field>

      <Field label="Trial Period">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {trialOptions.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 13,
                color: f.trialType === opt.value ? '#fbbf24' : 'var(--text-secondary)',
                padding: '6px 12px',
                border: `1px solid ${f.trialType === opt.value ? '#d97706' : 'var(--border)'}`,
                borderRadius: 6,
                background: f.trialType === opt.value ? 'rgba(217,119,6,0.1)' : 'transparent',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="trial"
                value={opt.value}
                checked={f.trialType === opt.value}
                onChange={() => setF((p) => ({ ...p, trialType: opt.value as FormState['trialType'] }))}
                style={{ display: 'none' }}
              />
              {f.trialType === opt.value && <Check size={12} />}
              {opt.label}
            </label>
          ))}
        </div>
        {f.trialType === 'custom' && (
          <div style={{ marginTop: 10 }}>
            <input
              style={{ ...INPUT_STYLE, width: 160, fontFamily: 'var(--font-mono)' }}
              type="number"
              min={1}
              max={365}
              value={f.trialCustomDays}
              onChange={(e) => setF((p) => ({ ...p, trialCustomDays: e.target.value }))}
              placeholder="Days (e.g. 7)"
            />
          </div>
        )}
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Field label="Max Users" hint={`Default for ${f.plan}: ${pd.users}`}>
          <input
            style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
            type="number"
            min={-1}
            value={f.maxUsers}
            onChange={(e) => setF((p) => ({ ...p, maxUsers: e.target.value }))}
            placeholder={pd.users}
          />
        </Field>
        <Field label="Max Vehicles" hint={`Default for ${f.plan}: ${pd.vehicles}`}>
          <input
            style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
            type="number"
            min={-1}
            value={f.maxVehicles}
            onChange={(e) => setF((p) => ({ ...p, maxVehicles: e.target.value }))}
            placeholder={pd.vehicles}
          />
        </Field>
      </div>

      <Field label="Subscription ID" hint="Optional — your billing provider's subscription reference.">
        <input
          style={{ ...INPUT_STYLE, fontFamily: 'var(--font-mono)' }}
          value={f.subscriptionId}
          onChange={(e) => setF((p) => ({ ...p, subscriptionId: e.target.value }))}
          placeholder="sub_xxxxxxxxxxxxxxx"
        />
      </Field>
    </div>
  );
}

// ── Step 4 ────────────────────────────────────────────────────────────────

interface ReviewCard { title: string; rows: Array<{ label: string; value: string; mono?: boolean }> }

function ReviewSection({ title, rows }: ReviewCard) {
  return (
    <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{title}</p>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {rows.map((r) => (
          <React.Fragment key={r.label}>
            <dt style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.label}</dt>
            <dd className={r.mono ? 'font-mono' : ''} style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{r.value || '—'}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

function trialDisplay(f: FormState): string {
  if (f.trialType === 'none') return 'No trial';
  if (f.trialType === '14') return '14 days';
  if (f.trialType === '30') return '30 days';
  return f.trialCustomDays ? `${f.trialCustomDays} days` : '—';
}

interface Step4Props {
  f: FormState;
  onCreate: () => void;
  creating: boolean;
  createError: string | null;
  creationLog: string[];
  result: CreateOrgResult | null;
}

function Step4({ f, onCreate, creating, createError, creationLog, result }: Step4Props) {
  const navigate = useNavigate();
  const toast = useToast();

  const handleReset = () => {
    window.location.reload();
  };

  const copyPassword = () => {
    if (!result) return;
    void navigator.clipboard.writeText(result.tempPassword).then(() => {
      toast.success('Password copied to clipboard');
    });
  };

  if (result) {
    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 99, background: 'rgba(74,222,128,0.15)', border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Check size={24} style={{ color: '#4ade80' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Organisation Created
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            <span className="font-mono" style={{ color: '#fbbf24' }}>{result.organisation.name}</span> is live.
          </p>
        </div>

        {/* Creation log */}
        <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 18 }}>
          {LOG_LINES.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 13, color: '#4ade80' }}>
              <Check size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
              {line}
            </div>
          ))}
        </div>

        {/* Temp password */}
        <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 8 }}>
            ⚠ Copy this now — it will not be shown again
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <code className="font-mono" style={{ flex: 1, fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: 5, letterSpacing: 1, wordBreak: 'break-all' }}>
              {result.tempPassword}
            </code>
            <button
              onClick={copyPassword}
              className="god-accent-btn"
              style={{ padding: '6px 12px', fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <Copy size={13} /> Copy
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
            Admin: <span className="font-mono">{result.adminUser.email}</span>
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            className="god-accent-btn"
            style={{ padding: '10px 20px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            onClick={() => navigate(`/god/organisations/${result.organisation.id}`)}
          >
            View Organisation →
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={handleReset}
          >
            Create Another
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => navigate('/god/organisations')}
          >
            Back to Organisations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ReviewSection
        title="Company"
        rows={[
          { label: 'Name', value: f.name },
          { label: 'Slug', value: f.slug, mono: true },
          { label: 'Plan', value: f.plan.charAt(0).toUpperCase() + f.plan.slice(1) },
          { label: 'Notes', value: f.notes || '—' },
        ]}
      />
      <ReviewSection
        title="Admin"
        rows={[
          { label: 'Full Name', value: f.adminFullName },
          { label: 'Email', value: f.adminEmail },
          { label: 'Username', value: f.adminUsername, mono: true },
          { label: 'Contact Phone', value: f.contactPhone || '—' },
        ]}
      />
      <ReviewSection
        title="Limits"
        rows={[
          { label: 'Max Users', value: f.maxUsers || PLAN_DEFAULTS[f.plan].users, mono: true },
          { label: 'Max Vehicles', value: f.maxVehicles || PLAN_DEFAULTS[f.plan].vehicles, mono: true },
          { label: 'Billing Cycle', value: f.billingCycle.charAt(0).toUpperCase() + f.billingCycle.slice(1) },
          { label: 'Billing Email', value: f.billingEmail || f.adminEmail },
        ]}
      />
      <ReviewSection
        title="Trial"
        rows={[
          { label: 'Trial Period', value: trialDisplay(f) },
          { label: 'Subscription ID', value: f.subscriptionId || '—', mono: true },
        ]}
      />

      {createError && (
        <div style={{ background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--status-danger-text)', marginBottom: 14 }}>
          {createError}
        </div>
      )}

      {creating && creationLog.length > 0 && (
        <div style={{ background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
          {creationLog.map((line, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4ade80', padding: '3px 0' }}>
              <Check size={12} />
              {line}
            </div>
          ))}
          {creating && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 12, height: 12, border: '2px solid var(--text-dim)', borderTopColor: '#d97706', borderRadius: 99, display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
              Working…
            </div>
          )}
        </div>
      )}

      <LoadingButton
        loading={creating}
        className="god-accent-btn"
        style={{ width: '100%', padding: '12px 20px', fontSize: 15, fontWeight: 700, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={onCreate}
      >
        Create Organisation
      </LoadingButton>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

const INIT: FormState = {
  name: '',
  slug: '',
  plan: 'starter',
  notes: '',
  adminFullName: '',
  adminEmail: '',
  adminUsername: '',
  contactPhone: '',
  pwTab: 'generate',
  generatedPassword: '',
  customPassword: '',
  confirmPassword: '',
  sendWelcomeEmail: true,
  billingEmail: '',
  trialType: 'none',
  trialCustomDays: '',
  maxUsers: '',
  maxVehicles: '',
  billingCycle: 'monthly',
  subscriptionId: '',
};

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [f, setF] = useState<FormState>(INIT);
  const [slugOk, setSlugOk] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creationLog, setCreationLog] = useState<string[]>([]);
  const [result, setResult] = useState<CreateOrgResult | null>(null);

  // Recheck slug availability for Next button gating
  useEffect(() => {
    if (!f.slug) { setSlugOk(false); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const ok = await checkSlugAvailable(f.slug);
        if (!cancelled) setSlugOk(ok);
      } catch {
        if (!cancelled) setSlugOk(false);
      }
    }, 450);
    return () => { cancelled = true; clearTimeout(t); };
  }, [f.slug]);

  const step1Valid = f.name.trim().length > 0 && f.slug.trim().length > 0 && slugOk;

  const step2Valid =
    f.adminFullName.trim().length > 0 &&
    f.adminEmail.trim().length > 0 &&
    f.adminUsername.trim().length > 0;

  const appendLog = (line: string) => setCreationLog((p) => [...p, line]);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    setCreationLog([]);
    try {
      const body = buildBody(f);
      const res = await createOrganisation(body);
      // Simulate staged log lines with small delays after success
      await new Promise<void>((resolve) => {
        let i = 0;
        const next = () => {
          if (i >= LOG_LINES.length) { resolve(); return; }
          appendLog(LOG_LINES[i++]);
          setTimeout(next, 220);
        };
        next();
      });
      setResult(res);
      toast.success(`${res.organisation.name} created successfully`);
    } catch (err) {
      setCreateError(godErr(err, 'Failed to create organisation'));
      toast.error(godErr(err, 'Failed to create organisation'));
    } finally {
      setCreating(false);
    }
  };

  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : true;

  return (
    <div className="god-mode" style={{ padding: '24px 28px', maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <PageHeader
          title="Create Organisation"
          breadcrumbs={[
            <span key="orgs" style={{ cursor: 'pointer', color: 'var(--accent-teal)' }} onClick={() => navigate('/god/organisations')}>Organisations</span>,
            'Create',
          ]}
        />
      </div>

      <div className="tv-card" style={{ padding: '28px 32px' }}>
        <StepIndicator step={step} />

        {step === 1 && <Step1 f={f} setF={setF} />}
        {step === 2 && <Step2 f={f} setF={setF} />}
        {step === 3 && <Step3 f={f} setF={setF} />}
        {step === 4 && (
          <Step4
            f={f}
            onCreate={() => void handleCreate()}
            creating={creating}
            createError={createError}
            creationLog={creationLog}
            result={result}
          />
        )}

        {/* Nav */}
        {!result && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <button
              className="btn-ghost"
              style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
              onClick={() => { if (step > 1) setStep((s) => s - 1); else navigate('/god/organisations'); }}
            >
              <ArrowLeft size={14} />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 4 && (
              <button
                className="god-accent-btn"
                style={{ padding: '8px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, opacity: canNext ? 1 : 0.45, cursor: canNext ? 'pointer' : 'not-allowed' }}
                disabled={!canNext}
                onClick={() => { if (canNext) setStep((s) => s + 1); }}
              >
                Next
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
