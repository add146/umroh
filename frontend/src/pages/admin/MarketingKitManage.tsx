import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const MarketingKitManage: React.FC = () => {
    const { accessToken } = useAuthStore();
    const [materials, setMaterials] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Edit modal state
    const [editingMaterial, setEditingMaterial] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ title: '', category: 'poster', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    const [form, setForm] = useState({
        title: '',
        category: 'poster',
        description: '',
        file: null as File | null
    });

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch<any>('/api/marketing-kit');
            setMaterials(data.materials || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const isCopywriting = form.category === 'copywriting';

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCopywriting && !form.file) return alert('Pilih file terlebih dahulu');

        setIsUploading(true);
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('category', form.category);
        formData.append('description', form.description);
        if (form.file) {
            formData.append('file', form.file);
        }

        try {
            await apiFetch<any>('/api/marketing-kit', {
                method: 'POST',
                body: formData as any,
            });
            alert('Materi berhasil diupload!');
            setForm({ title: '', category: 'poster', description: '', file: null });
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            fetchMaterials();
        } catch (err: any) {
            console.error(err);
            alert(`Gagal mengupload materi: ${err.message || 'Server error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketing-kit/${id}/download`, {
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

    const handleDelete = async (id: string) => {
        if (!window.confirm('Hapus materi ini?')) return;
        try {
            await apiFetch(`/api/marketing-kit/${id}`, { method: 'DELETE' });
            fetchMaterials();
        } catch (err: any) {
            console.error(err);
            alert(`Gagal menghapus: ${err.message || 'Server error'}`);
        }
    };

    const openEdit = (m: any) => {
        setEditingMaterial(m);
        setEditForm({ title: m.title, category: m.category, description: m.description || '' });
    };

    const handleSaveEdit = async () => {
        if (!editingMaterial) return;
        setIsSaving(true);
        try {
            await apiFetch<any>(`/api/marketing-kit/${editingMaterial.id}`, {
                method: 'PATCH',
                body: JSON.stringify(editForm),
            });
            setEditingMaterial(null);
            fetchMaterials();
        } catch (err: any) {
            console.error(err);
            alert(`Gagal menyimpan: ${err.message || 'Server error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem',
        border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)',
        color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box'
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* ── Upload Form ── */}
            <div style={{ flex: '1 1 300px', backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', height: 'fit-content' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Upload Materi Baru</h2>

                <form onSubmit={handleUpload}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Judul Materi</label>
                        <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} placeholder="Masukkan judul..." />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kategori</label>
                        <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                            <option value="poster">Poster / Flyer</option>
                            <option value="copywriting">Copywriting (WA)</option>
                            <option value="video">Video Promosi</option>
                            <option value="brosur">Brosur PDF</option>
                        </select>
                    </div>
                    {!isCopywriting && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>File</label>
                            <input type="file" onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} style={{ ...inputStyle, padding: '0.5rem', cursor: 'pointer' }} />
                        </div>
                    )}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi / Isi Pesan</label>
                        <textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Tulis deskripsi / copywriting..." />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', fontWeight: 700 }} disabled={isUploading}>
                        {isUploading ? 'Mengupload...' : 'Upload Materi'}
                    </button>
                </form>
            </div>

            {/* ── Materials List ── */}
            <div style={{ flex: '2 1 500px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Materi Tersedia ({materials.length})</h2>
                {isLoading ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Memuat materi...</p>
                ) : materials.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Belum ada materi.</p>
                ) : materials.map(m => (
                    <div key={m.id} style={{ backgroundColor: 'var(--color-bg-card)', padding: '1.25rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--color-border)', marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* Thumbnail */}
                        <div style={{ width: 64, height: 64, borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(m.category === 'poster' || m.category === 'brosur') ? (
                                <img
                                    src={`${import.meta.env.VITE_API_URL || ''}/api/marketing-kit/${m.id}/download?token=${accessToken}`}
                                    alt={m.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--color-primary)', opacity: 0.7 }}>
                                    {m.category === 'video' ? 'play_circle' : 'article'}
                                </span>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontWeight: 600, fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.title}</h4>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                                <span style={{ textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.7rem' }}>{m.category}</span>
                                {m.description && <span> &bull; {m.description.length > 60 ? m.description.slice(0, 60) + '…' : m.description}</span>}
                            </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button
                                title="Edit"
                                onClick={() => openEdit(m)}
                                style={{ background: 'rgba(200,169,81,0.15)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>edit</span>
                            </button>
                            <button
                                title="Unduh"
                                onClick={() => handleDownload(m.id, m.fileName)}
                                style={{ background: 'rgba(56,189,248,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#38bdf8' }}>download</span>
                            </button>
                            <button
                                title="Hapus"
                                onClick={() => handleDelete(m.id)}
                                style={{ background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ef4444' }}>delete</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Edit Modal ── */}
            {editingMaterial && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-bg-card)', borderRadius: '1rem',
                        border: '1px solid var(--color-border)', padding: '2rem',
                        width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-primary)' }}>Edit Materi</h3>
                            <button onClick={() => setEditingMaterial(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: 'var(--color-text-muted)' }}>close</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Judul Materi</label>
                            <input
                                type="text"
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Kategori</label>
                            <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} style={inputStyle}>
                                <option value="poster">Poster / Flyer</option>
                                <option value="copywriting">Copywriting (WA)</option>
                                <option value="video">Video Promosi</option>
                                <option value="brosur">Brosur PDF</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi / Isi Pesan</label>
                            <textarea
                                rows={5}
                                value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' }}
                                placeholder="Tulis deskripsi / copywriting..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setEditingMaterial(null)}
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 600 }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="btn btn-primary"
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 700 }}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
