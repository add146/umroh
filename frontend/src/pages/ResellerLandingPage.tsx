import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../lib/api';

interface PackageData {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    image: string | null;
    duration: string | null;
    departures: Array<{
        departureDate: string;
    }>;
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const ResellerLandingPage: React.FC = () => {
    const { affiliateCode } = useParams<{ affiliateCode: string }>();
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Technically we can just fetch all active packages via public route, 
        // since the reseller is just a referral parameter applied on top.
        const fetchPackages = async () => {
            try {
                // We reuse the marketing kit endpoint because it already joins the closest departure limit 1
                const res = await apiClient.get('/marketing-kit/share-cards');
                if (res.packages) {
                    setPackages(res.packages);
                }
            } catch (err) {
                console.error('Failed to fetch packages', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>Memuat halaman...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem' }}>
            {/* Header Profile Section */}
            <div style={{
                background: 'linear-gradient(135deg, #1f1d1a 0%, #0a0907 100%)',
                padding: '4rem 2rem 6rem',
                textAlign: 'center',
                borderBottom: '1px solid rgba(200, 168, 81, 0.2)'
            }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-primary)',
                    margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '4px solid #1a1917', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '50px', color: '#000' }}>person</span>
                </div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#fff' }}>Official Partner</h1>
                <p style={{ color: 'var(--color-primary)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontSize: '0.9rem' }}>
                    Al Madinah Haji & Umroh
                </p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1.5rem', borderRadius: '99px', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-text-muted)' }}>pin</span>
                    <span style={{ fontFamily: 'monospace', letterSpacing: '2px', color: '#fff' }}>{affiliateCode}</span>
                </div>
            </div>

            {/* Packages Section */}
            <div style={{ maxWidth: '1000px', margin: '-3rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', textAlign: 'center' }}>Pilihan Paket Keberangkatan</h2>

                {packages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>Belum ada paket tersedia saat ini.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {packages.map(pkg => {
                            const departure = pkg.departures?.[0];
                            return (
                                <div key={pkg.id} style={{
                                    background: 'var(--color-bg-card)',
                                    borderRadius: '1rem',
                                    border: '1px solid var(--color-border)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        aspectRatio: '4/3',
                                        background: pkg.image ? `url(${pkg.image}) center/cover` : '#2d2b26',
                                    }} />

                                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0', lineHeight: 1.3 }}>{pkg.name}</h3>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--color-text)', fontSize: '0.9rem' }}>
                                            <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>calendar_month</span>
                                            <span style={{ fontWeight: 500 }}>{departure ? formatDate(departure.departureDate) : 'Segera Hadir'}</span>
                                        </div>

                                        {pkg.duration && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem' }}>
                                                <span className="material-symbols-outlined" style={{ color: 'var(--color-text-muted)', fontSize: '20px' }}>schedule</span>
                                                <span>{pkg.duration}</span>
                                            </div>
                                        )}

                                        <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Mulai dari</p>
                                            <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(pkg.basePrice)}</p>
                                        </div>

                                        <Link
                                            to={`/package/${pkg.id}?ref=${affiliateCode}`}
                                            className="btn btn-primary"
                                            style={{ marginTop: '1.5rem', width: '100%', display: 'flex', justifyContent: 'center', padding: '1rem' }}
                                        >
                                            Daftar Sekarang
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer Contact */}
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <p>Ingin bergabung menjadi mitra kami?</p>
                <Link to={`/join/${affiliateCode}`} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>Daftar sebagai Cabang / Agen</Link>
            </div>
        </div>
    );
};
