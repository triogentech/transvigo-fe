import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LoadingButton } from '../../components/states';
import type { SelectOrgError } from '../../types/api.types';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Populated only when one email+password matches more than one organisation.
  const [orgChoices, setOrgChoices] = useState<SelectOrgError['organisations'] | null>(null);
  const [chosenSlug, setChosenSlug] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: Form) => {
    setFormError(null);
    if (orgChoices && !chosenSlug) {
      setFormError('Please choose your organisation');
      return;
    }
    try {
      await login({ ...values, orgSlug: chosenSlug || undefined });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const s = err.response?.status;
        const data = err.response?.data as Partial<SelectOrgError> | undefined;
        if (s === 409 && data?.code === 'SELECT_ORG' && data.organisations?.length) {
          setOrgChoices(data.organisations);
          setChosenSlug(data.organisations[0].slug);
          setFormError('This email is used at more than one organisation — choose one to continue.');
        } else if (s === 401) setFormError('Invalid credentials');
        else if (s === 403) setFormError('Account is inactive');
        else setFormError('Unable to sign in — please try again');
      } else setFormError('Unable to sign in — please try again');
    }
  };

  const inputCls = 'tv-input';
  const labelCls = 'block mb-1';
  const labelStyle = { fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 } as const;
  const errStyle = { fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 } as const;

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 16 }}>
      <div className="tv-card" style={{ width: 400, maxWidth: '100%', padding: 28 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
          <div className="font-display font-bold" style={{ fontSize: 22, color: 'var(--accent-navy)', letterSpacing: '-0.01em' }}>TRANSVIGO</div>
          <ArrowRight size={18} style={{ color: 'var(--accent-teal)' }} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22 }}>Fleet Operations Platform</div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          <div>
            <label className={labelCls} style={labelStyle}>Email address</label>
            <input className={inputCls} type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
            {errors.email && <div style={errStyle}>{errors.email.message}</div>}
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input className={inputCls} type={showPwd ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password" {...register('password')} style={{ paddingRight: 38 }} />
              <button type="button" onClick={() => setShowPwd((s) => !s)} aria-label="Toggle password"
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div style={errStyle}>{errors.password.message}</div>}
          </div>

          {orgChoices && (
            <div>
              <label className={labelCls} style={labelStyle}>Organisation</label>
              <select className={inputCls} value={chosenSlug} onChange={(e) => setChosenSlug(e.target.value)}>
                {orgChoices.map((o) => (
                  <option key={o.slug} value={o.slug}>{o.name}</option>
                ))}
              </select>
            </div>
          )}

          {formError && (
            <div style={{ fontSize: 13, color: 'var(--status-danger-text)', background: 'var(--status-danger-bg)', border: '1px solid var(--status-danger-border)', borderRadius: 6, padding: '8px 12px' }}>
              {formError}
            </div>
          )}

          <LoadingButton type="submit" loading={isSubmitting} className="btn-brand" style={{ padding: '10px 16px', fontSize: 14, marginTop: 4 }}>
            Sign in
          </LoadingButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent-teal)' }}>Forgot password?</Link>
        </div>
      </div>
    </div>
  );
}
