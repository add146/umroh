import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export const MarketingKitView: React.FC = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            try {
                const data = await apiFetch('/api/marketing-kit');
                if (data && data.materials) {
                    setMaterials(data.materials);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    const filteredMaterials = filterCategory === 'all'
        ? materials
        : materials.filter(m => m.category === filterCategory);

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const { accessToken } = useAuthStore.getState();
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/marketing-kit/${id}/download`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Gagal mengunduh materi.');
            }
        } catch (err) {
            console.error('Download failed', err);
            alert('Terjadi kesalahan saat mengunduh.');
        }
    };

    const handleShareWA = (title: string, description: string) => {
        const text = encodeURIComponent(`*${title}*\n\n${description ? description : 'Dapatkan penawaran terbaik bersama Al-Madinah!'}\n\ninfo lebih lanjut hubungi saya.`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{
                    width: '48px', height: '48px', background: 'var(--color-primary-bg)',
                    borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>campaign</span>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Marketing Kit</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Koleksi materi promosi, poster, foto, dan copywriting untuk membantu penjualan Anda.</p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['all', 'poster', 'copywriting', 'video', 'brosur'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '999px',
                            border: '1px solid',
                            borderColor: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-border)',
                            backgroundColor: filterCategory === cat ? 'var(--color-primary-bg)' : 'transparent',
                            color: filterCategory === cat ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize',
                            fontSize: '0.8125rem',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {cat === 'all' ? 'Semua Kategori' : cat}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Memuat materi...
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '5rem', textAlign: 'center', backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.5 }}>inventory_2</span>
                        <p style={{ margin: 0 }}>Belum ada materi marketing tersedia.</p>
                    </div>
                ) : filteredMaterials.map(m => (
                    <div key={m.id} style={{ backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden', transition: 'border-color 0.2s', display: 'flex', flexDirection: 'column' }} className="hover:border-primary/30">
                        {m.category === 'poster' || m.category === 'brosur' ? (
                            <div style={{ height: 220, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-border)' }}>image</span>
                            </div>
                        ) : m.category === 'video' ? (
                            <div style={{ height: 220, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary)', opacity: 0.6 }}>play_circle</span>
                            </div>
                        ) : (
                            <div style={{ height: 220, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--color-primary-bg)' }}>article</span>
                            </div>
                        )}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1.125rem', margin: 0 }}>{m.title}</h3>
                                <span style={{ fontSize: '0.625rem', padding: '0.25rem 0.5rem', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 800 }}>{m.category}</span>
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, flex: 1 }}>
                                {m.description || 'Tidak ada deskripsi tersedia untuk materi ini.'}
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem' }} onClick={() => handleDownload(m.id, m.fileName)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Unduh
                                </button>
                                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(37, 211, 102, 0.15)', color: '#25D366', border: '1px solid rgba(37, 211, 102, 0.3)' }} onClick={() => handleShareWA(m.title, m.description)}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>share</span> Bagikan WA
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
