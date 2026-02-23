import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const ProfileSetting: React.FC = () => {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: user?.phone || '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            const payload: any = {};
            if (formData.email !== user?.email) payload.email = formData.email || null;
            if (formData.phone !== user?.phone) payload.phone = formData.phone;
            if (formData.password) payload.password = formData.password;

            if (Object.keys(payload).length === 0) {
                setSuccessMsg('Tidak ada perubahan data.');
                setIsLoading(false);
                return;
            }

            const response = await apiFetch('/api/users/me', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            setSuccessMsg(response.message || 'Profil berhasil diperbarui!');
            setFormData(prev => ({ ...prev, password: '' })); // clear password field

            // If email or phone changed, the local user store might need standardizing 
            // depending on if they are displayed, but usually a re-login handles it best
            // for simplicity, we keep it as is since authStore relies mostly on the token for role/id.

        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal memperbarui profil.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Pengaturan Akun</h1>

            <div style={{
                background: 'var(--color-bg-alt)',
                padding: '2rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)'
            }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-bg)'
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{user?.name}</h2>
                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                            {user?.role}
                        </p>
                    </div>
                </div>

                {successMsg && (
                    <div style={{ padding: '1rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(37, 211, 102, 0.2)' }}>
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Email (Opsional)</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>Bisa digunakan untuk login utama jika No. WA lupa.</p>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No. WhatsApp *</label>
                        <input
                            type="text"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            required
                            placeholder="08123456789"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>Pastikan nomor aktif. Digunakan untuk login dan notifikasi jamaah.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Password Baru (Opsional)</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            minLength={6}
                            placeholder="Biarkan kosong jika tidak ingin mengubah password"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
};
