import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

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

interface SocialMedia {
    platform: string;
    url: string;
    icon: string;
}

interface PromoBanner {
    enabled: boolean;
    text: string;
    bgColor: string;
}

type TabName = 'branding' | 'hero' | 'paket' | 'navigasi' | 'trust' | 'footer' | 'social' | 'promo';

const TABS: { key: TabName; label: string; icon: string }[] = [
    { key: 'branding', label: 'Branding', icon: 'palette' },
    { key: 'hero', label: 'Hero Slides', icon: 'slideshow' },
    { key: 'paket', label: 'Paket Umroh', icon: 'inventory_2' },
    { key: 'navigasi', label: 'Navigasi', icon: 'menu' },
    { key: 'trust', label: 'Trust Markers', icon: 'verified' },
    { key: 'footer', label: 'Footer', icon: 'bottom_navigation' },
    { key: 'social', label: 'Social Media', icon: 'share' },
    { key: 'promo', label: 'Promo Banner', icon: 'campaign' },
];

const MATERIAL_ICONS = [
    'verified_user', 'policy', 'shield_moon', 'support_agent', 'security', 'workspace_premium',
    'star', 'diamond', 'eco', 'mosque', 'flight', 'hotel', 'luggage', 'payments',
    'groups', 'handshake', 'favorite', 'thumb_up', 'check_circle', 'local_offer',
];

const LandingPageEditor = () => {
    const [activeTab, setActiveTab] = useState<TabName>('branding');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    // All settings state
    const [logoUrl, setLogoUrl] = useState('/logo.png');
    const [brandName, setBrandName] = useState('AL');
    const [brandHighlight, setBrandHighlight] = useState('MADINAH');
    const [primaryColor, setPrimaryColor] = useState('#C8A951');

    const [heroBadge, setHeroBadge] = useState('');
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
        { image: '', title: '', subtitle: '' },
        { image: '', title: '', subtitle: '' },
        { image: '', title: '', subtitle: '' },
    ]);
    const [heroSubtitle, setHeroSubtitle] = useState('');
    const [ctaText, setCtaText] = useState('Cari Paket');
    const [ctaLink, setCtaLink] = useState('/register');

    const [packagesTitle, setPackagesTitle] = useState('Paket Pilihan');
    const [packagesSubtitle, setPackagesSubtitle] = useState('');
    const [packagesFilters, setPackagesFilters] = useState<string[]>(['Semua']);

    const [navLinks, setNavLinks] = useState<NavLink[]>([]);
    const [trustMarkers, setTrustMarkers] = useState<TrustMarker[]>([]);

    const [footerDescription, setFooterDescription] = useState('');
    const [footerLinksPlatform, setFooterLinksPlatform] = useState<FooterLink[]>([]);
    const [footerLinksSupport, setFooterLinksSupport] = useState<FooterLink[]>([]);
    const [footerCopyright, setFooterCopyright] = useState('');

    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [socialMedia, setSocialMedia] = useState<SocialMedia[]>([]);

    const [promoBanner, setPromoBanner] = useState<PromoBanner>({ enabled: false, text: '', bgColor: '#C8A951' });

    // Load existing settings
    useEffect(() => {
        apiFetch<{ settings: Record<string, any> }>('/api/landing-settings')
            .then(data => {
                const s = data.settings || {};
                if (s.logo_url) setLogoUrl(s.logo_url);
                if (s.brand_name) setBrandName(s.brand_name);
                if (s.brand_highlight) setBrandHighlight(s.brand_highlight);
                if (s.primary_color) setPrimaryColor(s.primary_color);
                if (s.hero_badge) setHeroBadge(s.hero_badge);
                if (s.hero_slides) {
                    const slides = Array.isArray(s.hero_slides) ? s.hero_slides : [];
                    // Ensure exactly 3 slides
                    while (slides.length < 3) slides.push({ image: '', title: '', subtitle: '' });
                    setHeroSlides(slides.slice(0, 3));
                }
                if (s.hero_subtitle) setHeroSubtitle(s.hero_subtitle);
                if (s.cta_text) setCtaText(s.cta_text);
                if (s.cta_link) setCtaLink(s.cta_link);
                if (s.packages_title) setPackagesTitle(s.packages_title);
                if (s.packages_subtitle) setPackagesSubtitle(s.packages_subtitle);
                if (s.packages_filters) setPackagesFilters(Array.isArray(s.packages_filters) ? s.packages_filters : ['Semua']);
                if (s.nav_links) setNavLinks(Array.isArray(s.nav_links) ? s.nav_links : []);
                if (s.trust_markers) setTrustMarkers(Array.isArray(s.trust_markers) ? s.trust_markers : []);
                if (s.footer_description) setFooterDescription(s.footer_description);
                if (s.footer_links_platform) setFooterLinksPlatform(Array.isArray(s.footer_links_platform) ? s.footer_links_platform : []);
                if (s.footer_links_support) setFooterLinksSupport(Array.isArray(s.footer_links_support) ? s.footer_links_support : []);
                if (s.footer_copyright) setFooterCopyright(s.footer_copyright);
                if (s.whatsapp_number !== undefined) setWhatsappNumber(s.whatsapp_number);
                if (s.instagram_url !== undefined) setInstagramUrl(s.instagram_url);
                if (s.social_media) setSocialMedia(Array.isArray(s.social_media) ? s.social_media : []);
                if (s.promo_banner) setPromoBanner(typeof s.promo_banner === 'object' ? s.promo_banner : { enabled: false, text: '', bgColor: '#C8A951' });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settings = [
                { key: 'logo_url', value: logoUrl },
                { key: 'brand_name', value: brandName },
                { key: 'brand_highlight', value: brandHighlight },
                { key: 'primary_color', value: primaryColor },
                { key: 'hero_badge', value: heroBadge },
                { key: 'hero_slides', value: heroSlides },
                { key: 'hero_subtitle', value: heroSubtitle },
                { key: 'cta_text', value: ctaText },
                { key: 'cta_link', value: ctaLink },
                { key: 'packages_title', value: packagesTitle },
                { key: 'packages_subtitle', value: packagesSubtitle },
                { key: 'packages_filters', value: packagesFilters },
                { key: 'nav_links', value: navLinks },
                { key: 'trust_markers', value: trustMarkers },
                { key: 'footer_description', value: footerDescription },
                { key: 'footer_links_platform', value: footerLinksPlatform },
                { key: 'footer_links_support', value: footerLinksSupport },
                { key: 'footer_copyright', value: footerCopyright },
                { key: 'whatsapp_number', value: whatsappNumber },
                { key: 'instagram_url', value: instagramUrl },
                { key: 'social_media', value: socialMedia },
                { key: 'promo_banner', value: promoBanner },
            ];
            await apiFetch('/api/landing-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings }),
            });
            showToast('Semua perubahan berhasil disimpan!');
        } catch (err: any) {
            showToast('Gagal menyimpan: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // === Helpers for dynamic lists ===
    const updateSlide = (idx: number, field: keyof HeroSlide, val: string) => {
        const copy = [...heroSlides];
        copy[idx] = { ...copy[idx], [field]: val };
        setHeroSlides(copy);
    };

    // File upload helper
    const handleImageUpload = async (file: File, callback: (url: string) => void) => {
        const fd = new FormData();
        fd.append('image', file);
        try {
            const res = await apiFetch<{ url: string }>('/api/upload/imgbb', { method: 'POST', body: fd });
            if (res.url) callback(res.url);
        } catch (err: any) {
            showToast('Upload gagal: ' + err.message, 'error');
        }
    };

    // Styles
    const cardStyle: React.CSSProperties = {
        background: 'var(--color-card-bg)', border: '1px solid var(--color-border)',
        borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.25rem',
    };
    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.5rem',
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.625rem 0.75rem', borderRadius: '0.5rem',
        border: '1px solid var(--color-border)', background: 'var(--color-bg)',
        color: 'var(--color-text)', fontSize: '0.875rem', outline: 'none',
    };
    const btnDanger: React.CSSProperties = {
        padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
        background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '0.375rem', cursor: 'pointer',
    };
    const btnAdd: React.CSSProperties = {
        padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
        background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
        border: '1px dashed var(--color-primary)', borderRadius: '0.5rem', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '0.375rem',
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>autorenew</span>
                <p style={{ marginTop: '0.5rem' }}>Memuat pengaturan...</p>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '1.5rem', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--color-primary)' }}>web</span>
                        Edit Landing Page
                    </h1>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Kelola tampilan halaman utama website publik</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a href="/" target="_blank" style={{
                        padding: '0.625rem 1.25rem', fontSize: '0.8125rem', fontWeight: 700,
                        border: '1px solid var(--color-border)', borderRadius: '0.5rem',
                        display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none',
                        color: 'var(--color-text)',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                        Preview
                    </a>
                    <button onClick={handleSave} disabled={saving} style={{
                        padding: '0.625rem 1.5rem', fontSize: '0.8125rem', fontWeight: 700,
                        background: 'var(--color-primary)', color: 'var(--color-bg)',
                        border: 'none', borderRadius: '0.5rem', cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: saving ? 0.7 : 1,
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {saving ? 'hourglass_empty' : 'save'}
                        </span>
                        {saving ? 'Menyimpan...' : 'Simpan Semua'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', marginBottom: '1.5rem', padding: '0.25rem', background: 'var(--color-card-bg)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        padding: '0.625rem 1rem', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 600,
                        background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === tab.key ? 'var(--color-bg)' : 'var(--color-text-muted)',
                        border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                        display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.2s',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ===== TAB: BRANDING ===== */}
            {activeTab === 'branding' && (
                <div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Logo & Nama Brand</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>URL Logo</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="text" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="/logo.png" />
                                    <label style={{
                                        padding: '0.5rem 0.75rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                        borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap',
                                        border: '1px solid var(--color-border-gold)',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                                        Upload
                                        <input type="file" accept="image/*" hidden onChange={e => {
                                            if (e.target.files?.[0]) handleImageUpload(e.target.files[0], url => setLogoUrl(url));
                                        }} />
                                    </label>
                                </div>
                                {logoUrl && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '0.5rem', border: '1px solid var(--color-border)', display: 'inline-block' }}>
                                        <img src={logoUrl} alt="Logo preview" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}>Warna Utama (Primary Color)</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: '48px', height: '40px', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }} />
                                    <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={inputStyle} placeholder="#C8A951" />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Nama Brand (Bagian Depan)</label>
                                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} style={inputStyle} placeholder="AL" />
                            </div>
                            <div>
                                <label style={labelStyle}>Nama Brand (Bagian Highlight)</label>
                                <input type="text" value={brandHighlight} onChange={e => setBrandHighlight(e.target.value)} style={inputStyle} placeholder="MADINAH" />
                            </div>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                            <label style={{ ...labelStyle, marginBottom: '0.375rem' }}>Preview Nama Brand</label>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', textTransform: 'uppercase' as const }}>
                                {brandName}<span style={{ color: primaryColor }}>{brandHighlight}</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: HERO SLIDES ===== */}
            {activeTab === 'hero' && (
                <div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Hero Badge</h3>
                        <label style={labelStyle}>Teks Badge (ditampilkan di atas judul)</label>
                        <input type="text" value={heroBadge} onChange={e => setHeroBadge(e.target.value)} style={inputStyle} placeholder="Penyelenggara Ibadah Umroh Resmi (PPIU)" />
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Subtitle</h3>
                        <label style={labelStyle}>Paragraf deskripsi di bawah judul</label>
                        <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Platform manajemen haji dan umroh terpadu..." />
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>3 Slide Carousel</h3>
                        {heroSlides.map((slide, idx) => (
                            <div key={idx} style={{ padding: '1rem', marginBottom: '1rem', background: 'var(--color-bg)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>image</span>
                                    <strong style={{ fontSize: '0.875rem' }}>Slide {idx + 1}</strong>
                                </div>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <div>
                                        <label style={labelStyle}>URL Gambar Background</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="text" value={slide.image} onChange={e => updateSlide(idx, 'image', e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder="https://..." />
                                            <label style={{
                                                padding: '0.5rem 0.75rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                                borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap',
                                                border: '1px solid var(--color-border-gold)',
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload</span>
                                                Upload
                                                <input type="file" accept="image/*" hidden onChange={e => {
                                                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], url => updateSlide(idx, 'image', url));
                                                }} />
                                            </label>
                                        </div>
                                        {slide.image && <img src={slide.image} alt={`Slide ${idx + 1}`} style={{ maxHeight: '120px', marginTop: '0.5rem', borderRadius: '0.375rem', objectFit: 'cover' }} />}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <div>
                                            <label style={labelStyle}>Judul (Baris 1)</label>
                                            <input type="text" value={slide.title} onChange={e => updateSlide(idx, 'title', e.target.value)} style={inputStyle} placeholder="Wujudkan Perjalanan Suci" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Subtitle (Baris 2 - Highlight)</label>
                                            <input type="text" value={slide.subtitle} onChange={e => updateSlide(idx, 'subtitle', e.target.value)} style={inputStyle} placeholder="Anda Bersama Kami" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Tombol CTA</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Teks Tombol</label>
                                <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} style={inputStyle} placeholder="Cari Paket" />
                            </div>
                            <div>
                                <label style={labelStyle}>Link Tujuan</label>
                                <input type="text" value={ctaLink} onChange={e => setCtaLink(e.target.value)} style={inputStyle} placeholder="/register" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB: PAKET UMROH ===== */}
            {activeTab === 'paket' && (
                <div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Section Paket Umroh</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Judul Section</label>
                                <input type="text" value={packagesTitle} onChange={e => setPackagesTitle(e.target.value)} style={inputStyle} placeholder="Paket Pilihan" />
                            </div>
                            <div>
                                <label style={labelStyle}>Subtitle Section</label>
                                <input type="text" value={packagesSubtitle} onChange={e => setPackagesSubtitle(e.target.value)} style={inputStyle} placeholder="Koleksi paket umroh premium kami..." />
                            </div>
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Filter Paket</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Label filter yang ditampilkan di atas daftar paket. "Semua" selalu ditampilkan pertama.
                        </p>
                        {packagesFilters.map((f, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input type="text" value={f} onChange={e => {
                                    const copy = [...packagesFilters]; copy[idx] = e.target.value; setPackagesFilters(copy);
                                }} style={{ ...inputStyle, flex: 1 }} />
                                {idx > 0 && <button onClick={() => setPackagesFilters(packagesFilters.filter((_, i) => i !== idx))} style={btnDanger}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>}
                            </div>
                        ))}
                        <button onClick={() => setPackagesFilters([...packagesFilters, ''])} style={btnAdd}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                            Tambah Filter
                        </button>
                    </div>
                </div>
            )}

            {/* ===== TAB: NAVIGASI ===== */}
            {activeTab === 'navigasi' && (
                <div style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Link Navigasi</h3>
                    {navLinks.map((link, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                            <input type="text" value={link.label} onChange={e => {
                                const copy = [...navLinks]; copy[idx] = { ...copy[idx], label: e.target.value }; setNavLinks(copy);
                            }} style={{ ...inputStyle, flex: 1 }} placeholder="Label" />
                            <input type="text" value={link.href} onChange={e => {
                                const copy = [...navLinks]; copy[idx] = { ...copy[idx], href: e.target.value }; setNavLinks(copy);
                            }} style={{ ...inputStyle, flex: 1 }} placeholder="#paket" />
                            <button onClick={() => setNavLinks(navLinks.filter((_, i) => i !== idx))} style={btnDanger}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setNavLinks([...navLinks, { label: '', href: '' }])} style={btnAdd}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                        Tambah Link
                    </button>
                </div>
            )}

            {/* ===== TAB: TRUST MARKERS ===== */}
            {activeTab === 'trust' && (
                <div style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Trust Markers / Badge Kepercayaan</h3>
                    {trustMarkers.map((marker, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <label style={{ ...labelStyle, marginBottom: 0 }}>Icon</label>
                                <select value={marker.icon} onChange={e => {
                                    const copy = [...trustMarkers]; copy[idx] = { ...copy[idx], icon: e.target.value }; setTrustMarkers(copy);
                                }} style={{ ...inputStyle, width: '160px' }}>
                                    {MATERIAL_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--color-primary)', minWidth: '40px', textAlign: 'center' }}>{marker.icon}</span>
                            <div style={{ flex: 1 }}>
                                <label style={{ ...labelStyle, marginBottom: '0.25rem' }}>Label</label>
                                <input type="text" value={marker.label} onChange={e => {
                                    const copy = [...trustMarkers]; copy[idx] = { ...copy[idx], label: e.target.value }; setTrustMarkers(copy);
                                }} style={inputStyle} placeholder="IATA Certified" />
                            </div>
                            <button onClick={() => setTrustMarkers(trustMarkers.filter((_, i) => i !== idx))} style={btnDanger}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                            </button>
                        </div>
                    ))}
                    <button onClick={() => setTrustMarkers([...trustMarkers, { icon: 'verified_user', label: '' }])} style={btnAdd}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                        Tambah Marker
                    </button>
                </div>
            )}

            {/* ===== TAB: FOOTER ===== */}
            {activeTab === 'footer' && (
                <div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Footer Utama</h3>
                        <div>
                            <label style={labelStyle}>Deskripsi Perusahaan</label>
                            <textarea value={footerDescription} onChange={e => setFooterDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                            <label style={labelStyle}>Teks Copyright</label>
                            <input type="text" value={footerCopyright} onChange={e => setFooterCopyright(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Link Kolom "Platform"</h3>
                        {footerLinksPlatform.map((link, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input type="text" value={link.label} onChange={e => {
                                    const copy = [...footerLinksPlatform]; copy[idx] = { ...copy[idx], label: e.target.value }; setFooterLinksPlatform(copy);
                                }} style={{ ...inputStyle, flex: 1 }} placeholder="Label" />
                                <input type="text" value={link.url} onChange={e => {
                                    const copy = [...footerLinksPlatform]; copy[idx] = { ...copy[idx], url: e.target.value }; setFooterLinksPlatform(copy);
                                }} style={{ ...inputStyle, flex: 1 }} placeholder="URL" />
                                <button onClick={() => setFooterLinksPlatform(footerLinksPlatform.filter((_, i) => i !== idx))} style={btnDanger}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => setFooterLinksPlatform([...footerLinksPlatform, { label: '', url: '' }])} style={btnAdd}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                            Tambah Link
                        </button>
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Link Kolom "Dukungan"</h3>
                        {footerLinksSupport.map((link, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <input type="text" value={link.label} onChange={e => {
                                    const copy = [...footerLinksSupport]; copy[idx] = { ...copy[idx], label: e.target.value }; setFooterLinksSupport(copy);
                                }} style={{ ...inputStyle, flex: 1 }} placeholder="Label" />
                                <input type="text" value={link.url} onChange={e => {
                                    const copy = [...footerLinksSupport]; copy[idx] = { ...copy[idx], url: e.target.value }; setFooterLinksSupport(copy);
                                }} style={{ ...inputStyle, flex: 1 }} placeholder="URL" />
                                <button onClick={() => setFooterLinksSupport(footerLinksSupport.filter((_, i) => i !== idx))} style={btnDanger}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => setFooterLinksSupport([...footerLinksSupport, { label: '', url: '' }])} style={btnAdd}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                            Tambah Link
                        </button>
                    </div>
                </div>
            )}

            {/* ===== TAB: SOCIAL MEDIA ===== */}
            {activeTab === 'social' && (
                <div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>WhatsApp</h3>
                        <label style={labelStyle}>Nomor WhatsApp (format: 628xxx)</label>
                        <input type="text" value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} style={inputStyle} placeholder="6281234567890" />
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Instagram Embed</h3>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                            Masukkan URL profil Instagram. Akan ditampilkan sebagai iframe embed di landing page.
                        </p>
                        <label style={labelStyle}>URL Profil Instagram</label>
                        <input type="text" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} style={inputStyle} placeholder="https://www.instagram.com/almadinah_travel/" />
                        {instagramUrl && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-bg)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                <label style={labelStyle}>Preview</label>
                                <iframe
                                    src={`${instagramUrl.replace(/\/$/, '')}/embed`}
                                    width="100%"
                                    height="400"
                                    frameBorder="0"
                                    style={{ borderRadius: '0.5rem', maxWidth: '540px' }}
                                    title="Instagram Profile"
                                />
                            </div>
                        )}
                    </div>
                    <div style={cardStyle}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Link Social Media</h3>
                        {socialMedia.map((sm, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                <select value={sm.platform} onChange={e => {
                                    const copy = [...socialMedia]; copy[idx] = { ...copy[idx], platform: e.target.value }; setSocialMedia(copy);
                                }} style={{ ...inputStyle, width: '140px' }}>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="telegram">Telegram</option>
                                </select>
                                <input type="text" value={sm.url} onChange={e => {
                                    const copy = [...socialMedia]; copy[idx] = { ...copy[idx], url: e.target.value }; setSocialMedia(copy);
                                }} style={{ ...inputStyle, flex: 1 }} placeholder="https://..." />
                                <button onClick={() => setSocialMedia(socialMedia.filter((_, i) => i !== idx))} style={btnDanger}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                </button>
                            </div>
                        ))}
                        <button onClick={() => setSocialMedia([...socialMedia, { platform: 'instagram', url: '', icon: '' }])} style={btnAdd}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                            Tambah Social Media
                        </button>
                    </div>
                </div>
            )}

            {/* ===== TAB: PROMO BANNER ===== */}
            {activeTab === 'promo' && (
                <div style={cardStyle}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Promo Banner</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                        Banner promo ditampilkan di paling atas halaman, di atas navbar.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                            <input type="checkbox" checked={promoBanner.enabled} onChange={e => setPromoBanner({ ...promoBanner, enabled: e.target.checked })} />
                            Aktifkan Promo Banner
                        </label>
                    </div>
                    {promoBanner.enabled && (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Teks Banner</label>
                                <input type="text" value={promoBanner.text} onChange={e => setPromoBanner({ ...promoBanner, text: e.target.value })} style={inputStyle} placeholder="🎉 Promo Spesial! Diskon 10% untuk pendaftaran bulan ini" />
                            </div>
                            <div>
                                <label style={labelStyle}>Warna Background</label>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input type="color" value={promoBanner.bgColor} onChange={e => setPromoBanner({ ...promoBanner, bgColor: e.target.value })} style={{ width: '48px', height: '40px', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }} />
                                    <input type="text" value={promoBanner.bgColor} onChange={e => setPromoBanner({ ...promoBanner, bgColor: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ padding: '0.75rem 1.5rem', background: promoBanner.bgColor, borderRadius: '0.5rem', textAlign: 'center', fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>
                                {promoBanner.text || 'Preview akan tampil di sini...'}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
                    padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.875rem',
                    background: toast.type === 'success' ? '#065f46' : '#991b1b',
                    color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'slideIn 0.3s ease',
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default LandingPageEditor;
