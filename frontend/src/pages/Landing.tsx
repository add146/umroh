import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

interface Package {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    image?: string;
    packageType?: string;
    makkahHotel?: any;
    madinahHotel?: any;
    facilities?: string;
}

const Landing = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Semua');

    const filters = ['Semua', 'Ekonomi', 'Bisnis', 'Luxury VIP'];

    useEffect(() => {
        apiFetch<{ packages: Package[] }>('/api/packages')
            .then(data => setPackages(data.packages || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>

            {/* ===== STICKY NAV ===== */}
            <nav className="glass-nav fixed top-0 w-full z-50" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="container" style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'var(--color-primary)', borderRadius: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-bg)', fontWeight: 900
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                        </div>
                        <span style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase' }}>
                            AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <a href="#paket" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>Paket Umroh</a>
                        <a href="#paket" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>Jadwal</a>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/login" style={{
                            padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 700,
                            border: '1px solid var(--color-border-gold)', borderRadius: '0.5rem',
                            transition: 'all 0.2s'
                        }}>Login</Link>
                        <Link to="/register" style={{
                            padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 700,
                            background: 'var(--color-primary)', color: 'var(--color-bg)',
                            borderRadius: '0.5rem', transition: 'all 0.2s'
                        }}>Daftar Sekarang</Link>
                    </div>
                </div>
            </nav>

            {/* ===== HERO ===== */}
            <section style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '72px', overflow: 'hidden' }}>
                {/* BG Image */}
                <div style={{ position: 'absolute', inset: 0 }}>
                    <img
                        src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=2000"
                        alt="Ka'bah Makkah"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                    />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, var(--color-bg) 0%, rgba(10,9,7,0.4) 60%, transparent 100%)'
                    }} />
                </div>

                <div className="container" style={{ position: 'relative', zIndex: 10, paddingBottom: '5rem', paddingTop: '5rem' }}>
                    <div style={{ maxWidth: '720px' }}>
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.25rem 0.875rem', borderRadius: '9999px',
                            background: 'var(--color-primary-bg)', border: '1px solid var(--color-border-gold)',
                            color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                            Penyelenggara Ibadah Umroh Resmi (PPIU)
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900,
                            lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.03em'
                        }}>
                            Wujudkan Perjalanan Suci<br />
                            <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>Anda Bersama Kami</span>
                        </h1>

                        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '520px', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                            Platform manajemen haji dan umroh terpadu. Booking, cicilan, dokumen digital, dan notifikasi otomatis dalam satu aplikasi.
                        </p>

                        {/* Search Box */}
                        <div style={{
                            background: 'rgba(10,9,7,0.85)', backdropFilter: 'blur(16px)',
                            border: '1px solid var(--color-border)', borderRadius: '1rem',
                            padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem'
                        }}>
                            {[
                                { label: 'Destinasi', value: 'Makkah & Madinah', icon: 'location_on' },
                                { label: 'Bulan', value: 'Ramadan 2025', icon: 'calendar_month' },
                                { label: 'Tipe Paket', value: 'Luxury 5-Star', icon: 'workspace_premium' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    flex: 1, minWidth: '150px', padding: '0.75rem 1rem',
                                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                                    borderRight: '1px solid var(--color-border)', cursor: 'pointer'
                                }}>
                                    <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-text-muted)' }}>{item.icon}</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.value}</span>
                                    </div>
                                </div>
                            ))}
                            <Link to="/register" style={{
                                background: 'var(--color-primary)', color: 'var(--color-bg)',
                                fontWeight: 800, padding: '0.875rem 2rem', borderRadius: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none',
                                fontSize: '0.875rem', whiteSpace: 'nowrap'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>search</span>
                                Cari Paket
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== PACKAGES ===== */}
            <section id="paket" style={{ padding: '5rem 0' }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Paket Pilihan</h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>Koleksi paket umroh premium kami yang telah dipilih dengan cermat.</p>
                        </div>
                        {/* Filter tabs */}
                        <div style={{
                            display: 'flex', gap: '0.25rem', padding: '0.25rem',
                            background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem',
                            border: '1px solid var(--color-border)'
                        }}>
                            {filters.map(f => (
                                <button key={f} onClick={() => setActiveFilter(f)} style={{
                                    padding: '0.375rem 1rem', borderRadius: '0.375rem', fontSize: '0.8125rem', fontWeight: 600,
                                    background: activeFilter === f ? 'var(--color-primary)' : 'transparent',
                                    color: activeFilter === f ? 'var(--color-bg)' : 'var(--color-text-muted)',
                                    transition: 'all 0.2s'
                                }}>{f}</button>
                            ))}
                        </div>
                    </div>

                    {/* Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                        {loading ? [1, 2, 3].map(i => (
                            <div key={i} style={{ height: '440px', borderRadius: '1rem' }} className="skeleton" />
                        )) : packages.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', color: 'var(--color-text-muted)',
                                border: '2px dashed var(--color-border)', borderRadius: '1rem'
                            }}>
                                Belum ada paket yang tersedia.
                            </div>
                        ) : packages.map((pkg, idx) => (
                            <div key={pkg.id} className="dark-card" style={{
                                borderRadius: '1rem', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', transition: 'all 0.3s'
                            }}>
                                {/* Image */}
                                <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
                                    <img
                                        src={pkg.image || `https://images.unsplash.com/photo-159160412993${idx}-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=600`}
                                        alt={pkg.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    />
                                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.625rem', borderRadius: '9999px', fontSize: '0.6875rem',
                                            fontWeight: 700, textTransform: 'uppercase',
                                            background: idx === 0 ? '#1B5E20' : idx === 1 ? '#dc2626' : 'var(--color-primary)',
                                            color: idx === 1 ? '#fff' : idx === 0 ? '#fff' : 'var(--color-bg)'
                                        }}>
                                            {idx === 0 ? 'New Offering' : idx === 1 ? 'Selling Fast' : 'Best Value'}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem' }}>{pkg.name}</h3>
                                            <div style={{ display: 'flex', gap: '2px', color: 'var(--color-primary)' }}>
                                                {[...Array(pkg.makkahHotel?.starRating || 4)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>star</span>
                                                ))}
                                                <span style={{ fontSize: '0.625rem', color: '#888', marginLeft: '6px', alignSelf: 'center' }}>({pkg.packageType || 'Reguler'})</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)' }}>Mulai dari</span>
                                            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(pkg.basePrice)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hotel Info Snippet */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.6875rem', color: '#aaa', alignItems: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_city</span>
                                        <span className="truncate">{pkg.makkahHotel?.name || 'Hotel Makkah'} &amp; {pkg.madinahHotel?.name || 'Hotel Madinah'}</span>
                                    </div>

                                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: '1.25rem', flex: 1 }}>
                                        {pkg.description?.slice(0, 100) || 'Dapatkan pengalaman beribadah yang nyaman di tanah suci bersama Al Madinah Tour & Travel.'}...
                                    </p>

                                    {/* Quota bar */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>Kuota</span>
                                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)' }}>Tersedia</span>
                                        </div>
                                        <div className="quota-bar">
                                            <div className="quota-fill" style={{ width: `${60 + idx * 10}%` }} />
                                        </div>
                                    </div>

                                    <Link to={`/register?package=${pkg.id}`} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        padding: '0.75rem', background: 'rgba(255,255,255,0.08)',
                                        borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem',
                                        color: 'var(--color-text)', textDecoration: 'none', transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = 'var(--color-primary)';
                                            e.currentTarget.style.color = 'var(--color-bg)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                            e.currentTarget.style.color = 'var(--color-text)';
                                        }}>
                                        Lihat Detail
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* ===== TRUST MARKERS ===== */}
            < section style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '3rem 0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', opacity: 0.7 }}>
                        {[
                            { icon: 'verified_user', label: 'IATA Certified' },
                            { icon: 'policy', label: 'Kemenag Approved' },
                            { icon: 'shield_moon', label: 'Halal Guaranteed' },
                            { icon: 'support_agent', label: 'Support 24/7' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{item.icon}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section >

            {/* ===== FOOTER ===== */}
            < footer style={{ padding: '4rem 0 2rem', background: 'var(--color-bg)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-bg)', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                                </div>
                                <span style={{ fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span></span>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '300px' }}>
                                Standar emas dalam manajemen perjalanan spiritual. Menghubungkan jamaah dengan agen terpercaya untuk pengalaman ibadah yang sempurna.
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Platform</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {['Portal Agen', 'Program Afiliasi', 'Panduan Visa', 'Kontak Kami'].map(l => (
                                    <li key={l}><a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }}>{l}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Dukungan</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {['Pusat Bantuan', 'Syarat & Ketentuan', 'Kebijakan Privasi'].map(l => (
                                    <li key={l}><a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }}>{l}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>© 2025 Al Madinah. Semua hak dilindungi.</p>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            {['Privasi', 'Ketentuan'].map(l => (
                                <a key={l} href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer >

            {/* WhatsApp Floating */}
            < a href="https://wa.me/" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: '9999px',
                        background: '#25D366', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.3
                    }} />
                    <div style={{
                        position: 'relative', width: '60px', height: '60px', borderRadius: '9999px',
                        background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(37,211,102,0.4)', transition: 'transform 0.2s'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" width="28" height="28">
                            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.97l-1.128 4.125 4.223-1.108a7.843 7.843 0 0 0 3.784.975h.002c4.368 0 7.926-3.558 7.93-7.93a7.897 7.897 0 0 0-2.333-5.59z" />
                        </svg>
                    </div>
                </div>
            </a >

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div >
    );
};

export default Landing;
