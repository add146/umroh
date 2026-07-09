import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const ProfileSetting: React.FC = () => {
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // QR Modal state
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<{ base64?: string; code?: string } | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [waStatus, setWaStatus] = useState<string>('');


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
            setFormData(prev => ({ ...prev, password: '' }));
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal memperbarui profil.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanQR = async () => {
        setQrLoading(true);
        setQrData(null);
        setShowQrModal(true);
        setErrorMsg('');
        try {
            const res = await apiFetch<any>('/api/communication/wa/qr');
            if (res.success) {
                setQrData(res.qr);
            } else {
                setErrorMsg(res.error || 'Gagal mendapatkan QR code.');
                setShowQrModal(false);
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal mendapatkan QR code.');
            setShowQrModal(false);
        } finally {
            setQrLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        setIsLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const res = await apiFetch<any>('/api/communication/wa/status');
            if (res.success) {
                const state = res.state?.instance?.state || res.state?.state || JSON.stringify(res.state);
                setWaStatus(state);
                setSuccessMsg(`Status koneksi: ${state}`);
            } else {
                setErrorMsg(res.error || 'Gagal mengecek status.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal mengecek status.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogoutWA = async () => {
        if (!window.confirm('Yakin ingin logout dari WhatsApp? QR perlu di-scan ulang.')) return;
        setIsLoading(true);
        setSuccessMsg('');
        setErrorMsg('');
        try {
            const res = await apiFetch<any>('/api/communication/wa/logout', { method: 'DELETE' });
            if (res.success) {
                setWaStatus('disconnected');
                setSuccessMsg('Berhasil logout dari WhatsApp. Silakan scan QR kembali untuk reconnect.');
            } else {
                setErrorMsg(res.error || 'Gagal logout.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Gagal logout.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestWA = async () => {
        if (!formData.phone) {
            setErrorMsg('Harap isi nomor WhatsApp untuk melakukan tes pesan.');
            return;
        }
        setIsLoading(true);
        setErrorMsg('');
        try {
            const res = await apiFetch<any>('/api/communication/test-wa', {
                method: 'POST',
                body: JSON.stringify({
                    phone: formData.phone,
                    message: `*TEST Evolution API*\n\n✅ Koneksi WhatsApp Gateway berhasil!\n\nIni adalah pesan percobaan dari sistem.\nWaktu: ${new Date().toLocaleString('id-ID')}`
                })
            });
            if (res.success) {
                setSuccessMsg('Pesan tes berhasil dikirim ke: ' + formData.phone);
            } else {
                setErrorMsg(res.error || 'Gagal mengirim pesan percobaan.');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan saat menguji koneksi.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.875rem',
        background: '#0a0907', border: '1px solid #333',
        color: 'white', borderRadius: '0.5rem', outline: 'none', boxSizing: 'border-box'
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--color-primary-bg)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>manage_accounts</span>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pengaturan Akun</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola informasi login, keamanan, dan integrasi WhatsApp.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Profile Card */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--color-bg)', marginBottom: '1.25rem', border: '4px solid #0a0907', boxShadow: '0 0 20px rgba(200, 168, 81, 0.2)' }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{user?.name}</h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</p>
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #333', width: '100%', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Email Terdaftar</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.email || '-'}</p>
                    </div>

                    {/* WA Status Badge */}
                    {user?.role === 'pusat' && waStatus && (
                        <div style={{ marginTop: '1rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: waStatus === 'open' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${waStatus === 'open' ? 'rgba(37,211,102,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: waStatus === 'open' ? '#25D366' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8125rem', color: waStatus === 'open' ? '#25D366' : '#ef4444', fontWeight: 600 }}>
                                    {waStatus === 'open' ? 'WA Terhubung' : `Status: ${waStatus}`}
                                </span>
                            </div>
                        </div>
                    )}
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
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="nama@email.com" />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Bisa digunakan untuk login utama jika No. WA lupa.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>No. WhatsApp *</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="08123456789" style={inputStyle} />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Pastikan nomor aktif. Digunakan untuk login dan notifikasi jamaah.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>Password Baru (Opsional)</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} minLength={6} placeholder="Biarkan kosong jika tidak ingin mengubah password" style={inputStyle} />
                        </div>

                        {/* ── Evolution API Section ── */}
                        {user?.role === 'pusat' && (
                            <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid #333' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '0.5rem', color: '#25D366', display: 'flex' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>WhatsApp Gateway (Evolution API)</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Konfigurasi dan kelola koneksi WhatsApp</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>API URL</label>
                                        <input type="text" value={formData.wahaApiUrl} onChange={e => setFormData({ ...formData, wahaApiUrl: e.target.value })} placeholder="https://evolution.example.com" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>API Key</label>
                                        <input type="text" value={formData.wahaApiKey} onChange={e => setFormData({ ...formData, wahaApiKey: e.target.value })} placeholder="Evolution API Key" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: 500 }}>Instance Name (Session)</label>
                                        <input type="text" value={formData.wahaSession} onChange={e => setFormData({ ...formData, wahaSession: e.target.value })} placeholder="default" style={inputStyle} />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Nama instance di Evolution API (biasanya: <code style={{ color: 'var(--color-primary)' }}>default</code>)</p>
                                    </div>

                                    {/* WA Action Buttons */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem', marginTop: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleScanQR}
                                            disabled={isLoading}
                                            style={{ padding: '0.75rem 0.5rem', borderRadius: '0.625rem', border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.1)', color: '#25D366', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code</span>
                                            Scan QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCheckStatus}
                                            disabled={isLoading}
                                            style={{ padding: '0.75rem 0.5rem', borderRadius: '0.625rem', border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wifi_tethering</span>
                                            Status
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLogoutWA}
                                            disabled={isLoading}
                                            style={{ padding: '0.75rem 0.5rem', borderRadius: '0.625rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span>
                                            Logout WA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save + Test Buttons */}
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" disabled={isLoading} className="btn btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem' }}>
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            {user?.role === 'pusat' && (
                                <button
                                    type="button" disabled={isLoading} onClick={handleTestWA}
                                    style={{ flex: 1, padding: '1rem', borderRadius: '0.75rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.2)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                    Test Kirim WA
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* ── QR Modal ── */}
            {showQrModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1.25rem', border: '1px solid var(--color-border)', padding: '2rem', width: '100%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.7)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Scan QR WhatsApp</h3>
                            <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-text-muted)' }}>close</span>
                            </button>
                        </div>

                        {qrLoading ? (
                            <div style={{ padding: '3rem 0', color: 'var(--color-text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>qr_code_scanner</span>
                                Memuat QR Code...
                            </div>
                        ) : qrData?.base64 ? (
                            <>
                                <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '0.75rem', display: 'inline-block', marginBottom: '1rem' }}>
                                    <img
                                        src={qrData.base64.startsWith('data:') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                                        alt="WhatsApp QR"
                                        style={{ width: '200px', height: '200px', display: 'block' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                    Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR di atas
                                </p>
                            </>
                        ) : (
                            <div style={{ padding: '2rem 0', color: '#ef4444' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '0.75rem' }}>warning</span>
                                QR tidak tersedia. Pastikan API URL, API Key, dan Instance Name sudah disimpan dengan benar.
                            </div>
                        )}

                        <button
                            onClick={handleScanQR}
                            style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(37,211,102,0.1)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', fontWeight: 600, cursor: 'pointer' }}
                        >
                            Refresh QR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
