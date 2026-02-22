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
        </div>
    );
};
