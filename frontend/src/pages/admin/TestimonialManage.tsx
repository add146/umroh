import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import ImageUploader from '../../components/ImageUploader';

interface Testimonial {
    id: string;
    pilgrimName: string;
    departureInfo: string;
    content: string;
    photoR2Key: string | null;
    videoUrl: string | null;
    rating: number;
    isPublished: boolean;
    createdAt: string;
}

export default function TestimonialManage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Testimonial | null>(null);

    // Form states
    const [pilgrimName, setPilgrimName] = useState('');
    const [departureInfo, setDepartureInfo] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState(5);
    const [videoUrl, setVideoUrl] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    // Photo URL (now stored as imgBB URL instead of R2 key)
    const [photoUrl, setPhotoUrl] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/testimonials/all');
            const data = await res.json();
            setTestimonials(data);
        } catch (e) {
            console.error('Failed to fetch testimonials', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (item?: Testimonial) => {
        if (item) {
            setEditingItem(item);
            setPilgrimName(item.pilgrimName);
            setDepartureInfo(item.departureInfo || '');
            setContent(item.content);
            setRating(item.rating);
            setVideoUrl(item.videoUrl || '');
            setIsPublished(item.isPublished);
            setPhotoUrl(item.photoR2Key || '');
        } else {
            setEditingItem(null);
            setPilgrimName('');
            setDepartureInfo('');
            setContent('');
            setRating(5);
            setVideoUrl('');
            setIsPublished(false);
            setPhotoUrl('');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            pilgrimName,
            departureInfo,
            content,
            rating,
            videoUrl,
            isPublished,
            photoR2Key: photoUrl || undefined
        };

        try {
            let res;
            if (editingItem) {
                res = await apiFetch(`/api/testimonials/${editingItem.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await apiFetch('/api/testimonials', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                closeModal();
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Terjadi kesalahan');
            }
        } catch (error) {
            console.error('Save error', error);
            alert('Terjadi kesalahan saat menyimpan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus testimoni ini?')) return;
        try {
            await apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Gagal menghapus testimoni');
        }
    };

    const togglePublish = async (item: Testimonial) => {
        try {
            await apiFetch(`/api/testimonials/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: !item.isPublished })
            });
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-text)',
        outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s ease',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ===== HEADER HERO ===== */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(200,168,81,0.12) 0%, rgba(200,168,81,0.03) 100%)',
                border: '1px solid var(--color-border-gold)',
                borderRadius: '1rem', padding: '2rem 2rem 1.75rem',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorative glow */}
                <div style={{
                    position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px',
                    background: 'radial-gradient(circle, rgba(200,168,81,0.15) 0%, transparent 70%)',
                    borderRadius: '100%', pointerEvents: 'none',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-30px', left: '30%', width: '150px', height: '150px',
                    background: 'radial-gradient(circle, rgba(200,168,81,0.08) 0%, transparent 70%)',
                    borderRadius: '100%', pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{
                                fontSize: '32px', color: 'var(--color-primary)',
                                fontVariationSettings: "'FILL' 1",
                                filter: 'drop-shadow(0 0 10px rgba(200,168,81,0.4))',
                            }}>reviews</span>
                            <h1 style={{
                                fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)',
                                letterSpacing: '-0.02em', margin: 0,
                            }}>
                                Manajemen <span style={{ color: 'var(--color-primary)' }}>Testimoni</span>
                            </h1>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                            Kelola ulasan dan testimoni jamaah untuk ditampilkan di halaman depan.
                        </p>
                    </div>
                    <button onClick={() => openModal()} className="btn btn-primary" style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.625rem 1.25rem', fontWeight: 700,
                        boxShadow: 'var(--shadow-gold)',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                        Tambah Testimoni
                    </button>
                </div>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Total Testimoni', value: testimonials.length, icon: 'format_quote', color: 'var(--color-primary)' },
                    { label: 'Published', value: testimonials.filter(t => t.isPublished).length, icon: 'visibility', color: '#22c55e' },
                    { label: 'Draft', value: testimonials.filter(t => !t.isPublished).length, icon: 'visibility_off', color: 'var(--color-text-muted)' },
                    { label: 'Rata-rata Rating', value: testimonials.length ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1) : '—', icon: 'star', color: '#f59e0b' },
                ].map((stat, i) => (
                    <div key={i} className="dark-card" style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: stat.color, fontVariationSettings: stat.icon === 'star' ? "'FILL' 1" : undefined, opacity: 0.8 }}>{stat.icon}</span>
                        </div>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: stat.color, margin: 0, letterSpacing: '-0.02em' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* ===== TABLE ===== */}
            <div className="dark-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Jamaah', 'Paket/Keberangkatan', 'Ulasan', 'Rating', 'Status', 'Aksi'].map(h => (
                                    <th key={h} style={{
                                        padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600,
                                        color: 'var(--color-text-muted)', textTransform: 'uppercase',
                                        letterSpacing: '0.08em', whiteSpace: 'nowrap',
                                        textAlign: ['Rating', 'Status', 'Aksi'].includes(h) ? (h === 'Aksi' ? 'right' : 'center') : 'left',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: '20px', height: '20px', border: '2px solid var(--color-primary)',
                                            borderTopColor: 'transparent', borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite',
                                        }} />
                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Memuat data...</span>
                                    </div>
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </td></tr>
                            ) : testimonials.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-text-light)', fontVariationSettings: "'FILL' 1" }}>hotel_class</span>
                                        <p style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Belum ada testimoni.</p>
                                        <button onClick={() => openModal()} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                                            Tambah Testimoni Pertama
                                        </button>
                                    </div>
                                </td></tr>
                            ) : (
                                testimonials.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s ease', cursor: 'pointer' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '0.875rem 1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {item.photoR2Key ? (
                                                    <img src={item.photoR2Key.startsWith('http') ? item.photoR2Key : `/api/documents/${item.photoR2Key}`} alt="" style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        objectFit: 'cover', border: '2px solid var(--color-border-gold)',
                                                    }} />
                                                ) : (
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '50%',
                                                        background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: '1rem', border: '2px solid var(--color-border-gold)',
                                                    }}>
                                                        {item.pilgrimName.charAt(0)}
                                                    </div>
                                                )}
                                                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.pilgrimName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.875rem 1.25rem' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '0.25rem 0.625rem',
                                                background: 'var(--color-bg-card)', borderRadius: '0.375rem',
                                                fontSize: '0.75rem', color: 'var(--color-text-muted)',
                                                border: '1px solid var(--color-border)',
                                            }}>{item.departureInfo || '—'}</span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1.25rem', maxWidth: '300px' }}>
                                            <p style={{
                                                margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)',
                                                fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                                borderLeft: '2px solid var(--color-border-gold)', paddingLeft: '0.75rem',
                                            }}>"{item.content}"</p>
                                        </td>
                                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                                            <div style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                background: 'rgba(245,158,11,0.08)', padding: '0.25rem 0.625rem',
                                                borderRadius: '9999px', border: '1px solid rgba(245,158,11,0.15)',
                                            }}>
                                                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{item.rating}</span>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'center' }}>
                                            <button onClick={() => togglePublish(item)} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.7rem',
                                                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease',
                                                background: item.isPublished ? 'rgba(34,197,94,0.1)' : 'var(--color-bg-card)',
                                                color: item.isPublished ? '#22c55e' : 'var(--color-text-muted)',
                                                border: `1px solid ${item.isPublished ? 'rgba(34,197,94,0.2)' : 'var(--color-border)'}`,
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>
                                                    {item.isPublished ? 'check_circle' : 'pending'}
                                                </span>
                                                {item.isPublished ? 'Published' : 'Draft'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                <button onClick={() => openModal(item)} title="Edit" style={{
                                                    width: '32px', height: '32px', borderRadius: '0.375rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'var(--color-primary)', transition: 'background 0.15s ease',
                                                    background: 'transparent',
                                                }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-bg)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} title="Hapus" style={{
                                                    width: '32px', height: '32px', borderRadius: '0.375rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#ef4444', transition: 'background 0.15s ease',
                                                    background: 'transparent',
                                                }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== MODAL ===== */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                    padding: '1rem',
                }}>
                    <div style={{
                        background: 'var(--color-bg-alt)', border: '1px solid var(--color-border-gold)',
                        borderRadius: '1rem', boxShadow: 'var(--shadow-card), var(--shadow-gold)',
                        width: '100%', maxWidth: '640px', maxHeight: '90vh',
                        display: 'flex', flexDirection: 'column',
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)',
                        }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-primary)' }}>{editingItem ? 'edit_square' : 'add_circle'}</span>
                                {editingItem ? 'Edit Testimoni' : 'Tambah Testimoni Baru'}
                            </h2>
                            <button onClick={closeModal} style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--color-bg-card)', color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)', transition: 'all 0.15s ease',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'var(--color-bg-card)'; }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                            <form id="testimonialForm" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Nama Jamaah <span style={{ color: 'var(--color-primary)' }}>*</span>
                                        </label>
                                        <input required type="text" value={pilgrimName} onChange={e => setPilgrimName(e.target.value)}
                                            placeholder="Masukkan nama jamaah" style={inputStyle}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            Info Paket
                                        </label>
                                        <input type="text" value={departureInfo} onChange={e => setDepartureInfo(e.target.value)}
                                            placeholder="Contoh: Umroh Reguler - Nov 2023" style={inputStyle}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                    </div>
                                </div>

                                {/* Photo Upload (imgBB) */}
                                <div>
                                    <ImageUploader
                                        mode="imgbb"
                                        label="Avatar / Foto Profil"
                                        currentImage={photoUrl || undefined}
                                        onUpload={(url) => setPhotoUrl(url)}
                                        helpText="Foto akan diunggah ke imgBB (hosting gambar gratis)"
                                    />
                                </div>

                                {/* Video URL */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Link Video YouTube</label>
                                    <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=..." style={inputStyle}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                </div>

                                {/* Rating */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Rating <span style={{ color: 'var(--color-primary)' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" onClick={() => setRating(star)} style={{ padding: 0, transition: 'transform 0.15s ease' }}
                                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                                                <span className="material-symbols-outlined" style={{
                                                    fontSize: '28px', cursor: 'pointer',
                                                    color: rating >= star ? '#f59e0b' : 'var(--color-text-light)',
                                                    fontVariationSettings: rating >= star ? "'FILL' 1" : "'FILL' 0",
                                                    filter: rating >= star ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none',
                                                }}>star</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Ulasan */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Ulasan / Testimoni <span style={{ color: 'var(--color-primary)' }}>*</span>
                                    </label>
                                    <textarea required rows={4} value={content} onChange={e => setContent(e.target.value)}
                                        placeholder="Ceritakan pengalaman jamaah di sini..."
                                        style={{ ...inputStyle, resize: 'none' }}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                </div>

                                {/* Publish Toggle */}
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
                                    background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                                    borderRadius: '0.625rem', cursor: 'pointer', transition: 'border-color 0.2s ease',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-gold)')}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                                    <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}>
                                        <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                                        <div style={{
                                            width: '44px', height: '24px', borderRadius: '12px', transition: 'background 0.2s ease',
                                            background: isPublished ? 'var(--color-primary)' : 'rgba(255,255,255,0.10)',
                                            position: 'relative',
                                        }}>
                                            <div style={{
                                                width: '18px', height: '18px', borderRadius: '50%', position: 'absolute',
                                                top: '3px', transition: 'left 0.2s ease',
                                                left: isPublished ? '23px' : '3px',
                                                background: isPublished ? 'var(--color-bg)' : 'var(--color-text-muted)',
                                            }} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>Tampilkan di Halaman Depan</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Testimoni akan bisa dilihat oleh publik</span>
                                    </div>
                                </label>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)',
                            display: 'flex', justifyContent: 'flex-end', gap: '0.75rem',
                        }}>
                            <button type="button" onClick={closeModal} className="btn btn-outline">Batal</button>
                            <button type="submit" form="testimonialForm" className="btn btn-primary" style={{ boxShadow: 'var(--shadow-gold)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                                {editingItem ? 'Simpan Perubahan' : 'Tambahkan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
