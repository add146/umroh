import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

export const ResellerDashboard: React.FC = () => {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fullAffiliateUrl = `${window.location.origin}/?ref=${user?.affiliateCode}`;

    useEffect(() => {
        const load = async () => {
            try {
                // Here we fetch basic affiliate stats + prospect stats
                const [affiliateRes, prospectRes] = await Promise.all([
                    apiFetch('/api/affiliate/stats'),
                    apiFetch('/api/prospects')
                ]);

                let totalClicks = 0;
                let activeJamaah = 0;
                let prospectCount = 0;

                if (affiliateRes.ok) {
                    const data = await affiliateRes.json();
                    totalClicks = data.totalClicks || 0;
                    activeJamaah = data.totalReferrals || 0; // Or from custom endpoint
                }

                if (prospectRes.ok) {
                    const pData = await prospectRes.json();
                    prospectCount = pData.prospects?.length || 0;
                }

                setStats({ totalClicks, activeJamaah, prospectCount });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(fullAffiliateUrl);
        alert('Link Affiliate disalin!');
    };

    if (isLoading) return <div style={{ padding: '2rem' }}>Loading Dashboard...</div>;

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Reseller Tracking Hub</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Selamat datang, {user?.name}. Pantau trafik link dan prospek Anda.</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text-muted)' }}>Link Affiliate Anda</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        type="text"
                        readOnly
                        value={fullAffiliateUrl}
                        style={{ flex: 1, padding: '0.875rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#0a0907', fontWeight: 500, color: 'var(--color-text)' }}
                    />
                    <button className="btn btn-primary" onClick={copyToClipboard} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span> Copy
                    </button>
                    <button onClick={() => window.open(fullAffiliateUrl, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span> Test
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Klik Link</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalClicks || 0}</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Jamaah / Referral</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.activeJamaah || 0}</p>
                </div>
                <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Total Prospek</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.prospectCount || 0}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <Link to="/marketing-kit" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="hover:border-primary/30" style={{ backgroundColor: '#1a1917', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '0.75rem', backgroundColor: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>campaign</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Marketing Kit</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Materi promosi siap share</p>
                        </div>
                    </div>
                </Link>

                <Link to="/prospects" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="hover:border-primary/30" style={{ backgroundColor: '#1a1917', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '0.75rem', backgroundColor: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>group</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Prospek CRM</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Catat & pantau calon jamaah</p>
                        </div>
                    </div>
                </Link>

                <Link to="/affiliate" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="hover:border-primary/30" style={{ backgroundColor: '#1a1917', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '0.75rem', backgroundColor: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>account_balance_wallet</span>
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Pencairan & Komisi</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Buka halaman affiliasi komplit</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};
