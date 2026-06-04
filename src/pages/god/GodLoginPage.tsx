import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { usePlatformAuth } from '../../hooks/god/usePlatformAuth';
import { LoadingButton } from '../../components/states';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

export default function GodLoginPage() {
  const { login } = usePlatformAuth();
  const [showPwd, setShowPwd] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setFormError(null);
    try {
      await login(values);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const s = err.response?.status;
        if (s === 401) setFormError('Invalid credentials');
        else if (s === 403) setFormError('Account is inactive or access denied');
        else setFormError('Unable to sign in — please try again');
      } else {
        setFormError('Unable to sign in — please try again');
      }
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 6,
    color: '#e5e5e5',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: 6,
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: 500,
    letterSpacing: '0.02em',
  };
  const errStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--status-danger-text)',
    marginTop: 4,
  };

  return (
    <div
      className="god-mode"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 400,
          maxWidth: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 32,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(217,119,6,0.12)',
              border: '1px solid rgba(217,119,6,0.3)',
              marginBottom: 16,
            }}
          >
            <Zap size={24} style={{ color: '#d97706' }} />
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#d97706',
              letterSpacing: '0.12em',
              fontFamily: 'var(--font-display)',
              marginBottom: 4,
            }}
          >
            TRANSVIGO
          </div>
          <div
            style={{
              fontSize: 13,
              color: '#9ca3af',
              marginBottom: 14,
            }}
          >
            Platform Administration
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#6b7280',
              background: 'rgba(217,119,6,0.06)',
              border: '1px solid rgba(217,119,6,0.2)',
              borderRadius: 6,
              padding: '6px 10px',
              lineHeight: 1.5,
            }}
          >
            Authorised personnel only. All access is monitored and logged.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              placeholder="admin@transvigo.in"
              autoComplete="email"
              style={inputStyle}
              {...register('email')}
            />
            {errors.email && <div style={errStyle}>{errors.email.message}</div>}
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 40 }}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                aria-label="Toggle password visibility"
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <div style={errStyle}>{errors.password.message}</div>}
          </div>

          {formError && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--status-danger-text)',
                background: 'var(--status-danger-bg)',
                border: '1px solid var(--status-danger-border)',
                borderRadius: 6,
                padding: '8px 12px',
              }}
            >
              {formError}
            </div>
          )}

          <LoadingButton
            type="submit"
            loading={isSubmitting}
            className="god-accent-btn"
            style={{ width: '100%', padding: '11px 16px', fontSize: 14, marginTop: 4 }}
          >
            Sign In to God Mode
          </LoadingButton>
        </form>
      </div>
    </div>
  );
}
