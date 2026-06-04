import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authApi from '../../api/auth.api';
import { errMessage } from '../../api/client';
import { LoadingButton } from '../../components/states';

const schema = z.object({ orgSlug: z.string().min(1, 'Required'), email: z.string().email('Enter a valid email') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setError(null);
    try { await authApi.forgotPassword(values); setSent(true); }
    catch (e) { setError(errMessage(e, 'Could not send reset link')); }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 16 }}>
      <div className="tv-card" style={{ width: 400, maxWidth: '100%', padding: 28 }}>
        <div className="font-display font-bold" style={{ fontSize: 20, color: 'var(--accent-navy)' }}>Reset password</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0 20px' }}>
          We'll email you a link to set a new password.
        </div>
        {sent ? (
          <div style={{ fontSize: 13, color: 'var(--status-success-text)', background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', borderRadius: 6, padding: '10px 12px' }}>
            If an account matches those details, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div>
              <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Organisation</label>
              <input className="tv-input" placeholder="your-org-slug" autoCapitalize="none" {...register('orgSlug')} />
              {errors.orgSlug && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.orgSlug.message}</div>}
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Email address</label>
              <input className="tv-input" type="email" placeholder="you@company.com" {...register('email')} />
              {errors.email && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.email.message}</div>}
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--status-danger-text)' }}>{error}</div>}
            <LoadingButton type="submit" loading={isSubmitting} className="btn-brand" style={{ padding: '10px 16px', fontSize: 14 }}>Send reset link</LoadingButton>
          </form>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--accent-teal)' }}>Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
