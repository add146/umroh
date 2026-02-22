import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

interface EquipmentItem {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
}

const EquipmentMaster: React.FC = () => {
    const [items, setItems] = useState<EquipmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        try {
            const data = await apiFetch<EquipmentItem[]>('/api/operations/equipment');
            setItems(data || []);
        } catch { toast.error('Gagal memuat data'); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            await apiFetch('/api/operations/equipment', { method: 'POST', body: JSON.stringify(formData) });
            toast.success('Item perlengkapan berhasil ditambahkan');
            setFormData({ name: '', description: '' });
            setIsModalOpen(false);
            fetchItems();
        } catch { toast.error('Gagal menambahkan item'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Hapus item "${name}"?`)) return;
        try {
            await apiFetch(`/api/operations/equipment/${id}`, { method: 'DELETE' });
            toast.success('Item dihapus');
            fetchItems();
        } catch { toast.error('Gagal menghapus item'); }
    };

    const defaultItems = [
        { name: 'Paspor', description: 'Penyerahan paspor asli ke jamaah' },
        { name: 'Tiket Pesawat', description: 'E-ticket / boarding pass' },
        { name: 'Koper', description: 'Koper umroh standar 20kg' },
        { name: 'Baju Ihram / Mukena', description: 'Perlengkapan ibadah' },
        { name: 'Buku Panduan Manasik', description: 'Buku doa dan panduan' },
        { name: 'ID Card Jamaah', description: 'Kalung kartu identitas' },
        { name: 'Tas Jinjing', description: 'Tas cabin / hand carry' },
        { name: 'Air Zamzam', description: 'Botol/galon air zamzam (kepulangan)' },
    ];

    const seedDefaults = async () => {
        if (!confirm('Tambahkan item perlengkapan default?')) return;
        setSaving(true);
        for (const item of defaultItems) {
            try {
                await apiFetch('/api/operations/equipment', { method: 'POST', body: JSON.stringify(item) });
            } catch { /* skip duplicates */ }
        }
        toast.success('Item default berhasil ditambahkan');
        setSaving(false);
        fetchItems();
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Master Perlengkapan</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola daftar item perlengkapan yang akan diserahkan ke jamaah.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {items.length === 0 && (
                        <button onClick={seedDefaults} disabled={saving} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }}>auto_fix_high</span>
                            Isi Default
                        </button>
                    )}
                    <button onClick={() => setIsModalOpen(true)} style={{ padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, background: 'var(--color-primary)', color: 'black', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '0.5rem', verticalAlign: 'middle' }}>add</span>
                        Tambah Item
                    </button>
                </div>
            </div>

            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nama Item</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Deskripsi</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)' }}>Ditambahkan</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--color-text-muted)' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</p>
                                <p>Belum ada item perlengkapan. Klik "Isi Default" untuk memulai.</p>
                            </td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '0.5rem', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>inventory_2</span>
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'white' }}>{item.name}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', color: 'var(--color-text-light)', fontSize: '0.8125rem' }}>{item.description || '-'}</td>
                                <td style={{ padding: '1rem 1.5rem', color: '#888', fontSize: '0.8125rem' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID') : '-'}</td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <button onClick={() => handleDelete(item.id, item.name)} style={{ padding: '0.375rem 0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.375rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', padding: '2rem', borderRadius: '1rem', width: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Tambah Item Perlengkapan</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}>
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.375rem' }}>Nama Item *</label>
                                <input type="text" required placeholder="Contoh: Paspor, Tiket Pesawat, Koper"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#0a0907', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.375rem' }}>Deskripsi</label>
                                <input type="text" placeholder="Keterangan singkat (opsional)"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', background: '#0a0907', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'white', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>Batal</button>
                                <button type="submit" disabled={saving} style={{ flex: 1, padding: '0.75rem', background: 'var(--color-primary)', color: 'black', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentMaster;
