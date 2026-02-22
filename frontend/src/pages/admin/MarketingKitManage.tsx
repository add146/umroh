import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const MarketingKitManage: React.FC = () => {
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        category: 'poster',
        description: '',
        file: null as File | null
    });

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

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.file) return alert('Pilih file terlebih dahulu');

        setIsUploading(true);
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('category', form.category);
        formData.append('description', form.description);
        formData.append('file', form.file);

        try {
            const res = await apiFetch('/api/marketing-kit', {
                method: 'POST',
                // Don't set content-type for FormData, fetch does it automatically with boundary
                body: formData as any, // Cast to any to bypass apiFetch strictly expecting JSON logic if it doesn't support FormData directly. In a real scenario apiFetch should handle FormData. assuming we use standard fetch or patched apiFetch.
            });

            if (res.ok) {
                alert('Materi berhasil diupload!');
                setForm({ title: '', category: 'poster', description: '', file: null });
                fetchMaterials();
            } else {
                alert('Gagal mengupload materi.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus materi ini?')) return;
        try {
            const res = await apiFetch(`/api/marketing-kit/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchMaterials();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 300px', backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Upload Materi Baru</h2>

                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Judul Materi</label>
                        <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kategori</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                            <option value="poster">Poster / Flyer</option>
                            <option value="copywriting">Copywriting (WA)</option>
                            <option value="video">Video Promosi</option>
                            <option value="brosur">Brosur PDF</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>File</label>
                        <input type="file" required onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi / Isi Pesan</label>
                        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isUploading}>
                        {isUploading ? 'Mengupload...' : 'Upload Materi'}
                    </button>
                </form>
            </div>

            <div style={{ flex: '2 1 500px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Materi Tersedia ({materials.length})</h2>
                {isLoading ? <p>Loading...</p> : materials.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-bg-card)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                        <div>
                            <h4 style={{ fontWeight: 600 }}>{m.title}</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{m.category.toUpperCase()} • {m.fileName}</p>
                        </div>
                        <button className="btn btn-secondary" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }} onClick={() => handleDelete(m.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
