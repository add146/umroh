import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface AgentInfo {
    name: string;
    affiliateCode: string;
    role: string;
}

const AgentJoinPage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();

    const [agent, setAgent] = useState<AgentInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [nikStatus, setNikStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        nik: '',
    });

    useEffect(() => {
        if (!code) return;
        const loadAgent = async () => {
            try {
                const data = await apiFetch<{ agent: AgentInfo }>(`/api/affiliate/agent/${code}`);
                setAgent(data.agent);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        loadAgent();
    }, [code]);

    // NIK realtime check
    useEffect(() => {
        if (form.nik.length !== 16) {
            setNikStatus('idle');
            return;
        }
        setNikStatus('checking');
        const timer = setTimeout(async () => {
            try {
                const data = await apiFetch<{ available: boolean }>(`/api/affiliate/check-nik/${form.nik}`);
                setNikStatus(data.available ? 'available' : 'taken');
            } catch {
                setNikStatus('idle');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [form.nik]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nikStatus === 'taken') {
            setError('NIK sudah terdaftar di sistem.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await apiFetch('/api/affiliate/register-reseller', {
                method: 'POST',
                body: JSON.stringify({ ...form, agentCode: code }),
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Gagal mendaftar. Coba lagi.');
        } finally {
            setSubmitting(false);
        }
    };

    const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Memuat halaman...</p>
            </div>
        );
    }

    if (notFound) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-error)', marginBottom: '1rem' }}>error</span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Agen Tidak Ditemukan</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Link yang Anda akses tidak valid atau agen tidak tersedia.</p>
                <a href="/" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Kembali ke Beranda</a>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '50%', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#22c55e' }}>check_circle</span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Pendaftaran Berhasil! 🎉</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', textAlign: 'center', maxWidth: '400px' }}>
                    Akun reseller Anda sudah dibuat di bawah Agen <strong style={{ color: 'var(--color-primary)' }}>{agent?.name}</strong>. Silakan login untuk mulai menggunakan sistem.
                </p>
                <button onClick={() => navigate('/login')} style={{
                    background: 'var(--color-primary)', color: '#0a0907', fontWeight: 700,
                    padding: '0.875rem 2rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '1rem'
                }}>
                    Login Sekarang →
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
            {/* Nav */}
            <nav style={{ borderBottom: '1px solid var(--color-border)', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                        AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                    </span>
                </div>
                <a href="/login" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', padding: '0.5rem 1rem', border: '1px solid var(--color-border)', borderRadius: '0.5rem' }}>
                    Login
                </a>
            </nav>

            {/* Hero */}
            <section style={{
                background: 'linear-gradient(135deg, rgba(200,168,81,0.1) 0%, transparent 50%)',
                borderBottom: '1px solid var(--color-border)',
                padding: '4rem 2rem', textAlign: 'center'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.375rem 1rem', borderRadius: '9999px',
                        background: 'rgba(200,168,81,0.15)', border: '1px solid rgba(200,168,81,0.3)',
                        color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 700,
                        marginBottom: '1.5rem'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span>
                        Agen Resmi Al Madinah
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1rem' }}>
                        Gabung Jadi Reseller<br />
                        Bersama <span style={{ color: 'var(--color-primary)' }}>{agent?.name}</span>
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', lineHeight: 1.6 }}>
                        Dapatkan komisi menarik dari setiap jamaah yang mendaftar melalui link Anda. Tanpa modal, tanpa risiko.
                    </p>
                </div>
            </section>

            {/* Benefits + Form */}
            <section style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
                    {/* Benefits */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Keuntungan Jadi Reseller</h2>
                        {[
                            { icon: 'payments', title: 'Komisi Menarik', desc: 'Dapatkan komisi untuk setiap jamaah yang daftar via link Anda.' },
                            { icon: 'link', title: 'Link Afiliasi Unik', desc: 'Anda mendapat link khusus untuk memudahkan tracking referral.' },
                            { icon: 'image', title: 'Marketing Kit', desc: 'Akses banner, brosur, dan materi promosi siap pakai.' },
                            { icon: 'insights', title: 'Dashboard Realtime', desc: 'Pantau klik, pendaftaran, dan komisi secara transparan.' },
                            { icon: 'group', title: 'Dukungan Tim', desc: `Bimbingan langsung dari Agen ${agent?.name} untuk performa terbaik.` },
                        ].map(b => (
                            <div key={b.title} style={{
                                display: 'flex', gap: '1rem', marginBottom: '1.25rem',
                                padding: '1rem', borderRadius: '0.75rem',
                                border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '0.5rem',
                                    background: 'rgba(200,168,81,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>{b.icon}</span>
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{b.title}</p>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Registration Form */}
                    <div style={{
                        background: '#1a1917', border: '1px solid var(--color-border)',
                        borderRadius: '1rem', padding: '2rem', position: 'sticky', top: '80px'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>person_add</span>
                            Daftar Reseller
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                            Isi data untuk membuat akun reseller di bawah agen <strong style={{ color: 'var(--color-primary)' }}>{agent?.name}</strong>.
                        </p>

                        {error && (
                            <div style={{
                                padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.5rem',
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444', fontSize: '0.85rem', fontWeight: 500
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* NIK */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-light)' }}>
                                    NIK (No. KTP) *
                                </label>
                                <input
                                    type="text"
                                    placeholder="16 digit NIK KTP"
                                    value={form.nik}
                                    onChange={e => update('nik', e.target.value.replace(/\D/g, '').slice(0, 16))}
                                    required
                                    maxLength={16}
                                    style={{
                                        width: '100%', padding: '0.875rem', background: '#0a0907',
                                        border: `1px solid ${nikStatus === 'taken' ? '#ef4444' : nikStatus === 'available' ? '#22c55e' : '#333'}`,
                                        color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.9rem'
                                    }}
                                />
                                {nikStatus === 'checking' && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Memeriksa NIK...</p>}
                                {nikStatus === 'available' && <p style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.25rem' }}>✓ NIK tersedia</p>}
                                {nikStatus === 'taken' && <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>✗ NIK sudah terdaftar</p>}
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-light)' }}>
                                    Nama Lengkap *
                                </label>
                                <input type="text" placeholder="Sesuai KTP" value={form.name} onChange={e => update('name', e.target.value)} required
                                    style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.9rem' }} />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-light)' }}>
                                    Email *
                                </label>
                                <input type="email" placeholder="email@example.com" value={form.email} onChange={e => update('email', e.target.value)} required
                                    style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.9rem' }} />
                            </div>

                            {/* Phone */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-light)' }}>
                                    No. WhatsApp
                                </label>
                                <input type="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => update('phone', e.target.value)}
                                    style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.9rem' }} />
                            </div>

                            {/* Password */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.375rem', color: 'var(--color-text-light)' }}>
                                    Password *
                                </label>
                                <input type="password" placeholder="Min. 6 karakter" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}
                                    style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.9rem' }} />
                            </div>

                            <button type="submit" disabled={submitting || nikStatus === 'taken'} style={{
                                width: '100%', marginTop: '0.5rem', padding: '1rem',
                                background: submitting || nikStatus === 'taken' ? '#555' : 'var(--color-primary)',
                                color: '#0a0907', border: 'none', borderRadius: '0.75rem',
                                fontWeight: 700, fontSize: '1rem', cursor: submitting || nikStatus === 'taken' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}>
                                {submitting ? 'Mendaftar...' : 'Daftar Sebagai Reseller'}
                            </button>
                        </form>

                        <p style={{ marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'center' }}>
                            Sudah punya akun? <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Login di sini</a>
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem 2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>© 2025 Al Madinah. Semua hak dilindungi.</p>
            </footer>
        </div>
    );
};

export default AgentJoinPage;
