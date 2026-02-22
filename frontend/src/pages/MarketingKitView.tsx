import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export const MarketingKitView: React.FC = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<string>('all');

    useEffect(() => {
        const fetchMaterials = async () => {
            setIsLoading(true);
            try {
                const res = await apiFetch('/api/marketing-kit');
                if (res.ok) {
                    const data = await res.json();
                    setMaterials(data.materials || []);
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

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Marketing Kit</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Koleksi materi promosi, poster, foto, dan copywriting untuk membantu penjualan Anda.</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['all', 'poster', 'copywriting', 'video', 'brosur'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '999px',
                            border: 'none',
                            backgroundColor: filterCategory === cat ? 'var(--color-primary)' : '#e2e8f0',
                            color: filterCategory === cat ? 'white' : 'var(--color-text)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {cat === 'all' ? 'Semua Kategori' : cat}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {isLoading ? (
                    <p>Loading materials...</p>
                ) : filteredMaterials.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius)', color: 'var(--color-text-muted)' }}>
                        Belum ada materi marketing tersedia.
                    </div>
                ) : filteredMaterials.map(m => (
                    <div key={m.id} style={{ backgroundColor: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        {m.category === 'poster' || m.category === 'brosur' ? (
                            <div style={{ height: 200, backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#94a3b8' }}>image</span>
                            </div>
                        ) : m.category === 'video' ? (
                            <div style={{ height: 200, backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)' }}>play_circle</span>
                            </div>
                        ) : (
                            <div style={{ height: 200, backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#d97706' }}>article</span>
                            </div>
                        )}
                        <div style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{m.title}</h3>
                                <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', backgroundColor: '#e2e8f0', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>{m.category}</span>
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {m.description || 'Tidak ada deskripsi'}
                            </p>
                            <button className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={() => alert('Fitur download R2 object')}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span> Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
