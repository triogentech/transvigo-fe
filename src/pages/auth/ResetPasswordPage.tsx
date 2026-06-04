import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as authApi from '../../api/auth.api';
import { errMessage } from '../../api/client';
import { LoadingButton } from '../../components/states';

const schema = z.object({
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setError(null);
    if (!token) { setError('Invalid or missing reset token'); return; }
    try { await authApi.resetPassword({ token, newPassword: values.newPassword }); setDone(true); }
    catch (e) { setError(errMessage(e, 'Could not reset password')); }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 16 }}>
      <div className="tv-card" style={{ width: 400, maxWidth: '100%', padding: 28 }}>
        <div className="font-display font-bold" style={{ fontSize: 20, color: 'var(--accent-navy)' }}>Choose a new password</div>
        <div style={{ height: 12 }} />
        {done ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--status-success-text)', background: 'var(--status-success-bg)', border: '1px solid var(--status-success-border)', borderRadius: 6, padding: '10px 12px' }}>
              Your password has been reset.
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}><Link to="/login" style={{ fontSize: 13, color: 'var(--accent-teal)' }}>Sign in</Link></div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <div>
              <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>New password</label>
              <input className="tv-input" type="password" {...register('newPassword')} />
              {errors.newPassword && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.newPassword.message}</div>}
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Confirm password</label>
              <input className="tv-input" type="password" {...register('confirm')} />
              {errors.confirm && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.confirm.message}</div>}
            </div>
            {error && <div style={{ fontSize: 13, color: 'var(--status-danger-text)' }}>{error}</div>}
            <LoadingButton type="submit" loading={isSubmitting} className="btn-brand" style={{ padding: '10px 16px', fontSize: 14 }}>Reset password</LoadingButton>
          </form>
        )}
      </div>
    </div>
  );
}
