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
        wahaApiUrl: '',
        wahaApiKey: '',
        wahaSession: 'default',
    });

    React.useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiFetch('/api/users/profile');
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        email: data.email || '',
                        phone: data.phone || '',
                        wahaApiUrl: data.wahaApiUrl || '',
                        wahaApiKey: data.wahaApiKey || '',
                        wahaSession: data.wahaSession || 'default'
                    }));
                }
            } catch (err) {
                console.error('Gagal memuat profil DB:', err);
            }
        };
        loadProfile();
    }, []);

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

            if (user?.role === 'pusat') {
                payload.wahaApiUrl = formData.wahaApiUrl;
                payload.wahaApiKey = formData.wahaApiKey;
                payload.wahaSession = formData.wahaSession;
            }

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
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{
                    width: '48px', height: '48px', background: 'var(--color-primary-bg)',
                    borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>manage_accounts</span>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pengaturan Akun</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola informasi login dan keamanan akun Anda.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Profile Card */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'var(--color-primary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', fontWeight: 900, color: 'var(--color-bg)',
                        marginBottom: '1.25rem', border: '4px solid #0a0907',
                        boxShadow: '0 0 20px rgba(200, 168, 81, 0.2)'
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {user?.role}
                    </p>
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #333', width: '100%', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Email Terdaftar</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.email || '-'}</p>
                    </div>
                </div>

                {/* Form Column */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem' }}>
                    {successMsg && (
                        <div style={{ padding: '1rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(37, 211, 102, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>Email (Opsional)</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                                placeholder="nama@email.com"
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Bisa digunakan untuk login utama jika No. WA lupa.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>No. WhatsApp *</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                required
                                placeholder="08123456789"
                                style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Pastikan nomor aktif. Digunakan untuk login dan notifikasi jamaah.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>Password Baru (Opsional)</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                minLength={6}
                                placeholder="Biarkan kosong jika tidak ingin mengubah password"
                                style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                            />
                        </div>

                        {user?.role === 'pusat' && (
                            <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '0.5rem', color: '#25D366', display: 'flex' }}>
                                        <i className="fa-brands fa-whatsapp text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>WhatsApp Gateway (WAHA)</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Konfigurasi notifikasi WA khusus untuk Super Admin</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>API URL</label>
                                        <input
                                            type="text"
                                            value={formData.wahaApiUrl}
                                            onChange={e => setFormData({ ...formData, wahaApiUrl: e.target.value })}
                                            placeholder="https://your-waha-instance.com"
                                            style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>API Key</label>
                                        <input
                                            type="text"
                                            value={formData.wahaApiKey}
                                            onChange={e => setFormData({ ...formData, wahaApiKey: e.target.value })}
                                            placeholder="Your WAHA API Key"
                                            style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>Session Name</label>
                                        <input
                                            type="text"
                                            value={formData.wahaSession}
                                            onChange={e => setFormData({ ...formData, wahaSession: e.target.value })}
                                            placeholder="default"
                                            style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem' }}
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>

                            {user?.role === 'pusat' && (
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={async () => {
                                        if (!formData.phone) {
                                            setErrorMsg('Harap isi nomor WhatsApp untuk melakukan tes pesan.');
                                            return;
                                        }
                                        setIsLoading(true);
                                        setErrorMsg('');
                                        try {
                                            const res = await apiFetch('/api/communication/test-wa', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    phone: formData.phone,
                                                    message: `*TEST WAHA AL MADINAH*\n\n✅ Koneksi WhatsApp Gateway berhasil!\n\nIni adalah pesan percobaan dari sistem.\nWaktu: ${new Date().toLocaleString('id-ID')}`
                                                })
                                            });
                                            if (res.success) {
                                                setSuccessMsg('Pesan tes WAHA berhasil dikirim ke: ' + formData.phone);
                                            } else {
                                                setErrorMsg(res.error || 'Gagal mengirim pesan percobaan WAHA.');
                                            }
                                        } catch (err: any) {
                                            setErrorMsg(err.message || 'Terjadi kesalahan saat menguji koneksi WAHA.');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="btn btn-secondary"
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: '0.75rem',
                                        background: 'rgba(37, 211, 102, 0.1)',
                                        color: '#25D366',
                                        border: '1px solid rgba(37, 211, 102, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <i className="fa-brands fa-whatsapp text-lg"></i>
                                    Test WAHA
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
