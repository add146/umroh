import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiFetch<any>('/api/users/profile');
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

            const response = await apiFetch<any>('/api/users/me', {
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
        width: '100%',
        padding: '0.75rem 0.875rem',
        background: '#0a0907',
        border: '1px solid #333',
        color: 'white',
        borderRadius: '0.5rem',
        outline: 'none',
        boxSizing: 'border-box',
        fontSize: '0.875rem'
    };

    return (
        <div className="profile-page-container animate-in fade-in duration-500" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '42px', height: '42px', background: 'var(--color-primary-bg)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>manage_accounts</span>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0, color: 'white' }}>Pengaturan Akun</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.8125rem' }}>Kelola informasi login, keamanan, dan integrasi sistem.</p>
                </div>
            </div>

            {/* Responsive Grid Layout */}
            <div className="profile-grid">
                {/* Profile Avatar Card */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxSizing: 'border-box' }}>
                    <div style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.875rem',
                        fontWeight: 900,
                        color: 'var(--color-bg)',
                        marginBottom: '1rem',
                        border: '4px solid #0a0907',
                        boxShadow: '0 0 20px rgba(200, 168, 81, 0.25)'
                    }}>
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>{user?.name}</h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</p>

                    <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', width: '100%', textAlign: 'left' }}>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>Email Terdaftar</p>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#eee', margin: 0, wordBreak: 'break-all' }}>{user?.email || '-'}</p>
                    </div>

                    {/* WA Status Badge (Pusat Only) */}
                    {user?.role === 'pusat' && waStatus && (
                        <div style={{ marginTop: '1rem', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', background: waStatus === 'open' ? 'rgba(37, 211, 102, 0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${waStatus === 'open' ? 'rgba(37,211,102,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '0.5rem' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: waStatus === 'open' ? '#25D366' : '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.75rem', color: waStatus === 'open' ? '#25D366' : '#ef4444', fontWeight: 700 }}>
                                    {waStatus === 'open' ? 'WA Terhubung' : `Status: ${waStatus}`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Card */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', boxSizing: 'border-box' }}>
                    {successMsg && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8125rem', border: '1px solid rgba(37, 211, 102, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                            {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.8125rem', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#ccc', fontWeight: 600 }}>Email (Opsional)</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputStyle} placeholder="nama@email.com" />
                            <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0.375rem 0 0 0' }}>Bisa digunakan untuk login jika nomor WA lupa.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#ccc', fontWeight: 600 }}>No. WhatsApp *</label>
                            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="08123456789" style={inputStyle} />
                            <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0.375rem 0 0 0' }}>Pastikan nomor aktif untuk login dan notifikasi WhatsApp.</p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.8125rem', color: '#ccc', fontWeight: 600 }}>Password Baru (Opsional)</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} minLength={6} placeholder="Kosongkan jika tidak ingin mengubah password" style={inputStyle} />
                        </div>

                        {/* Evolution API Section for Pusat */}
                        {user?.role === 'pusat' && (
                            <div style={{ marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <div style={{ padding: '0.4rem', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '0.375rem', color: '#25D366', display: 'flex' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'white', margin: 0 }}>WhatsApp Gateway (Evolution API)</h3>
                                        <p style={{ fontSize: '0.6875rem', color: '#888', margin: 0 }}>Konfigurasi & kelola koneksi WhatsApp</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: '#bbb', fontWeight: 600 }}>API URL</label>
                                        <input type="text" value={formData.wahaApiUrl} onChange={e => setFormData({ ...formData, wahaApiUrl: e.target.value })} placeholder="https://evolution.example.com" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: '#bbb', fontWeight: 600 }}>API Key</label>
                                        <input type="text" value={formData.wahaApiKey} onChange={e => setFormData({ ...formData, wahaApiKey: e.target.value })} placeholder="Evolution API Key" style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.75rem', color: '#bbb', fontWeight: 600 }}>Instance Name (Session)</label>
                                        <input type="text" value={formData.wahaSession} onChange={e => setFormData({ ...formData, wahaSession: e.target.value })} placeholder="default" style={inputStyle} />
                                    </div>

                                    {/* WA Action Buttons */}
                                    <div className="wa-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <button
                                            type="button"
                                            onClick={handleScanQR}
                                            disabled={isLoading}
                                            style={{ padding: '0.625rem 0.375rem', borderRadius: '0.5rem', border: '1px solid rgba(37,211,102,0.3)', background: 'rgba(37,211,102,0.1)', color: '#25D366', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>qr_code</span>
                                            Scan QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCheckStatus}
                                            disabled={isLoading}
                                            style={{ padding: '0.625rem 0.375rem', borderRadius: '0.5rem', border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>wifi_tethering</span>
                                            Status
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleLogoutWA}
                                            disabled={isLoading}
                                            style={{ padding: '0.625rem 0.375rem', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>logout</span>
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="profile-buttons-row" style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                type="submit"
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    minWidth: '160px',
                                    padding: '0.875rem',
                                    borderRadius: '0.625rem',
                                    background: 'var(--color-primary)',
                                    color: '#000',
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(200, 168, 81, 0.3)'
                                }}
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                            {user?.role === 'pusat' && (
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={handleTestWA}
                                    style={{
                                        flex: 1,
                                        minWidth: '140px',
                                        padding: '0.875rem',
                                        borderRadius: '0.625rem',
                                        background: 'rgba(37, 211, 102, 0.1)',
                                        color: '#25D366',
                                        border: '1px solid rgba(37, 211, 102, 0.3)',
                                        fontWeight: 700,
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.375rem'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                    Test WA
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* QR Modal */}
            {showQrModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ backgroundColor: '#1a1917', borderRadius: '1.25rem', border: '1px solid var(--color-primary)', padding: '1.5rem', width: '100%', maxWidth: '340px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0,0,0,0.8)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>Scan QR WhatsApp</h3>
                            <button onClick={() => setShowQrModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#888' }}>close</span>
                            </button>
                        </div>

                        {qrLoading ? (
                            <div style={{ padding: '2rem 0', color: '#888' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '42px', display: 'block', marginBottom: '0.75rem', opacity: 0.5 }}>qr_code_scanner</span>
                                Memuat QR Code...
                            </div>
                        ) : qrData?.base64 ? (
                            <>
                                <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.75rem', display: 'inline-block', marginBottom: '0.75rem' }}>
                                    <img
                                        src={qrData.base64.startsWith('data:') ? qrData.base64 : `data:image/png;base64,${qrData.base64}`}
                                        alt="WhatsApp QR"
                                        style={{ width: '180px', height: '180px', display: 'block' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>
                                    Buka WhatsApp → Perangkat Tertaut → Tautkan Perangkat → Scan QR di atas
                                </p>
                            </>
                        ) : (
                            <div style={{ padding: '1.5rem 0', color: '#ef4444', fontSize: '0.8125rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '0.5rem' }}>warning</span>
                                QR tidak tersedia. Pastikan API URL, API Key, dan Instance Name sudah disimpan dengan benar.
                            </div>
                        )}

                        <button
                            onClick={handleScanQR}
                            style={{ marginTop: '1.25rem', width: '100%', padding: '0.625rem', borderRadius: '0.5rem', background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}
                        >
                            Refresh QR
                        </button>
                    </div>
                </div>
            )}

            {/* Responsive CSS */}
            <style>{`
                .profile-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.25rem;
                    align-items: start;
                }
                @media (min-width: 769px) {
                    .profile-grid {
                        grid-template-columns: minmax(260px, 300px) 1fr;
                        gap: 1.75rem;
                    }
                }
                @media (max-width: 480px) {
                    .wa-actions-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .profile-buttons-row {
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProfileSetting;
