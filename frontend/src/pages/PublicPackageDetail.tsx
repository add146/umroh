import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const fmt = (n: number, currency = 'IDR') => {
    if (currency === 'USD') return `$ ${n.toLocaleString('en-US')}`;
    return `Rp ${n.toLocaleString('id-ID')}`;
};

const facilityIcons: Record<string, string> = {
    'pesawat': 'flight', 'hotel': 'hotel', 'makan': 'restaurant', 'visa': 'approval',
    'asuransi': 'health_and_safety', 'handling': 'luggage', 'muthowif': 'person', 'guide': 'tour',
    'city tour': 'map', 'bus': 'directions_bus', 'perlengkapan': 'backpack', 'bimbingan': 'school',
    'full board': 'restaurant_menu', 'sahur': 'restaurant_menu',
};

const getFacilityIcon = (f: string) => {
    const lower = f.toLowerCase();
    for (const [key, icon] of Object.entries(facilityIcons)) {
        if (lower.includes(key)) return icon;
    }
    return 'check_circle';
};

export default function PublicPackageDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDep, setSelectedDep] = useState<any>(null);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [pax, setPax] = useState(1);
    const [mainImage, setMainImage] = useState('');
    const [activeTab, setActiveTab] = useState('facilities');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        apiFetch<{ package: any }>(`/api/packages/${slug}`)
            .then(data => {
                const p = data.package;
                setPkg(p);
                setMainImage(p.image || '');
                if (p.departures?.length) {
                    const avail = p.departures.filter((d: any) => d.status !== 'full');
                    const dep = avail.length ? avail[0] : p.departures[0];
                    setSelectedDep(dep);
                    if (dep.roomTypes?.length) setSelectedRoom(dep.roomTypes[0]);
                }
            })
            .catch(() => navigate('/'))
            .finally(() => setLoading(false));
    }, [slug]);

    const images: string[] = useMemo(() => {
        if (!pkg) return [];
        let arr: string[] = [];
        if (pkg.images) {
            try { arr = JSON.parse(pkg.images); } catch { }
        }
        if (pkg.image && !arr.includes(pkg.image)) arr.unshift(pkg.image);
        return arr;
    }, [pkg]);

    const facilities: string[] = useMemo(() => {
        if (!pkg?.facilities) return [];
        return pkg.facilities.split(',').map((f: string) => f.trim()).filter(Boolean);
    }, [pkg]);

    const totalPrice = useMemo(() => {
        if (!pkg || !selectedRoom) return 0;
        return (pkg.basePrice + (selectedRoom.priceAdjustment || 0)) * pax;
    }, [pkg, selectedRoom, pax]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>Memuat paket...</div>
        </div>
    );

    if (!pkg) return null;

    const tabs = [
        { key: 'facilities', label: 'Fasilitas' },
        { key: 'itinerary', label: 'Itinerary' },
        { key: 'terms', label: 'Syarat & Ketentuan' },
        { key: 'hotels', label: 'Akomodasi' },
        { key: 'gallery', label: 'Galeri' },
    ];

    const waMessage = `Assalamualaikum, saya tertarik dengan paket *${pkg.name}*. Bisa info lebih lanjut?`;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
            {/* ===== NAVBAR ===== */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,14,0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'var(--color-text)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '28px' }}>kaaba</span>
                    <span style={{ fontWeight: 800, fontSize: '1.125rem' }}><span style={{ color: 'var(--color-primary)' }}>AL</span>MADINAH</span>
                </Link>
                <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Beranda</Link>
                    <Link to="/login" style={{ padding: '0.5rem 1.25rem', background: 'var(--color-primary)', color: 'var(--color-bg)', borderRadius: '0.5rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>Daftar Sekarang</Link>
                </div>
            </nav>

            {/* ===== BREADCRUMB ===== */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Beranda</Link>
                    <span>›</span>
                    <Link to="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Paket Umroh</Link>
                    <span>›</span>
                    <span style={{ color: 'var(--color-primary)' }}>{pkg.name}</span>
                </div>
            </div>

            {/* ===== HEADER ===== */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>{pkg.name}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {selectedDep && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-primary)', background: 'rgba(212,175,55,0.12)', padding: '0.375rem 0.75rem', borderRadius: '2rem', fontWeight: 600 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                            {new Date(selectedDep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    )}
                    {selectedDep?.departureAirport && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flight_takeoff</span>
                            {selectedDep.departureAirport.city} ({selectedDep.departureAirport.code})
                        </span>
                    )}
                    {pkg.starRating && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}>star</span>
                            {pkg.starRating}-Star Experience
                        </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: '#4caf50', fontWeight: 700 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                        Licensed Agency
                    </span>
                </div>
            </div>

            {/* ===== MAIN CONTENT ===== */}
            <div className="pkg-detail-layout" style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
                {/* LEFT COLUMN */}
                <div>
                    {/* Image Gallery */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ borderRadius: '1rem', overflow: 'hidden', marginBottom: '0.75rem', position: 'relative', aspectRatio: '16/9', background: '#111', cursor: 'pointer' }}
                            onClick={() => { setLightboxIdx(images.indexOf(mainImage)); setLightboxOpen(true); }}>
                            <img src={mainImage} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {images.length > 1 && (
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                                {images.slice(0, 5).map((img, i) => (
                                    <div key={i} onClick={() => setMainImage(img)} style={{
                                        width: '80px', height: '56px', borderRadius: '0.5rem', overflow: 'hidden', cursor: 'pointer',
                                        border: mainImage === img ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        opacity: mainImage === img ? 1 : 0.6, transition: 'all 0.2s', flexShrink: 0,
                                    }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                                {images.length > 5 && (
                                    <div onClick={() => { setActiveTab('gallery'); }} style={{
                                        width: '80px', height: '56px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', flexShrink: 0,
                                    }}>+{images.length - 5} More</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
                                padding: '0.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
                                color: activeTab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                borderBottom: activeTab === t.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                                fontWeight: activeTab === t.key ? 700 : 400, fontSize: '0.875rem', whiteSpace: 'nowrap', transition: 'all 0.2s',
                            }}>{t.label}</button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'facilities' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>checklist</span>
                                Fasilitas Paket
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                {facilities.map((f, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '0.75rem', padding: '1rem', textAlign: 'center',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)', marginBottom: '0.5rem', display: 'block' }}>
                                            {getFacilityIcon(f)}
                                        </span>
                                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, lineHeight: '1.3' }}>{f}</div>
                                    </div>
                                ))}
                            </div>
                            {pkg.description && (
                                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', lineHeight: '1.7', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
                                    {pkg.description}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'itinerary' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>timeline</span>
                                Jadwal Perjalanan
                            </h2>
                            {pkg.itinerary ? (
                                <div dangerouslySetInnerHTML={{ __html: pkg.itinerary }} style={{ lineHeight: '1.7', fontSize: '0.9375rem' }} />
                            ) : (
                                <ItineraryTimeline pkg={pkg} departure={selectedDep} />
                            )}
                        </div>
                    )}

                    {activeTab === 'terms' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>gavel</span>
                                Syarat & Ketentuan
                            </h2>
                            {pkg.termsConditions ? (
                                <div dangerouslySetInnerHTML={{ __html: pkg.termsConditions }} style={{ lineHeight: '1.7', fontSize: '0.9375rem' }} />
                            ) : (
                                <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', lineHeight: '1.8', fontSize: '0.9375rem' }}>
                                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--color-text-muted)' }}>
                                        <li>Paspor minimal berlaku 7 bulan sebelum keberangkatan</li>
                                        <li>Pembayaran DP minimal {fmt(pkg.dpAmount || 5000000, pkg.currency)} untuk konfirmasi seat</li>
                                        <li>Pelunasan paling lambat 30 hari sebelum keberangkatan</li>
                                        <li>Pembatalan dikenakan biaya admin sesuai ketentuan</li>
                                        <li>Harga dapat berubah sewaktu-waktu mengikuti kurs dan kebijakan maskapai</li>
                                        <li>Wajib mengikuti manasik umroh yang telah dijadwalkan</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'hotels' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>hotel</span>
                                Akomodasi
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                {[
                                    { label: 'MAKKAH', hotel: pkg.makkahHotel },
                                    { label: 'MADINAH', hotel: pkg.madinahHotel },
                                ].map(({ label, hotel }) => hotel && (
                                    <div key={label} style={{
                                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '1rem', overflow: 'hidden',
                                    }}>
                                        {hotel.image && (
                                            <div style={{ height: '140px', overflow: 'hidden' }}>
                                                <img src={hotel.image} alt={hotel.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        )}
                                        <div style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>{label}</div>
                                            <div style={{ fontWeight: 700, marginBottom: '0.375rem' }}>{hotel.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.375rem' }}>
                                                {Array.from({ length: hotel.starRating || 0 }).map((_, i) => (
                                                    <span key={i} className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>star</span>
                                                ))}
                                            </div>
                                            {hotel.distanceToHaram && (
                                                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                                                    {hotel.distanceToHaram}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'gallery' && (
                        <div>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>photo_library</span>
                                Galeri
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                {images.map((img, i) => (
                                    <div key={i} onClick={() => { setLightboxIdx(i); setLightboxOpen(true); }} style={{
                                        borderRadius: '0.75rem', overflow: 'hidden', cursor: 'pointer', aspectRatio: '4/3',
                                    }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN — PRICING SIDEBAR */}
                <div className="pkg-detail-sidebar" style={{ position: 'sticky', top: '80px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '1rem', padding: '1.5rem',
                    }}>
                        {/* Price */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Harga mulai dari</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                    {fmt(pkg.basePrice, pkg.currency)}
                                </span>
                                {pkg.isPromo && <span style={{ fontSize: '0.6875rem', color: '#ef4444', fontWeight: 700, textDecoration: 'line-through' }}>DISKON</span>}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>*Harga bervariasi berdasarkan tipe kamar</div>
                        </div>

                        {/* Departure Selector */}
                        {pkg.departures?.length > 1 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Pilih Keberangkatan</div>
                                <select value={selectedDep?.id || ''} onChange={e => {
                                    const dep = pkg.departures.find((d: any) => d.id === e.target.value);
                                    setSelectedDep(dep);
                                    if (dep?.roomTypes?.length) setSelectedRoom(dep.roomTypes[0]);
                                }} style={{
                                    width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: '0.5rem', color: 'var(--color-text)', fontSize: '0.875rem',
                                }}>
                                    {pkg.departures.map((d: any) => (
                                        <option key={d.id} value={d.id} style={{ background: '#1a1a2e' }}>
                                            {d.tripName || d.departureDate} {d.status === 'full' ? '(PENUH)' : d.status === 'last_call' ? '(SISA SEDIKIT)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Room Type */}
                        {selectedDep?.roomTypes?.length > 0 && (
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                    1. Pilih Tipe Kamar
                                </div>
                                {selectedDep.roomTypes.map((rt: any) => (
                                    <label key={rt.id} onClick={() => setSelectedRoom(rt)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.875rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                                        background: selectedRoom?.id === rt.id ? 'rgba(212,175,55,0.1)' : 'transparent',
                                        border: selectedRoom?.id === rt.id ? '1px solid rgba(212,175,55,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                        marginBottom: '0.5rem', transition: 'all 0.2s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%',
                                                border: selectedRoom?.id === rt.id ? '5px solid var(--color-primary)' : '2px solid rgba(255,255,255,0.2)',
                                                background: selectedRoom?.id === rt.id ? 'transparent' : 'transparent',
                                            }} />
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rt.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{rt.capacity} orang per kamar</div>
                                            </div>
                                        </div>
                                        <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem' }}>
                                            {rt.priceAdjustment === 0 ? fmt(0, pkg.currency) : `+ ${fmt(rt.priceAdjustment, pkg.currency)}`}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Pax Counter */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                2. Jumlah Jamaah
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: '0.875rem' }}>Dewasa (12+ tahun)</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <button onClick={() => setPax(Math.max(1, pax - 1))} style={{
                                        width: '32px', height: '32px', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>−</button>
                                    <span style={{ fontWeight: 700, fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>{pax}</span>
                                    <button onClick={() => setPax(pax + 1)} style={{
                                        width: '32px', height: '32px', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'transparent', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>+</button>
                                </div>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                <span>Subtotal ({pax} Pax)</span>
                                <span>{fmt(totalPrice, pkg.currency)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                <span>Tax & Surcharge</span>
                                <span>Termasuk</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.0625rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--color-primary)' }}>{fmt(totalPrice, pkg.currency)}</span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <button onClick={() => navigate(`/register?package=${pkg.id}`)} style={{
                            width: '100%', padding: '0.875rem', background: 'var(--color-primary)', color: 'var(--color-bg)',
                            border: 'none', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.9375rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem',
                        }}>
                            PESAN SEKARANG
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                        </button>

                        <a href={`https://wa.me/6281234567001?text=${encodeURIComponent(waMessage)}`} target="_blank" rel="noreferrer" style={{
                            width: '100%', padding: '0.875rem', background: '#25D366', color: 'white', boxSizing: 'border-box',
                            border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none',
                        }}>
                            💬 Tanya via WhatsApp
                        </a>

                        {/* Quick Info Icons */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {[
                                { icon: 'confirmation_number', label: 'Easy Booking' },
                                { icon: 'receipt_long', label: 'Cicilan' },
                                { icon: 'headset_mic', label: '24/7 Support' },
                            ].map((item) => (
                                <div key={item.label} style={{ textAlign: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>{item.icon}</span>
                                    <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Promo Badge */}
                        {pkg.isPromo && pkg.promoText && (
                            <div style={{
                                marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ef4444' }}>campaign</span>
                                <span style={{ fontWeight: 600, color: '#fca5a5' }}>{pkg.promoText}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== LIGHTBOX ===== */}
            {lightboxOpen && (
                <div onClick={() => setLightboxOpen(false)} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                }}>
                    <img src={images[lightboxIdx]} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '0.5rem' }}
                        onClick={e => e.stopPropagation()} />
                    {images.length > 1 && (
                        <>
                            <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx - 1 + images.length) % images.length); }} style={{
                                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '48px',
                                height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem',
                            }}>‹</button>
                            <button onClick={e => { e.stopPropagation(); setLightboxIdx((lightboxIdx + 1) % images.length); }} style={{
                                position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '48px',
                                height: '48px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem',
                            }}>›</button>
                        </>
                    )}
                </div>
            )}

            {/* ===== FOOTER ===== */}
            <footer style={{ marginTop: '4rem', padding: '2rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>kaaba</span>
                    <span style={{ fontWeight: 800 }}><span style={{ color: 'var(--color-primary)' }}>AL</span>MADINAH</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto 1rem' }}>
                    Penyelenggara Ibadah Umroh Resmi (PPIU) · Izin Kemenag RI
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    © {new Date().getFullYear()} Al Madinah Tour & Travel. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

/* ===== ITINERARY TIMELINE COMPONENT ===== */
function ItineraryTimeline({ pkg, departure }: { pkg: any; departure: any }) {
    const depDate = departure ? new Date(departure.departureDate) : new Date();
    const durationDays = parseInt(pkg.duration || '9') || 9;
    const airport = departure?.departureAirport;

    const defaultItinerary = [
        { title: `Keberangkatan dari ${airport?.city || 'Indonesia'}`, desc: `Berkumpul di ${airport?.name || 'Bandara'} Terminal Internasional. Penerbangan langsung menuju Tanah Suci.` },
        { title: 'Tiba di Madinah', desc: 'Check-in hotel dan beristirahat. Melaksanakan shalat di Masjid Nabawi. Waktu bebas.' },
        { title: 'Ziarah Madinah', desc: 'Mengunjungi Masjid Quba, Tujuh Masjid, dan Jabal Uhud bersama guide lokal.' },
        { title: 'Madinah - Makkah', desc: 'Perjalanan dari Madinah ke Makkah. Miqat di Bir Ali. Tiba di Makkah dan langsung umroh (Tawaf & Sa\'i).' },
        { title: 'Ibadah di Makkah', desc: 'Hari-hari penuh ibadah di Masjidil Haram. Shalat berjamaah, tawaf sunnah, dan dzikir.' },
        { title: 'City Tour Makkah', desc: 'Mengunjungi Jabal Rahmah, Padang Arafah, Muzdalifah, dan tempat bersejarah lainnya.' },
        { title: `Kembali ke ${airport?.city || 'Indonesia'}`, desc: `Tawaf Wada\' dan perjalanan kembali ke Tanah Air. Semoga menjadi umroh yang mabrur!` },
    ];

    return (
        <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>
            <div style={{ position: 'absolute', left: '15px', top: '0', bottom: '0', width: '2px', background: 'rgba(212,175,55,0.2)' }} />
            {defaultItinerary.map((item, i) => {
                const date = new Date(depDate);
                date.setDate(depDate.getDate() + i * Math.max(1, Math.floor(durationDays / defaultItinerary.length)));
                return (
                    <div key={i} style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <div style={{
                            position: 'absolute', left: '-2.5rem', top: '0.25rem',
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'var(--color-primary)', color: 'var(--color-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '0.75rem', zIndex: 1,
                        }}>{i + 1}</div>
                        <div style={{
                            background: i % 2 === 0 ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem 1.25rem',
                        }}>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.375rem' }}>{item.title}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>{item.desc}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
