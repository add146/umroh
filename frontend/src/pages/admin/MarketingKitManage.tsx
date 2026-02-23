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
            <div style={{ flex: '1 1 300px', backgroundColor: '#1a1917', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', height: 'fit-content' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Upload Materi Baru</h2>

                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>Judul Materi</label>
                        <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#0a0907', color: 'var(--color-text)', outline: 'none' }} placeholder="Masukkan judul..." />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>Kategori</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#0a0907', color: 'var(--color-text)', outline: 'none' }}>
                            <option value="poster">Poster / Flyer</option>
                            <option value="copywriting">Copywriting (WA)</option>
                            <option value="video">Video Promosi</option>
                            <option value="brosur">Brosur PDF</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>File</label>
                        <input type="file" required onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#0a0907', color: 'var(--color-text)', outline: 'none', cursor: 'pointer' }} />
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text)' }}>Deskripsi / Isi Pesan</label>
                        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', backgroundColor: '#0a0907', color: 'var(--color-text)', outline: 'none', resize: 'vertical' }} placeholder="Tulis deskripsi / copywriting..."></textarea>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', fontWeight: 700 }} disabled={isUploading}>
                        {isUploading ? 'Mengupload...' : 'Upload Materi'}
                    </button>
                </form>
            </div>

            <div style={{ flex: '2 1 500px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Materi Tersedia ({materials.length})</h2>
                {isLoading ? <p style={{ color: 'var(--color-text-light)' }}>Memuat materi...</p> : materials.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>Belum ada materi.</p> : materials.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1917', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                        <div>
                            <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text)' }}>{m.title}</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                <span style={{ textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.75rem' }}>{m.category}</span> • {m.fileName}
                            </p>
                        </div>
                        <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handleDelete(m.id)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
