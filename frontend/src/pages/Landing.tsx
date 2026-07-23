import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import { TestimonialGallery } from '../components/TestimonialGallery';

interface Package {
    id: string;
    name: string;
    slug: string;
    description: string;
    basePrice: number;
    currency?: string;
    image?: string;
    packageType?: string;
    makkahHotel?: any;
    madinahHotel?: any;
    facilities?: string;
    departures?: any[];
}

const fmt = (n: any, currency = 'IDR') => {
    const num = Number(n);
    if (isNaN(num)) return '';
    if (currency === 'USD') return `$ ${num.toLocaleString('en-US')}`;
    if (num >= 1000000) {
        const millions = num / 1000000;
        return `Rp ${millions.toLocaleString('id-ID', { maximumFractionDigits: 1 })} Juta`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
};

interface HeroSlide {
    image: string;
    title: string;
    subtitle: string;
}

interface TrustMarker {
    icon: string;
    label: string;
}

interface NavLink {
    label: string;
    href: string;
}

interface FooterLink {
    label: string;
    url: string;
}

interface PromoBanner {
    enabled: boolean;
    text: string;
    bgColor: string;
}

const Landing = () => {
    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('Semua');
    const [currentSlide, setCurrentSlide] = useState(0);

    // Search Box Dropdown States
    const [selectedDestinasi, setSelectedDestinasi] = useState('Semua Destinasi');
    const [selectedBoardingPoint, setSelectedBoardingPoint] = useState('Semua Kota');
    const [selectedBulan, setSelectedBulan] = useState('Semua Bulan');
    const [selectedTipe, setSelectedTipe] = useState('Semua Tipe');
    const [openDropdown, setOpenDropdown] = useState<'destinasi' | 'boardingPoint' | 'bulan' | 'tipe' | null>(null);

    const [activeFilters, setActiveFilters] = useState({
        destinasi: 'Semua Destinasi',
        boardingPoint: 'Semua Kota',
        bulan: 'Semua Bulan',
        tipe: 'Semua Tipe'
    });

    // Dynamic settings state with sensible defaults
    const [logoUrl, setLogoUrl] = useState('/logo.png');
    const [brandName, setBrandName] = useState('AL');
    const [brandHighlight, setBrandHighlight] = useState('MADINAH');
    const [heroBadge, setHeroBadge] = useState('Penyelenggara Ibadah Umroh Resmi (PPIU)');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
        { image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=2000', title: 'Wujudkan Perjalanan Suci', subtitle: 'Anda Bersama Kami' },
        { image: 'https://images.unsplash.com/photo-1590076215667-875d4ef2d7de?auto=format&fit=crop&q=80&w=2000', title: 'Ibadah Nyaman', subtitle: 'di Tanah Suci' },
        { image: 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19a?auto=format&fit=crop&q=80&w=2000', title: 'Pelayanan Premium', subtitle: 'Harga Terjangkau' },
    ]);
    const [heroSubtitle, setHeroSubtitle] = useState('Platform manajemen haji dan umroh terpadu. Booking, cicilan, dokumen digital, dan notifikasi otomatis dalam satu aplikasi.');
    const [ctaText, setCtaText] = useState('Cari Paket');
    const [navLinks, setNavLinks] = useState<NavLink[]>([{ label: 'Paket Umroh', href: '#paket' }, { label: 'Jadwal', href: '#paket' }]);
    const [packagesTitle, setPackagesTitle] = useState('Paket Pilihan');
    const [packagesSubtitle, setPackagesSubtitle] = useState('Koleksi paket umroh premium kami yang telah dipilih dengan cermat.');
    const [packagesFilters, setPackagesFilters] = useState<string[]>(['Semua', 'Ekonomi', 'Bisnis', 'Luxury VIP']);
    const [trustMarkers, setTrustMarkers] = useState<TrustMarker[]>([
        { icon: 'verified_user', label: 'IATA Certified' },
        { icon: 'policy', label: 'Kemenag Approved' },
        { icon: 'shield_moon', label: 'Halal Guaranteed' },
        { icon: 'support_agent', label: 'Support 24/7' },
    ]);
    const [footerDescription, setFooterDescription] = useState('Standar emas dalam manajemen perjalanan spiritual. Menghubungkan jamaah dengan agen terpercaya untuk pengalaman ibadah yang sempurna.');
    const [footerLinksPlatform, setFooterLinksPlatform] = useState<FooterLink[]>([
        { label: 'Portal Agen', url: '#' }, { label: 'Program Afiliasi', url: '#' },
        { label: 'Panduan Visa', url: '#' }, { label: 'Kontak Kami', url: '#' },
    ]);
    const [footerLinksSupport, setFooterLinksSupport] = useState<FooterLink[]>([
        { label: 'Pusat Bantuan', url: '#' }, { label: 'Syarat & Ketentuan', url: '#' },
        { label: 'Kebijakan Privasi', url: '#' },
    ]);
    const [footerCopyright, setFooterCopyright] = useState('© 2025 Al Madinah. Semua hak dilindungi.');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [promoBanner, setPromoBanner] = useState<PromoBanner>({ enabled: false, text: '', bgColor: '#C8A951' });

    // Load settings from API
    useEffect(() => {
        apiFetch<{ settings: Record<string, any> }>('/api/landing-settings')
            .then(data => {
                const s = data.settings || {};
                const API_URL = import.meta.env.VITE_API_URL || 'https://umroh-api.khibroh.workers.dev';
                const enforceAbsolute = (url?: string) => (url && url.startsWith('/') ? `${API_URL}${url}` : url);

                if (s.logo_url) setLogoUrl(enforceAbsolute(s.logo_url) || '');
                if (s.brand_name) setBrandName(s.brand_name);
                if (s.brand_highlight) setBrandHighlight(s.brand_highlight);
                if (s.hero_badge) setHeroBadge(s.hero_badge);
                if (s.hero_slides && Array.isArray(s.hero_slides) && s.hero_slides.length > 0) {
                    const slides = s.hero_slides.slice(0, 3).map((slide: any) => ({
                        ...slide,
                        image: enforceAbsolute(slide.image) || slide.image
                    }));
                    setHeroSlides(slides);
                }
                if (s.hero_subtitle) setHeroSubtitle(s.hero_subtitle);
                if (s.cta_text) setCtaText(s.cta_text);
                if (s.nav_links && Array.isArray(s.nav_links)) setNavLinks(s.nav_links);
                if (s.packages_title) setPackagesTitle(s.packages_title);
                if (s.packages_subtitle) setPackagesSubtitle(s.packages_subtitle);
                if (s.packages_filters && Array.isArray(s.packages_filters)) setPackagesFilters(s.packages_filters);
                if (s.trust_markers && Array.isArray(s.trust_markers)) setTrustMarkers(s.trust_markers);
                if (s.footer_description) setFooterDescription(s.footer_description);
                if (s.footer_links_platform && Array.isArray(s.footer_links_platform)) setFooterLinksPlatform(s.footer_links_platform);
                if (s.footer_links_support && Array.isArray(s.footer_links_support)) setFooterLinksSupport(s.footer_links_support);
                if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
                if (s.whatsapp_number !== undefined) setWhatsappNumber(String(s.whatsapp_number));
                if (s.instagram_url !== undefined) setInstagramUrl(s.instagram_url);
                if (s.promo_banner && typeof s.promo_banner === 'object') setPromoBanner(s.promo_banner);
            })
            .catch(console.error);
    }, []);

    // Load packages
    useEffect(() => {
        apiFetch<{ packages: Package[] }>('/api/packages')
            .then(data => setPackages(data.packages || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClose = () => setOpenDropdown(null);
        document.addEventListener('click', handleClose);
        return () => document.removeEventListener('click', handleClose);
    }, []);

    // Extract dynamic filters from departures and packages
    const availableMonths = useMemo(() => {
        const monthMap = new Map<string, Date>();
        packages.forEach(pkg => {
            pkg.departures?.forEach((d: any) => {
                if (d.departureDate) {
                    const date = new Date(d.departureDate);
                    if (isNaN(date.getTime())) return;
                    const key = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    if (!monthMap.has(key)) {
                        monthMap.set(key, new Date(date.getFullYear(), date.getMonth(), 1));
                    }
                }
            });
        });
        return Array.from(monthMap.entries())
            .sort((a, b) => a[1].getTime() - b[1].getTime())
            .map(e => e[0]);
    }, [packages]);

    const availableBoardingPoints = useMemo(() => {
        const bpMap = new Map<string, string>(); // code -> city
        packages.forEach(pkg => {
            pkg.departures?.forEach((d: any) => {
                d.boardingPoints?.forEach((bp: any) => {
                    if (bp.airport) {
                        bpMap.set(bp.airport.code, bp.airport.city);
                    }
                });
            });
        });
        return Array.from(bpMap.entries())
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, city]) => `${city} (${code})`);
    }, [packages]);

    const availableTypes = useMemo(() => {
        const types = new Set<string>();
        packages.forEach(pkg => {
            if (pkg.packageType) types.add(pkg.packageType);
        });
        return Array.from(types);
    }, [packages]);

    // Combined package filtering logic
    const filteredPackages = useMemo(() => {
        return packages.filter(pkg => {
            // 1. Tab category filter (activeFilter)
            if (activeFilter !== 'Semua') {
                const f = activeFilter.toLowerCase();
                const type = (pkg.packageType || '').toLowerCase();
                const name = (pkg.name || '').toLowerCase();
                if (!type.includes(f) && !name.includes(f)) return false;
            }

            // 2. Destinasi filter
            if (activeFilters.destinasi !== 'Semua Destinasi') {
                const dest = activeFilters.destinasi;
                if (dest === 'Makkah' && !pkg.makkahHotel) return false;
                if (dest === 'Madinah' && !pkg.madinahHotel) return false;
                if (dest === 'Makkah & Madinah' && (!pkg.makkahHotel || !pkg.madinahHotel)) return false;
            }

            // 2.5. Boarding Point filter
            if (activeFilters.boardingPoint !== 'Semua Kota') {
                const targetCode = activeFilters.boardingPoint.match(/\(([^)]+)\)/)?.[1]; // e.g. "SUB"
                if (targetCode) {
                    const hasMatchingBoardingPoint = pkg.departures?.some((d: any) => {
                        return d.boardingPoints?.some((bp: any) => bp.airport?.code === targetCode);
                    });
                    if (!hasMatchingBoardingPoint) return false;
                }
            }

            // 3. Bulan filter
            if (activeFilters.bulan !== 'Semua Bulan') {
                const hasMatchingDeparture = pkg.departures?.some((d: any) => {
                    if (!d.departureDate) return false;
                    const date = new Date(d.departureDate);
                    if (isNaN(date.getTime())) return false;
                    const formatted = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                    return formatted === activeFilters.bulan;
                });
                if (!hasMatchingDeparture) return false;
            }

            // 4. Tipe filter
            if (activeFilters.tipe !== 'Semua Tipe') {
                const type = (pkg.packageType || '').toLowerCase();
                const filter = activeFilters.tipe.toLowerCase();
                if (!type.includes(filter)) return false;
            }

            return true;
        });
    }, [packages, activeFilter, activeFilters]);

    const handleSearch = (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveFilters({
            destinasi: selectedDestinasi,
            boardingPoint: selectedBoardingPoint,
            bulan: selectedBulan,
            tipe: selectedTipe
        });
        const element = document.getElementById('paket');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Hero slide auto-advance
    const nextSlide = useCallback(() => {
        setCurrentSlide(prev => (prev + 1) % heroSlides.length);
    }, [heroSlides.length]);

    useEffect(() => {
        if (heroSlides.length <= 1) return;
        const timer = setInterval(nextSlide, 5000);
        return () => clearInterval(timer);
    }, [nextSlide, heroSlides.length]);

    // Re-process Instagram embeds on mount robustly
    useEffect(() => {
        let script = document.getElementById('ig-embed-script') as HTMLScriptElement;
        if (!script) {
            script = document.createElement('script');
            script.id = 'ig-embed-script';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        }
        
        const processIg = () => {
            if ((window as any).instgrm) {
                (window as any).instgrm.Embeds.process();
            }
        };

        script.onload = processIg;
        
        // If it was already loaded or cached, run process immediately
        if ((window as any).instgrm) {
            // Small timeout to allow blockquotes to render first
            setTimeout(processIg, 100);
        }
    }, []);

    const currentHero = heroSlides[currentSlide] || heroSlides[0];

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>

            {/* ===== PROMO BANNER ===== */}
            {promoBanner.enabled && promoBanner.text && (
                <div style={{
                    background: promoBanner.bgColor || 'var(--color-primary)',
                    padding: '0.5rem 1rem', textAlign: 'center',
                    fontWeight: 700, fontSize: '0.8125rem', color: '#fff',
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60,
                }}>
                    {promoBanner.text}
                </div>
            )}

            {/* ===== STICKY NAV ===== */}
            <nav className="glass-nav fixed top-0 w-full z-50" style={{
                borderBottom: '1px solid var(--color-border)',
                top: promoBanner.enabled && promoBanner.text ? '32px' : 0,
            }}>
                <div className="container" style={{ height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flexShrink: 1 }}>
                        <div style={{
                            width: '40px', height: '40px',
                            background: 'var(--color-primary)', borderRadius: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', flexShrink: 0
                        }}>
                            <img src={logoUrl} alt="Logo" style={{ width: '30px', height: '30px', objectFit: 'contain' }} />
                        </div>
                        <span className="brand-logo-text" style={{ fontSize: '1.125rem', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {brandName}<span style={{ color: 'var(--color-primary)' }}>{brandHighlight}</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {navLinks.map((link, idx) => (
                            <a key={idx} href={link.href} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', transition: 'color 0.2s' }}
                                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
                                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}>{link.label}</a>
                        ))}
                    </div>

                    <div className="landing-nav-actions" style={{ display: 'flex', gap: '0.75rem' }}>
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

            {/* ===== HERO WITH SLIDES ===== */}
            <section style={{
                position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center',
                paddingTop: promoBanner.enabled && promoBanner.text ? '104px' : '72px', overflow: 'visible',
                zIndex: 20
            }}>
                {/* Slide BG Images */}
                {heroSlides.map((slide, idx) => (
                    <div key={idx} style={{
                        position: 'absolute', inset: 0,
                        opacity: currentSlide === idx ? 1 : 0,
                        transition: 'opacity 1s ease-in-out',
                    }}>
                        <img
                            src={slide.image}
                            alt={slide.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
                        />
                    </div>
                ))}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, var(--color-bg) 0%, rgba(10,9,7,0.4) 60%, transparent 100%)',
                    zIndex: 1,
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 10, paddingBottom: '5rem', paddingTop: '5rem' }}>
                    {/* Text content wrapped in its own max-width container */}
                    <div style={{ maxWidth: '720px', marginBottom: '3rem' }}>
                        {/* Badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.25rem 0.875rem', borderRadius: '9999px',
                            background: 'var(--color-primary-bg)', border: '1px solid var(--color-border-gold)',
                            color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                            {heroBadge}
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900,
                            lineHeight: 1.05, marginBottom: '1.5rem', letterSpacing: '-0.03em',
                        }}>
                            {currentHero.title}<br />
                            <span style={{ color: 'var(--color-primary)', fontStyle: 'italic' }}>{currentHero.subtitle}</span>
                        </h1>

                        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)', maxWidth: '520px', lineHeight: 1.7, marginBottom: '0' }}>
                            {heroSubtitle}
                        </p>
                    </div>

                    {/* Search Box - Outside the text container to allow more width */}
                    <div className="hero-search-box" style={{
                        background: 'rgba(15, 14, 12, 0.75)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '1.5rem',
                        padding: '0.75rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        width: '100%',
                        maxWidth: '1000px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        {[
                            { id: 'destinasi', label: 'Destinasi', value: selectedDestinasi, icon: 'location_on', options: ['Semua Destinasi', 'Makkah & Madinah', 'Makkah', 'Madinah'] },
                            { id: 'boardingPoint', label: 'Keberangkatan', value: selectedBoardingPoint, icon: 'flight_takeoff', options: ['Semua Kota', ...availableBoardingPoints] },
                            { id: 'bulan', label: 'Bulan', value: selectedBulan, icon: 'calendar_month', options: ['Semua Bulan', ...availableMonths] },
                            { id: 'tipe', label: 'Tipe Paket', value: selectedTipe, icon: 'workspace_premium', options: ['Semua Tipe', ...availableTypes] },
                        ].map((item, idx, arr) => (
                            <div 
                                key={item.label} 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenDropdown(openDropdown === item.id ? null : item.id as any);
                                }}
                                style={{
                                    flex: 1,
                                    minWidth: '160px',
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.375rem',
                                    borderRight: idx === arr.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    borderRadius: '1rem',
                                    position: 'relative'
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                <span style={{ 
                                    fontSize: '0.6875rem', 
                                    fontWeight: 800, 
                                    color: 'var(--color-primary)', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '0.15em',
                                    opacity: 0.9
                                }}>
                                    {item.label}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)', opacity: 0.8 }}>{item.icon}</span>
                                        <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={item.value}>{item.value}</span>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>
                                        {openDropdown === item.id ? 'expand_less' : 'expand_more'}
                                    </span>
                                </div>

                                {openDropdown === item.id && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 0.5rem)',
                                        left: 0,
                                        right: 0,
                                        background: 'rgba(25, 23, 20, 0.95)',
                                        backdropFilter: 'blur(16px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '1rem',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.25rem',
                                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
                                        zIndex: 99,
                                        maxHeight: '250px',
                                        overflowY: 'auto'
                                    }}>
                                        {item.options.map(opt => (
                                            <div 
                                                key={opt} 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.id === 'destinasi') setSelectedDestinasi(opt);
                                                    else if (item.id === 'boardingPoint') setSelectedBoardingPoint(opt);
                                                    else if (item.id === 'bulan') setSelectedBulan(opt);
                                                    else if (item.id === 'tipe') setSelectedTipe(opt);
                                                    setOpenDropdown(null);
                                                }} 
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '0.75rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600,
                                                    color: item.value === opt ? 'var(--color-primary)' : 'white',
                                                    background: item.value === opt ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    textAlign: 'left',
                                                }}
                                                onMouseEnter={e => {
                                                    if (item.value !== opt) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                                }}
                                                onMouseLeave={e => {
                                                    if (item.value !== opt) e.currentTarget.style.background = 'transparent';
                                                }}
                                            >
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <button 
                            onClick={handleSearch}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'var(--color-bg)',
                                border: 'none',
                                fontWeight: 850,
                                padding: '1rem 3rem',
                                borderRadius: '1.125rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '0.9375rem',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 10px 20px -5px rgba(200, 168, 81, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(200, 168, 81, 0.5)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 20px -5px rgba(200, 168, 81, 0.3)';
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '22px', fontWeight: 'bold' }}>search</span>
                            {ctaText}
                        </button>
                    </div>

                    {/* Slide Indicators */}
                    {heroSlides.length > 1 && (
                        <div style={{ display: 'flex', gap: '0.625rem', marginTop: '3rem' }}>
                            {heroSlides.map((_, idx) => (
                                <button key={idx} onClick={() => setCurrentSlide(idx)} style={{
                                    width: currentSlide === idx ? '2.5rem' : '0.625rem', height: '0.625rem',
                                    borderRadius: '9999px', border: 'none', cursor: 'pointer',
                                    background: currentSlide === idx ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                }} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ===== INSTAGRAM FEED ===== */}
            <section style={{
                padding: '4rem 0 5rem',
                background: 'var(--color-bg)',
                borderTop: '1px solid var(--color-border)',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div className="container">
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <a
                            href="https://www.instagram.com/almadinahms/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.375rem',
                                textDecoration: 'none', color: 'inherit',
                                transition: 'transform 0.3s ease',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                fontSize: '1.125rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase',
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#ig-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#FCAF45" />
                                            <stop offset="25%" stopColor="#F77737" />
                                            <stop offset="50%" stopColor="#FD1D1D" />
                                            <stop offset="75%" stopColor="#C13584" />
                                            <stop offset="100%" stopColor="#833AB4" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" />
                                    <circle cx="12" cy="12" r="5" />
                                    <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-gradient)" stroke="none" />
                                </svg>
                                <span>Follow Kami di Instagram</span>
                            </div>
                            <div style={{
                                fontSize: '2rem', fontWeight: 900,
                                background: 'linear-gradient(90deg, #833AB4, #C13584, #FD1D1D, #F77737, #FCAF45)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}>
                                @almadinahms
                            </div>
                        </a>
                    </div>

                    {/* Instagram Official Embeds - 3 Posts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '1.5rem',
                        alignItems: 'start',
                        width: '100%',
                        maxWidth: '100%',
                        overflow: 'hidden'
                    }} className="ig-embed-grid">
                        {[
                            'https://www.instagram.com/almadinahms/p/DZr8rUWIATp/',
                            'https://www.instagram.com/almadinahms/p/DCtKZREP1Fn/',
                            'https://www.instagram.com/almadinahms/reel/C85_uP3PYkW/',
                        ].map((embedUrl, idx) => (
                            <div key={idx} style={{
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                border: '1px solid var(--color-border)',
                                background: '#fff',
                                width: '100%',
                                maxWidth: '100%',
                                display: 'flex',
                                justifyContent: 'center'
                            }}>
                                <blockquote
                                    className="instagram-media"
                                    data-instgrm-permalink={embedUrl}
                                    data-instgrm-version="14"
                                    style={{
                                        background: '#FFF',
                                        border: '0',
                                        borderRadius: '3px',
                                        boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                                        margin: '1px',
                                        maxWidth: '100%',
                                        minWidth: '0',
                                        padding: '0',
                                        width: 'calc(100% - 2px)',
                                    }}
                                >
                                </blockquote>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <a
                            href="https://www.instagram.com/almadinahms/"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 2rem',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(135deg, #833AB4, #C13584, #FD1D1D, #F77737)',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.9375rem',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(193,53,132,0.3)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(193,53,132,0.4)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(193,53,132,0.3)';
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" />
                                <circle cx="12" cy="12" r="5" />
                                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                            </svg>
                            Kunjungi Instagram Kami
                        </a>
                    </div>
                </div>
            </section>
            {/* ===== PACKAGES ===== */}
            <section id="paket" style={{ padding: '5rem 0' }}>
                <div className="container">
                    {/* Header */}
                    <div className="package-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                        <div>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{packagesTitle}</h2>
                            <p style={{ color: 'var(--color-text-muted)' }}>{packagesSubtitle}</p>
                        </div>
                        {/* Filter tabs */}
                        <div style={{
                            display: 'flex', gap: '0.25rem', padding: '0.25rem',
                            background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem',
                            border: '1px solid var(--color-border)'
                        }}>
                            {packagesFilters.map(f => (
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
                        )) : filteredPackages.length === 0 ? (
                            <div style={{
                                gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', color: 'var(--color-text-muted)',
                                border: '2px dashed var(--color-border)', borderRadius: '1rem'
                            }}>
                                Belum ada paket yang tersedia dengan kriteria pencarian ini.
                            </div>
                        ) : filteredPackages.map((pkg, idx) => (
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.25rem', wordBreak: 'break-word' }}>{pkg.name}</h3>
                                            <div style={{ display: 'flex', gap: '2px', color: 'var(--color-primary)' }}>
                                                {[...Array(pkg.makkahHotel?.starRating || 4)].map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>star</span>
                                                ))}
                                                <span style={{ fontSize: '0.625rem', color: '#888', marginLeft: '6px', alignSelf: 'center' }}>({pkg.packageType || 'Reguler'})</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-text-muted)' }}>Mulai dari</span>
                                            <div style={{ fontSize: '1.375rem', fontWeight: 900, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
                                                {fmt(pkg.basePrice, pkg.currency)}
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

                                    <Link to={`/paket/${pkg.slug}`} style={{
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
            </section>

            {/* ===== TESTIMONIALS ===== */}
            <TestimonialGallery />

            {/* ===== INSTAGRAM EMBED ===== */}
            {instagramUrl && (
                <section style={{ padding: '4rem 0', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <div className="container" style={{ maxWidth: '100%', overflow: 'hidden' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '1.75rem', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--color-primary)' }}>photo_camera</span>
                                Follow Kami di Instagram
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Lihat kegiatan dan pengalaman jamaah kami</p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                            <iframe
                                src={`${instagramUrl.replace(/\/$/, '')}/embed`}
                                width="100%"
                                height="480"
                                frameBorder="0"
                                style={{ borderRadius: '1rem', border: '1px solid var(--color-border)', maxWidth: '540px', width: '100%', background: '#fff' }}
                                title="Instagram Feed"
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* ===== TRUST MARKERS ===== */}
            {trustMarkers.length > 0 && (
                <section style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '3rem 0' }}>
                    <div className="container">
                        <div className="trust-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(trustMarkers.length, 4)}, 1fr)`, gap: '2rem', opacity: 0.7 }}>
                            {trustMarkers.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>{item.icon}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== FOOTER ===== */}
            <footer style={{ padding: '4rem 0 2rem', background: 'var(--color-bg)' }}>
                <div className="container">
                    <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    <img src={logoUrl} alt="Logo" style={{ width: '26px', height: '26px', objectFit: 'contain' }} />
                                </div>
                                <span style={{ fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                                    {brandName}<span style={{ color: 'var(--color-primary)' }}>{brandHighlight}</span>
                                </span>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.7, maxWidth: '300px' }}>
                                {footerDescription}
                            </p>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Platform</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {footerLinksPlatform.map((l, idx) => (
                                    <li key={idx}><a href={l.url} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }}>{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '1.25rem' }}>Dukungan</h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                {footerLinksSupport.map((l, idx) => (
                                    <li key={idx}><a href={l.url} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', transition: 'color 0.2s' }}>{l.label}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{footerCopyright}</p>
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                            {['Privasi', 'Ketentuan'].map(l => (
                                <a key={l} href="#" style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{l}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Floating */}
            {whatsappNumber && (
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="wa-float-btn" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'absolute', inset: 0, borderRadius: '9999px',
                            background: '#25D366', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.3
                        }} />
                        <div className="wa-float-inner" style={{
                            position: 'relative', width: '60px', height: '60px', borderRadius: '9999px',
                            background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 32px rgba(37,211,102,0.4)', transition: 'transform 0.2s'
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" width="28" height="28">
                                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.97l-1.128 4.125 4.223-1.108a7.843 7.843 0 0 0 3.784.975h.002c4.368 0 7.926-3.558 7.93-7.93a7.897 7.897 0 0 0-2.333-5.59z" />
                            </svg>
                        </div>
                    </div>
                </a>
            )}

            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
