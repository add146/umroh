import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../lib/api';
import * as htmlToImage from 'html-to-image';

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

interface ShareCardsProps {
    affiliateCode: string;
    resellerName: string;
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const ShareCards: React.FC<ShareCardsProps> = ({ affiliateCode, resellerName }) => {
    const [packages, setPackages] = useState<PackageData[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const hiddenRef = useRef<HTMLDivElement>(null);
    const frontendUrl = window.location.origin;

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await apiClient.get('/marketing-kit/share-cards');
                if (res.packages) {
                    setPackages(res.packages);
                }
            } catch (err) {
                console.error('Failed to fetch share cards', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const handleShareWA = (pkg: PackageData) => {
        const refLink = `${frontendUrl}/package/${pkg.id}?ref=${affiliateCode}`;
        const dateStr = pkg.departures?.[0] ? formatDate(pkg.departures[0].departureDate) : 'Segera Hadir';
        const price = formatCurrency(pkg.basePrice);

        const text = `Assalamualaikum 🙏\n\nAda kabar gembira! Spesial untuk Anda, *${pkg.name}* bersama Al Madinah.\n\n📅 Keberangkatan: ${dateStr}\n💳 Harga Mulai: ${price}\n\nDaftar sekarang dan amankan seat Anda melalui link berikut:\n🔗 ${refLink}\n\nInfo lebih lanjut, silakan balas pesan ini.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleDownloadStory = async (pkg: PackageData) => {
        if (!hiddenRef.current) return;
        setGeneratingId(pkg.id);

        try {
            // Find the specific hidden card for this package
            const el = document.getElementById(`story-card-${pkg.id}`);
            if (!el) throw new Error('Element not found');

            // Temporarily make it visible but absolute and huge so it renders exactly at 1080x1920
            el.style.display = 'flex';

            const dataUrl = await htmlToImage.toPng(el, {
                quality: 0.95,
                width: 1080,
                height: 1920,
                pixelRatio: 1 // Keep it exactly 1080x1920, don't scale by screen DPI
            });

            el.style.display = 'none';

            const link = document.createElement('a');
            link.download = `Promo_${pkg.name.replace(/\s+/g, '_')}_Story.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Failed to generate image', error);
            alert('Gagal membuat gambar. Silakan coba lagi.');
        } finally {
            setGeneratingId(null);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat marketing kit...</div>;
    }

    if (packages.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: 'var(--color-border)', marginBottom: '1rem' }}>imagesmode</span>
                <p style={{ color: 'var(--color-text-light)' }}>Belum ada paket aktif untuk dibagikan saat ini.</p>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {packages.map(pkg => {
                    const departure = pkg.departures?.[0];
                    return (
                        <div key={pkg.id} style={{
                            background: 'var(--color-bg-card)',
                            borderRadius: '1rem',
                            border: '1px solid var(--color-border)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Card Image Preview */}
                            <div style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                background: pkg.image ? `url(${pkg.image}) center/cover` : '#2d2b26',
                                position: 'relative'
                            }}>
                                <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--color-primary)', color: '#000', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    Promo
                                </div>
                            </div>

                            {/* Card Content */}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.3 }}>{pkg.name}</h3>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                                    <span>{departure ? formatDate(departure.departureDate) : 'Segera Hadir'}</span>
                                </div>

                                {pkg.duration && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--color-text-light)', fontSize: '0.85rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                                        <span>{pkg.duration}</span>
                                    </div>
                                )}

                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Harga Mulai</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>{formatCurrency(pkg.basePrice)}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleShareWA(pkg)}
                                    style={{
                                        flex: 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        padding: '0.6rem', borderRadius: '0.5rem',
                                        background: '#25D366', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span> WA
                                </button>
                                <button
                                    onClick={() => handleDownloadStory(pkg)}
                                    disabled={generatingId === pkg.id}
                                    style={{
                                        flex: 2,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        padding: '0.6rem', borderRadius: '0.5rem',
                                        background: 'var(--color-primary-bg)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, cursor: generatingId === pkg.id ? 'wait' : 'pointer'
                                    }}
                                >
                                    {generatingId === pkg.id ? (
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: 'spin 1s linear infinite' }}>autorenew</span>
                                    ) : (
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                    )}
                                    {generatingId === pkg.id ? 'Memproses...' : 'Unduh IG Story'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Hidden Container for 1080x1920 Story Generation */}
            <div ref={hiddenRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
                {packages.map(pkg => {
                    const departure = pkg.departures?.[0];
                    return (
                        <div
                            id={`story-card-${pkg.id}`}
                            key={`hidden-${pkg.id}`}
                            style={{
                                width: '1080px',
                                height: '1920px',
                                background: '#11100e', // Dark theme background
                                display: 'none', // toggled just before capture
                                flexDirection: 'column',
                                fontFamily: '"Inter", sans-serif',
                                color: '#ffffff',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Top Image Splash */}
                            <div style={{
                                width: '1080px',
                                height: '1080px',
                                background: pkg.image ? `url(${pkg.image}) center/cover` : '#2d2b26',
                                position: 'relative'
                            }}>
                                {/* Gradient overlay bridging image to solid dark */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #11100e 100%)' }} />

                                <div style={{ position: 'absolute', top: '60px', left: '60px', background: '#c8a851', color: '#000', padding: '16px 40px', borderRadius: '99px', fontSize: '2rem', fontWeight: 800 }}>
                                    PROMO UMROH
                                </div>
                            </div>

                            {/* Content Area */}
                            <div style={{ padding: '0 80px', flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, marginTop: '-100px' }}>
                                <h1 style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '40px', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                                    {pkg.name}
                                </h1>

                                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '32px', padding: '40px', gap: '40px', border: '2px solid rgba(200,168,81,0.3)', marginBottom: '40px' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '1.5rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Keberangkatan</p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#c8a851' }}>{departure ? formatDate(departure.departureDate) : 'Segera Hadir'}</p>
                                    </div>
                                    <div style={{ width: '2px', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '1.5rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Durasi</p>
                                        <p style={{ fontSize: '2.5rem', fontWeight: 700, color: '#c8a851' }}>{pkg.duration || '9 Hari'}</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', background: 'rgba(200,168,81,0.1)', border: '2px dashed #c8a851', borderRadius: '32px', padding: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <p style={{ fontSize: '2rem', color: '#a1a1aa', marginBottom: '10px' }}>Harga Mulai Dari</p>
                                    <p style={{ fontSize: '4.5rem', fontWeight: 900, color: '#c8a851' }}>{formatCurrency(pkg.basePrice)}</p>
                                </div>
                            </div>

                            {/* Footer / Reseller Info */}
                            <div style={{ padding: '60px 80px', borderTop: '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '40px' }}>
                                <div style={{ width: '120px', height: '120px', background: '#c8a851', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '60px', color: '#000' }}>person</span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '1.5rem', color: '#a1a1aa', marginBottom: '10px' }}>Daftar melalui Agent Referensi:</p>
                                    <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{resellerName}</p>
                                </div>
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.5rem', color: '#a1a1aa', marginBottom: '10px' }}>Atau gunakan kode:</p>
                                    <p style={{ fontSize: '3rem', fontWeight: 900, color: '#c8a851', letterSpacing: '4px' }}>{affiliateCode}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
