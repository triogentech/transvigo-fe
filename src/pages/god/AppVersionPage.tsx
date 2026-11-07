import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { godErr } from '../../api/god/client';
import {
  getAppVersionPolicies,
  saveAppVersionPolicy,
  type AppVersionPolicy,
  type AppVersionPolicyInput,
} from '../../api/god/app-config.api';
import { ErrorBanner, LoadingButton, SkeletonCard } from '../../components/states';
import { useToast } from '../../context/ToastContext';
import { usePlatformAuth } from '../../hooks/god/usePlatformAuth';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.transvigo.driver';
const SEMVER = /^\d+\.\d+\.\d+$/;

const INPUT: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13, background: 'var(--bg-sunken)',
  border: '1px solid var(--border-strong)', borderRadius: 6, color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none',
};

const EMPTY: AppVersionPolicyInput = {
  app: 'driver', platform: 'android', latestVersion: '', latestVersionCode: 0,
  minimumSupportedVersion: '', minimumSupportedVersionCode: 0, enforceMinimum: false,
  updateMessage: '', releaseNotes: [], storeUrl: PLAY_URL, maintenanceMode: false, maintenanceMessage: '',
};

function cmp(a: string, b: string): number {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

/** Mirrors the server's rules; the server remains the authority. */
function validate(f: AppVersionPolicyInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (!SEMVER.test(f.latestVersion)) e.latestVersion = 'Use MAJOR.MINOR.PATCH, e.g. 1.2.0';
  if (!SEMVER.test(f.minimumSupportedVersion)) e.minimumSupportedVersion = 'Use MAJOR.MINOR.PATCH, e.g. 1.1.0';
  if (!Number.isInteger(f.latestVersionCode) || f.latestVersionCode < 1) e.latestVersionCode = 'Whole number ≥ 1 (the Play Console versionCode)';
  if (!Number.isInteger(f.minimumSupportedVersionCode) || f.minimumSupportedVersionCode < 1) e.minimumSupportedVersionCode = 'Whole number ≥ 1';
  if (!e.minimumSupportedVersionCode && !e.latestVersionCode && f.minimumSupportedVersionCode > f.latestVersionCode)
    e.minimumSupportedVersionCode = 'Minimum versionCode cannot exceed the latest versionCode';
  if (!e.minimumSupportedVersion && !e.latestVersion && cmp(f.minimumSupportedVersion, f.latestVersion) > 0)
    e.minimumSupportedVersion = 'Minimum version cannot exceed the latest version';
  if (!f.storeUrl.startsWith('https://play.google.com/')) e.storeUrl = 'Must be a https://play.google.com/ URL';
  if ((f.updateMessage ?? '').length > 300) e.updateMessage = 'Max 300 characters';
  if ((f.maintenanceMessage ?? '').length > 300) e.maintenanceMessage = 'Max 300 characters';
  if (f.releaseNotes.length > 10) e.releaseNotes = 'Max 10 lines';
  if (f.releaseNotes.some((n) => n.length > 200)) e.releaseNotes = 'Each line max 200 characters';
  return e;
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>{label}</div>
      {children}
      {hint && !error && <div style={{ fontSize: 11, marginTop: 3, color: 'var(--text-tertiary)' }}>{hint}</div>}
      {error && <div role="alert" style={{ fontSize: 11, marginTop: 3, color: 'var(--status-danger-text)' }}>{error}</div>}
    </label>
  );
}

function outcome(code: number, f: AppVersionPolicyInput): string {
  if (code >= f.latestVersionCode) return 'No update';
  if (f.enforceMinimum && code < f.minimumSupportedVersionCode) return 'Mandatory update';
  return 'Optional update';
}

export default function AppVersionPage() {
  const toast = useToast();
  const { isSuperAdmin } = usePlatformAuth() as { isSuperAdmin: boolean };
  const [current, setCurrent] = useState<AppVersionPolicy | null>(null);
  const [form, setForm] = useState<AppVersionPolicyInput>(EMPTY);
  const [notesText, setNotesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await getAppVersionPolicies();
      const row = rows.find((r) => r.app === 'driver' && r.platform === 'android') ?? null;
      setCurrent(row);
      if (row) {
        const { id: _id, updatedByEmail: _u, updatedAt: _t, ...rest } = row;
        setForm({ ...rest, updateMessage: rest.updateMessage ?? '', maintenanceMessage: rest.maintenanceMessage ?? '' });
        setNotesText(row.releaseNotes.join('\n'));
      }
    } catch (err) {
      setError(godErr(err, 'Failed to load version policy'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const payload: AppVersionPolicyInput = useMemo(() => ({
    ...form,
    releaseNotes: notesText.split('\n').map((l) => l.trim()).filter(Boolean),
    updateMessage: form.updateMessage?.trim() || null,
    maintenanceMessage: form.maintenanceMessage?.trim() || null,
  }), [form, notesText]);
  const errors = useMemo(() => validate(payload), [payload]);
  const hasErrors = Object.keys(errors).length > 0;
  const risky = payload.maintenanceMode || (payload.enforceMinimum && (!current || !current.enforceMinimum || payload.minimumSupportedVersionCode !== current.minimumSupportedVersionCode));

  const set = <K extends keyof AppVersionPolicyInput>(k: K, v: AppVersionPolicyInput[K]) => setForm((p) => ({ ...p, [k]: v }));
  const num = (v: string): number => (v === '' ? 0 : Number(v));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveAppVersionPolicy(payload);
      setCurrent(saved);
      toast.success('App version policy saved');
      setConfirming(false);
    } catch (err) {
      toast.error(godErr(err, 'Could not save policy'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonCard lines={4} />;
  if (error) return <ErrorBanner message={error} onRetry={load} />;

  const matrixCodes = Array.from(new Set([payload.latestVersionCode, payload.latestVersionCode - 1, payload.minimumSupportedVersionCode, payload.minimumSupportedVersionCode - 1].filter((c) => c >= 1))).sort((a, b) => b - a);

  return (
    <div style={{ maxWidth: 880 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>App Version Management</h1>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        TransVigo Driver · Android (<code>com.transvigo.driver</code>). Applies to <b>all organisations</b>.
        Uploading a build to Google Play does not change this policy — update it here after the release is live.
      </p>
      {!isSuperAdmin && <div className="tv-card" style={{ padding: 12, marginBottom: 12, fontSize: 13 }}>Read-only: only a Super Admin can change this policy.</div>}

      <div className="tv-card" style={{ padding: 16, marginBottom: 16, fontSize: 13 }}>
        {current ? (
          <>
            <b>Published:</b> v{current.latestVersion} (code {current.latestVersionCode}) · <b>Minimum:</b> v{current.minimumSupportedVersion} (code {current.minimumSupportedVersionCode}) ·{' '}
            <b>Mandatory updates:</b> {current.enforceMinimum ? 'ON' : 'off'} · <b>Maintenance:</b> {current.maintenanceMode ? 'ON' : 'off'}
            <div style={{ color: 'var(--text-tertiary)', marginTop: 4 }}>
              Last changed {new Date(current.updatedAt).toLocaleString()} by {current.updatedByEmail ?? 'unknown'}
            </div>
          </>
        ) : <>No policy published yet — drivers are never prompted or blocked until one is saved.</>}
      </div>

      <fieldset disabled={!isSuperAdmin || saving} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="tv-card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <Field label="Latest version" error={errors.latestVersion}><input style={INPUT} value={form.latestVersion} onChange={(e) => set('latestVersion', e.target.value)} placeholder="1.2.0" /></Field>
            <Field label="Latest versionCode" error={errors.latestVersionCode} hint="Integer shown in Play Console"><input style={INPUT} inputMode="numeric" value={form.latestVersionCode || ''} onChange={(e) => set('latestVersionCode', num(e.target.value))} /></Field>
            <Field label="Minimum supported version" error={errors.minimumSupportedVersion}><input style={INPUT} value={form.minimumSupportedVersion} onChange={(e) => set('minimumSupportedVersion', e.target.value)} placeholder="1.1.0" /></Field>
            <Field label="Minimum versionCode" error={errors.minimumSupportedVersionCode}><input style={INPUT} inputMode="numeric" value={form.minimumSupportedVersionCode || ''} onChange={(e) => set('minimumSupportedVersionCode', num(e.target.value))} /></Field>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, margin: '4px 0 14px' }}>
            <input type="checkbox" checked={form.enforceMinimum} onChange={(e) => set('enforceMinimum', e.target.checked)} />
            <span><b>Enforce minimum version</b> — drivers below it must update (they can still finish an active trip)</span>
          </label>
          <Field label="Update message" error={errors.updateMessage}><input style={INPUT} value={form.updateMessage ?? ''} onChange={(e) => set('updateMessage', e.target.value)} placeholder="A new version of TransVigo Driver is available." /></Field>
          <Field label="Release notes (one per line)" error={errors.releaseNotes}><textarea style={{ ...INPUT, minHeight: 90 }} value={notesText} onChange={(e) => setNotesText(e.target.value)} /></Field>
          <Field label="Play Store URL" error={errors.storeUrl}><input style={INPUT} value={form.storeUrl} onChange={(e) => set('storeUrl', e.target.value)} /></Field>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, marginBottom: 10 }}>
            <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => set('maintenanceMode', e.target.checked)} />
            <span><b>Maintenance mode</b> — blocks drivers from starting trips (independent of versions)</span>
          </label>
          {form.maintenanceMode && <Field label="Maintenance message" error={errors.maintenanceMessage}><input style={INPUT} value={form.maintenanceMessage ?? ''} onChange={(e) => set('maintenanceMessage', e.target.value)} /></Field>}
        </div>
      </fieldset>

      {!hasErrors && matrixCodes.length > 0 && (
        <div className="tv-card" style={{ padding: 16, marginBottom: 16, fontSize: 13 }}>
          <b>What drivers will see</b>
          <table style={{ marginTop: 8, borderCollapse: 'collapse' }}>
            <tbody>{matrixCodes.map((c) => (
              <tr key={c}><td style={{ padding: '2px 16px 2px 0', fontFamily: 'var(--font-mono)' }}>installed code {c}</td><td>{outcome(c, payload)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {isSuperAdmin && (
        <div style={{ display: 'flex', gap: 8 }}>
          <LoadingButton className="god-accent-btn" style={{ padding: '8px 18px', fontSize: 13 }} loading={saving} disabled={hasErrors}
            onClick={() => (risky ? setConfirming(true) : void save())}>
            Save policy
          </LoadingButton>
        </div>
      )}

      {confirming && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 50 }}>
          <div className="tv-card" style={{ padding: 24, maxWidth: 440 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Confirm high-impact change</h2>
            <p style={{ fontSize: 13, marginBottom: 16 }}>
              {payload.maintenanceMode ? 'Maintenance mode will stop every driver from starting trips. ' : ''}
              {payload.enforceMinimum ? `Drivers on a version below code ${payload.minimumSupportedVersionCode} will be forced to update and cannot start new trips. ` : ''}
              This affects all organisations immediately.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirming(false)} style={{ padding: '7px 14px', fontSize: 13 }}>Cancel</button>
              <LoadingButton className="god-accent-btn" style={{ padding: '7px 16px', fontSize: 13 }} loading={saving} onClick={() => void save()}>Confirm &amp; publish</LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
