import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

export const MasterDataPackageTypes: React.FC = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingType, setEditingType] = useState<any | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await apiFetch<{ data: any[] }>('/api/package-types');
            if (res.data) setTypes(res.data);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type: any) => {
        setEditingType(type);
        setName(type.name);
        setDescription(type.description || '');
    };

    const handleCancelEdit = () => {
        setEditingType(null);
        setName('');
        setDescription('');
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus jenis paket ini?')) return;
        try {
            await apiFetch(`/api/package-types/${id}`, { method: 'DELETE' });
            toast.success('Jenis paket dihapus');
            fetchTypes();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const body = JSON.stringify({ name, description });
            if (editingType) {
                await apiFetch(`/api/package-types/${editingType.id}`, { method: 'PUT', body });
                toast.success('Jenis paket diupdate');
            } else {
                await apiFetch('/api/package-types', { method: 'POST', body });
                toast.success('Jenis paket ditambahkan');
            }
            handleCancelEdit();
            fetchTypes();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Data Jenis Paket</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola daftar jenis paket seperti Haji Khusus, Umroh Plus, Reguler, dll.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 350px) 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Form Card */}
                <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '1.5rem' }}>
                        {editingType ? 'Edit Jenis Paket' : 'Tambah Jenis Baru'}
                    </h2>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Nama Jenis Paket</label>
                            <input
                                type="text" value={name} onChange={e => setName(e.target.value)} required
                                placeholder="Contoh: Haji Khusus"
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)',
                                    background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.875rem'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>Deskripsi (Opsional)</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                rows={3} placeholder="Keterangan jenis paket ini..."
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)',
                                    background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.875rem', resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                type="submit" disabled={isSubmitting}
                                style={{
                                    flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600,
                                    backgroundColor: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer',
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            {editingType && (
                                <button
                                    type="button" onClick={handleCancelEdit}
                                    style={{
                                        flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600,
                                        backgroundColor: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', cursor: 'pointer'
                                    }}
                                >
                                    Batal
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Data Table */}
                <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, width: '40%' }}>Nama Jenis Paket</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Deskripsi</th>
                                <th style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)', fontWeight: 600, textAlign: 'right', width: '150px' }}>Ops</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                            ) : types.length === 0 ? (
                                <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada data jenis paket.</td></tr>
                            ) : types.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'white' }}>{t.name}</td>
                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-muted)' }}>{t.description || '-'}</td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleEdit(t)}
                                                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(t.id)}
                                                style={{ padding: '0.375rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
