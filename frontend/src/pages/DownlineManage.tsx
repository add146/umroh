import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiFetch } from '../lib/api';

export const DownlineManage: React.FC = () => {
    const user = useAuthStore(state => state.user);
    const [downlines, setDownlines] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        targetRole: '',
    });

    const fetchDownlines = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/users/downline');
            setDownlines(data.downlines || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDownlines();
    }, []);

    const handleCreateDownline = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify(formData),
            });
            setIsModalOpen(false);
            setFormData({ name: '', email: '', phone: '', password: '', targetRole: '' });
            fetchDownlines();
        } catch (err: any) {
            alert(err.message || 'Failed to add downline');
        }
    };

    const handleWhatsApp = (phone: string, name: string) => {
        if (!phone) return;
        const msg = encodeURIComponent(`Assalamualaikum ${name}, ini dari pusat layanan manajemen jamaah.`);
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${msg}`, '_blank');
    };



    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Kelola Downline</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn btn-primary"
                >
                    + Tambah Anggota
                </button>
            </div>

            <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Nama</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Posisi</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No. WhatsApp</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading records...</td></tr>
                        ) : downlines.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>You have no downline members yet.</td></tr>
                        ) : downlines.map(d => (
                            <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{d.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                        fontWeight: 600, backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                                        textTransform: 'uppercase'
                                    }}>{d.role}</span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{d.email || '-'}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{d.phone || '-'}</td>
                                <td style={{ padding: '1rem' }}>
                                    {d.phone && (
                                        <button
                                            onClick={() => handleWhatsApp(d.phone, d.name)}
                                            style={{
                                                padding: '0.375rem 0.625rem', borderRadius: '4px', border: 'none',
                                                backgroundColor: '#25D366', color: 'white', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600,
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat</span>
                                            Chat WA
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius)', width: '100%', maxWidth: '400px' }}>
                        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Tambah Downline / Partner</h2>
                        <form onSubmit={handleCreateDownline}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Nama Lengkap *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No. WhatsApp *</label>
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="08123456789" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Email (Opsional)</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }} />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Password *</label>
                                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }} />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Posisi (Role)</label>
                                <select value={formData.targetRole} onChange={e => setFormData({ ...formData, targetRole: e.target.value })} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-bg-alt)', color: 'var(--color-text)' }}>
                                    {user?.role === 'pusat' && <option value="cabang">Cabang</option>}
                                    {['pusat', 'cabang'].includes(user?.role || '') && <option value="mitra">Mitra</option>}
                                    {['pusat', 'cabang', 'mitra'].includes(user?.role || '') && <option value="agen">Agen</option>}
                                    {['pusat', 'cabang', 'mitra', 'agen'].includes(user?.role || '') && <option value="reseller">Reseller</option>}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>Batal</button>
                                <button type="submit" className="btn btn-primary">Simpan Anggota</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
