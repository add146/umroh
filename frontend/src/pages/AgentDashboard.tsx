import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

export const AgentDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                // Fetch stats (we can reuse affiliate dashboard stats or create a custom one)
                // For now, we'll fetch prospects and bookings to derive stats
                const [prospectsRes, bookingsRes, incomingRes] = await Promise.all([
                    apiFetch('/api/prospects'),
                    apiFetch('/api/bookings'),
                    apiFetch('/api/leads/incoming').catch(() => ({ ok: false }))
                ]);

                let prospectCount = 0;
                let activeJamaah = 0;
                let incomingLeadsCount = 0;

                if (prospectsRes.ok) {
                    const data = await prospectsRes.json();
                    prospectCount = data.prospects?.length || 0;
                }
                if (bookingsRes.ok) {
                    const data = await bookingsRes.json();
                    activeJamaah = data.bookings?.length || 0;
                }
                if (incomingRes && incomingRes.ok) {
                    const data = await (incomingRes as Response).json();
                    incomingLeadsCount = data.incomingLeads?.length || 0;
                }

                setStats({
                    prospectCount,
                    activeJamaah,
                    incomingLeadsCount,
                });
            } catch (err) {
                console.error('Failed to load stats', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Sales & Follow-Up Hub</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Selamat datang, {user?.name}. Kelola prospek dan jamaah Anda di sini.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Jamaah Aktif</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.activeJamaah || 0}</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Prospek</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.prospectCount || 0}</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Lead Masuk Baru</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{stats?.incomingLeadsCount || 0}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <Link to="/prospects" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>contact_mail</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Kelola Prospek</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>CRM pipeline & follow-up calon jamaah</p>
                        </div>
                    </div>
                </Link>

                <Link to="/agent/jamaah" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>group</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Data Jamaah</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Pantau kelengkapan & status pembayaran</p>
                        </div>
                    </div>
                </Link>

                <Link to="/agent/leads" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: '#ef4444' }}>call_received</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Inbox Lead</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Terima lead dari Cabang/Mitra</p>
                        </div>
                    </div>
                </Link>

                <Link to="/marketing-kit" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(200, 168, 81, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>imagesmode</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Marketing Kit</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Download flyer & copywriting</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Reseller List */}
            <ResellerList />
        </div>
    );
};

const ResellerList: React.FC = () => {
    const [resellers, setResellers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiFetch<{ resellers: any[] }>('/api/affiliate/my-resellers');
                setResellers(data.resellers || []);
            } catch { /* ignore */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const frontendUrl = window.location.origin;

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Daftar Reseller Saya ({resellers.length})</h2>
            </div>

            <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.3rem', overflow: 'hidden', padding: '10px' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Reseller Aktif</h3>
                </div>

                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</div>
                ) : resellers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</p>
                        <p>Belum ada reseller. Bagikan link rekrut di halaman Afiliasi.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nama</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Link Afiliasi</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Bergabung</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resellers.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{r.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>{r.email}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        {r.affiliateCode ? (
                                            <span style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '4px',
                                                background: 'rgba(200,168,81,0.1)', color: 'var(--color-primary)',
                                                fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer'
                                            }}
                                                onClick={() => navigator.clipboard.writeText(`${frontendUrl}/register?ref=${r.affiliateCode}`)}
                                                title="Klik untuk salin"
                                            >
                                                {r.affiliateCode}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)', fontSize: '0.8rem' }}>
                                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
