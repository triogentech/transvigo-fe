import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { errMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LoadingButton } from '../../components/states';

const schema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
type Form = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Form) => {
    setError(null);
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed');
    } catch (e) { setError(errMessage(e, 'Could not change password')); }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: 16 }}>
      <div className="tv-card" style={{ width: 420, maxWidth: '100%', padding: 28 }}>
        <div className="font-display font-bold" style={{ fontSize: 20, color: 'var(--text-primary)' }}>Change your password</div>
        {user?.mustChangePwd && (
          <div style={{ fontSize: 13, color: 'var(--status-warning-text)', background: 'var(--status-warning-bg)', border: '1px solid var(--status-warning-border)', borderRadius: 6, padding: '8px 12px', margin: '12px 0' }}>
            You must set a new password before continuing.
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5" style={{ marginTop: 12 }}>
          <div>
            <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Current password</label>
            <input className="tv-input" type="password" {...register('currentPassword')} />
            {errors.currentPassword && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.currentPassword.message}</div>}
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>New password</label>
            <input className="tv-input" type="password" {...register('newPassword')} />
            {errors.newPassword && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.newPassword.message}</div>}
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Confirm new password</label>
            <input className="tv-input" type="password" {...register('confirm')} />
            {errors.confirm && <div style={{ fontSize: 12, color: 'var(--status-danger-text)', marginTop: 4 }}>{errors.confirm.message}</div>}
          </div>
          {error && <div style={{ fontSize: 13, color: 'var(--status-danger-text)' }}>{error}</div>}
          <LoadingButton type="submit" loading={isSubmitting} className="btn-brand" style={{ padding: '10px 16px', fontSize: 14 }}>Update password</LoadingButton>
        </form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button onClick={logout} style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
