import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' };

export const EquipmentSetManage: React.FC = () => {
    const [sets, setSets] = useState<any[]>([]);
    const [masterItems, setMasterItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSet, setEditingSet] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        equipmentItemIds: [] as string[]
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [setsData, itemsData] = await Promise.all([
                apiFetch<any[]>('/api/operations/equipment-sets'),
                apiFetch<any[]>('/api/operations/equipment')
            ]);
            setSets(setsData || []);
            setMasterItems(itemsData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openCreateModal = () => {
        setEditingSet(null);
        setFormData({ name: '', description: '', equipmentItemIds: [] });
        setIsModalOpen(true);
    };

    const openEditModal = (set: any) => {
        setEditingSet(set);
        let itemIds: string[] = [];
        try {
            itemIds = JSON.parse(set.equipmentItemIds || '[]');
        } catch (e) {
            console.error(e);
        }
        setFormData({
            name: set.name,
            description: set.description || '',
            equipmentItemIds: itemIds
        });
        setIsModalOpen(true);
    };

    const handleCheckboxChange = (itemId: string, checked: boolean) => {
        setFormData(prev => {
            const newIds = checked
                ? [...prev.equipmentItemIds, itemId]
                : prev.equipmentItemIds.filter(id => id !== itemId);
            return { ...prev, equipmentItemIds: newIds };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            equipmentItemIds: JSON.stringify(formData.equipmentItemIds)
        };

        try {
            if (editingSet) {
                await apiFetch(`/api/operations/equipment-sets/${editingSet.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/operations/equipment-sets', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan kategori perlengkapan');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kategori perlengkapan ini?')) return;
        try {
            await apiFetch(`/api/operations/equipment-sets/${id}`, {
                method: 'DELETE'
            });
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus kategori perlengkapan');
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Kategori Perlengkapan</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Atur paket perlengkapan khusus seperti set Gold, Silver, Bronze, dll.</p>
                </div>
                <button onClick={openCreateModal} className="btn btn-primary">
                    + Tambah Kategori
                </button>
            </div>

            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>Kategori</th>
                            <th style={thStyle}>Deskripsi</th>
                            <th style={thStyle}>Jumlah Item</th>
                            <th style={thStyle}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : sets.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada kategori perlengkapan.</td></tr>
                        ) : sets.map((set) => {
                            let count = 0;
                            try { count = JSON.parse(set.equipmentItemIds || '[]').length; } catch { }
                            
                            // Badge color logic
                            let badgeColor = '#b5a575'; // Gold default
                            if (set.name.toLowerCase().includes('silver')) badgeColor = '#94a3b8';
                            if (set.name.toLowerCase().includes('bronze')) badgeColor = '#b45309';

                            return (
                                <tr key={set.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <td style={tdStyle}>
                                        <span style={{
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            backgroundColor: `rgba(${badgeColor === '#94a3b8' ? '148,163,184' : badgeColor === '#b45309' ? '180,83,9' : '181,165,117'}, 0.1)`,
                                            color: badgeColor,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>
                                            {set.name}
                                        </span>
                                    </td>
                                    <td style={{ ...tdStyle, color: 'var(--color-text-light)' }}>{set.description || '-'}</td>
                                    <td style={{ ...tdStyle, fontWeight: 700 }}>{count} Item</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => openEditModal(set)}
                                                style={{ background: 'none', border: '1px solid #333', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', color: 'var(--color-text-light)', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(set.id)}
                                                style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)} />
                    <div style={{ position: 'relative', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', width: '95%', maxWidth: '480px', maxHeight: '85vh', overflow: 'auto', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                                {editingSet ? 'Edit Kategori Perlengkapan' : 'Tambah Kategori Perlengkapan'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Kategori *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Contoh: Gold, Silver, VIP" style={inputStyle} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>Deskripsi</label>
                                <input type="text" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Koper Premium + Ihram VIP..." style={inputStyle} />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>Pilih Item Perlengkapan *</label>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0.5rem',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    background: 'var(--color-bg-alt)'
                                }}>
                                    {masterItems.length === 0 ? (
                                        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.8125rem', textAlign: 'center', padding: '1rem' }}>Belum ada item master perlengkapan.</p>
                                    ) : masterItems.map((item) => (
                                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', color: 'white' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.equipmentItemIds.includes(item.id)}
                                                onChange={e => handleCheckboxChange(item.id, e.target.checked)}
                                                style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                                            />
                                            <span>{item.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.875rem' }}>Batal</button>
                                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}>Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentSetManage;
