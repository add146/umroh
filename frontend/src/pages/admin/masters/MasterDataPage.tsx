import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import { toast } from 'sonner';

interface MasterData {
    id: string;
    name: string;
    isActive: boolean;
    // Additional generic fields
    city?: string;
    starRating?: number;
    distanceToHaram?: string;
    code?: string;
}

export const MasterDataPage: React.FC<{ type: 'hotels' | 'airlines' | 'airports' }> = ({ type }) => {
    const [data, setData] = useState<MasterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [city, setCity] = useState(''); // Hotels & Airports
    const [code, setCode] = useState(''); // Airlines & Airports
    const [starRating, setStarRating] = useState('3'); // Hotels
    const [distance, setDistance] = useState(''); // Hotels

    // UI meta
    const title = type === 'hotels' ? 'Data Hotel' : type === 'airlines' ? 'Data Maskapai' : 'Data Bandara';
    const endpoint = `/api/masters/${type}`;

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiFetch<any>(endpoint);
            setData(res[type] || []);
        } catch (error: any) {
            toast.error('Gagal memuat data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [type]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        let payload: any = { name };

        if (type === 'hotels') {
            payload = { ...payload, city, starRating: parseInt(starRating), distanceToHaram: distance };
        } else if (type === 'airlines') {
            payload = { ...payload, code };
        } else if (type === 'airports') {
            payload = { ...payload, code, city };
        }

        try {
            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            toast.success(`${title} berhasil ditambahkan`);
            setName(''); setCity(''); setCode(''); setStarRating('3'); setDistance('');
            loadData();
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, itemName: string) => {
        if (!confirm(`Hapus ${itemName} dari master data? Langkah ini tidak dapat dibatalkan.`)) return;
        try {
            await apiFetch(`${endpoint}/${id}`, { method: 'DELETE' });
            toast.success(`${itemName} dihapus`);
            loadData();
        } catch (error: any) {
            toast.error('Gagal menghapus: ' + error.message);
        }
    };

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Master {title}</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Kelola referensi {title.toLowerCase()} untuk form produk.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Form Tambah */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>add_circle</span>
                        Tambah {title}
                    </h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                {type === 'airlines' ? 'Nama Maskapai' : type === 'hotels' ? 'Nama Hotel' : 'Nama Bandara'}
                            </label>
                            <input className="admin-input" placeholder="Misal: Saudia Airlines" value={name} onChange={(e: any) => setName(e.target.value)} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }} required />
                        </div>

                        {(type === 'hotels' || type === 'airports') && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                    Kota Lokasi
                                </label>
                                <input className="admin-input" placeholder="Misal: Makkah" value={city} onChange={(e: any) => setCity(e.target.value)} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }} required />
                            </div>
                        )}

                        {(type === 'airlines' || type === 'airports') && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                    Kode / Singkatan
                                </label>
                                <input className="admin-input" placeholder="Misal: SV / CGK" value={code} onChange={(e: any) => setCode(e.target.value)} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }} required />
                            </div>
                        )}

                        {type === 'hotels' && (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                        Rating Bintang
                                    </label>
                                    <select
                                        value={starRating} onChange={e => setStarRating(e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.875rem', borderRadius: '0.5rem',
                                            background: '#0a0907', border: '1px solid #333', color: 'white', outline: 'none'
                                        }}
                                    >
                                        <option value="3">3 Bintang (***)</option>
                                        <option value="4">4 Bintang (****)</option>
                                        <option value="5">5 Bintang (*****)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)' }}>
                                        Jarak ke Haram/Nabawi
                                    </label>
                                    <input className="admin-input" placeholder="Misal: 150m" value={distance} onChange={(e: any) => setDistance(e.target.value)} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }} />
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: '0.5rem', padding: '1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                            {submitting ? 'Menyimpan...' : 'Simpan Data'}
                        </button>
                    </form>
                </div>

                {/* Tabel Data */}
                <div style={{ background: '#131210', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Daftar Aktif</h3>
                    </div>

                    {loading ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</div>
                    ) : data.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada master data.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nama Entitas</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Detail</th>
                                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)', ...({ '&:hover': { background: 'rgba(255,255,255,0.02)' } } as any) }}>
                                        <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                                            {item.name}
                                            {type === 'airlines' && <span style={{ display: 'inline-block', marginLeft: '0.5rem', padding: '0.125rem 0.375rem', background: 'var(--color-border)', borderRadius: '0.25rem', fontSize: '0.625rem' }}>{item.code}</span>}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)' }}>
                                            {type === 'hotels' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span style={{ color: 'var(--color-primary)' }}>{'★'.repeat(item.starRating || 0)}</span>
                                                    <span>{item.city} • {item.distanceToHaram || 'N/A'}</span>
                                                </div>
                                            )}
                                            {type === 'airports' && `${item.city} (${item.code})`}
                                            {type === 'airlines' && 'Penerbangan'}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(item.id, item.name)}
                                                style={{ padding: '0.5rem', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
