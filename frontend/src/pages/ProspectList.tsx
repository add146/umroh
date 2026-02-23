import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface Prospect {
    id: string;
    fullName: string;
    phone: string | null;
    address: string | null;
    notes: string | null;
    source: string | null;
    status: string;
    followUpDate: string | null;
    convertedBookingId: string | null;
    createdAt: string;
}

const STATUS_OPTIONS = [
    { value: 'new', label: 'Baru', bg: '#422006', color: '#fbbf24' },
    { value: 'contacted', label: 'Dihubungi', bg: '#1e1b4b', color: '#a5b4fc' },
    { value: 'interested', label: 'Tertarik', bg: '#052e16', color: '#4ade80' },
    { value: 'not_interested', label: 'Tidak Minat', bg: '#1c1917', color: '#78716c' },
    { value: 'converted', label: 'Converted', bg: '#052e16', color: '#22c55e' },
];

const SOURCE_OPTIONS = ['Kenalan', 'Event', 'Sosmed', 'Referral', 'WhatsApp', 'Lainnya'];

const emptyForm = { fullName: '', phone: '', address: '', notes: '', source: '', followUpDate: '', status: 'new' };

export const ProspectList: React.FC = () => {
    const [prospects, setProspects] = useState<Prospect[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [isSaving, setIsSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const navigate = useNavigate();

    const fetchProspects = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/prospects');
            setProspects(data.prospects || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProspects(); }, []);

    const handleWhatsApp = (phone: string, name: string) => {
        const message = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name}, perkenalkan saya dari tim kami. Apakah Bapak/Ibu memiliki rencana ibadah umroh dalam waktu dekat?`);
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${message}`, '_blank');
    };

    const handleConvert = (p: Prospect) => {
        const params = new URLSearchParams();
        params.set('prospect', p.id);
        if (p.fullName) params.set('name', p.fullName);
        if (p.phone) params.set('phone', p.phone);
        navigate(`/register?${params.toString()}`);
    };

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
    };

    const openEdit = (p: Prospect) => {
        setEditingId(p.id);
        setForm({
            fullName: p.fullName,
            phone: p.phone || '',
            address: p.address || '',
            notes: p.notes || '',
            source: p.source || '',
            followUpDate: p.followUpDate || '',
            status: p.status,
        });
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingId ? `/api/prospects/${editingId}` : '/api/prospects';
            const method = editingId ? 'PATCH' : 'POST';
            await apiFetch(url, { method, body: JSON.stringify(form) });
            setShowModal(false);
            fetchProspects();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus prospek ini?')) return;
        try {
            await apiFetch(`/api/prospects/${id}`, { method: 'DELETE' });
            fetchProspects();
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await apiFetch(`/api/prospects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });
            fetchProspects();
        } catch (err) {
            console.error(err);
        }
    };

    const filtered = filterStatus === 'all' ? prospects : prospects.filter(p => p.status === filterStatus);
    const getStatusStyle = (status: string) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

    const counts = {
        all: prospects.length,
        new: prospects.filter(p => p.status === 'new').length,
        contacted: prospects.filter(p => p.status === 'contacted').length,
        interested: prospects.filter(p => p.status === 'interested').length,
        converted: prospects.filter(p => p.status === 'converted').length,
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem', borderRadius: '0.3rem',
        border: '1px solid var(--color-border)', backgroundColor: 'rgb(30, 29, 27)',
        color: 'var(--color-text)', fontSize: '0.875rem'
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.8125rem', marginBottom: '0.375rem',
        fontWeight: 600, color: 'var(--color-text-muted)'
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Prospect List (CRM)</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola calon jamaah potensial dan lacak progress follow-up Anda.</p>
                </div>
                <button
                    onClick={openAdd}
                    style={{
                        padding: '0.625rem 1.25rem', borderRadius: '0.3rem', border: 'none',
                        background: 'var(--color-primary)', color: 'white', fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                    Tambah Prospek
                </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'Semua' },
                    { key: 'new', label: 'Baru' },
                    { key: 'contacted', label: 'Dihubungi' },
                    { key: 'interested', label: 'Tertarik' },
                    { key: 'converted', label: 'Converted' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilterStatus(tab.key)}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                            backgroundColor: filterStatus === tab.key ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)',
                            color: filterStatus === tab.key ? 'white' : 'var(--color-text-muted)',
                            fontWeight: 600, fontSize: '0.8125rem',
                        }}
                    >
                        {tab.label} ({(counts as any)[tab.key] ?? 0})
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.3rem', overflow: 'hidden', padding: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Nama</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">No. HP</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Sumber</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">Follow-up</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400" style={{ textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-500">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="px-8 py-10 text-center text-gray-500">Belum ada prospek{filterStatus !== 'all' ? ` dengan status "${filterStatus}"` : ''}.</td></tr>
                        ) : filtered.map((p) => {
                            const st = getStatusStyle(p.status);
                            return (
                                <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <td className="px-8 py-4">
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.fullName}</div>
                                        {p.address && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{p.address}</div>}
                                    </td>
                                    <td className="px-8 py-4 text-sm">{p.phone || '-'}</td>
                                    <td className="px-8 py-4">
                                        <select
                                            value={p.status}
                                            onChange={e => handleStatusChange(p.id, e.target.value)}
                                            disabled={p.status === 'converted'}
                                            style={{
                                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                                fontWeight: 600, border: '1px solid transparent', cursor: 'pointer',
                                                backgroundColor: st.bg, color: st.color,
                                            }}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-8 py-4 text-sm text-gray-400">{p.source || '-'}</td>
                                    <td className="px-8 py-4 text-sm text-gray-400">{p.followUpDate || '-'}</td>
                                    <td className="px-8 py-4" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                            {p.phone && p.status !== 'converted' && (
                                                <button
                                                    onClick={() => handleWhatsApp(p.phone!, p.fullName)}
                                                    title="WhatsApp"
                                                    style={{
                                                        padding: '0.375rem 0.625rem', borderRadius: '4px', border: 'none',
                                                        backgroundColor: '#25D366', color: 'white', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600,
                                                    }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat</span> WA
                                                </button>
                                            )}
                                            {p.status !== 'converted' && (
                                                <button
                                                    onClick={() => handleConvert(p)}
                                                    title="Convert ke Booking"
                                                    style={{
                                                        padding: '0.375rem 0.625rem', borderRadius: '4px', border: 'none',
                                                        background: 'linear-gradient(135deg, var(--color-primary), #2e7d32)', color: 'white',
                                                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                                    }}
                                                >
                                                    Convert
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEdit(p)}
                                                title="Edit"
                                                style={{
                                                    padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)',
                                                    background: 'transparent', color: 'var(--color-text-muted)',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                title="Hapus"
                                                style={{
                                                    padding: '0.375rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)',
                                                    background: 'transparent', color: '#ef4444',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 9999, padding: '1rem',
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: 'rgb(26, 25, 23)', borderRadius: '0.5rem',
                        border: '1px solid var(--color-border)', width: '100%', maxWidth: '520px',
                        maxHeight: '90vh', overflow: 'auto',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.5rem 1.5rem 0' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                                {editingId ? 'Edit Prospek' : 'Tambah Prospek Baru'}
                            </h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', margin: 0 }}>
                                {editingId ? 'Perbarui data calon jamaah.' : 'Tambah calon jamaah potensial ke daftar CRM Anda.'}
                            </p>
                        </div>

                        <form onSubmit={handleSave} style={{ padding: '1.25rem 1.5rem 1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Nama Lengkap *</label>
                                <input required type="text" value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Contoh: Bpk. Ahmad" style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>No. HP / WhatsApp</label>
                                    <input type="text" value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="08123456789" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Sumber Lead</label>
                                    <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                                        style={inputStyle}>
                                        <option value="">-- Pilih Sumber --</option>
                                        {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={labelStyle}>Alamat</label>
                                <input type="text" value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Alamat tinggal" style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Tanggal Follow-up</label>
                                    <input type="date" value={form.followUpDate}
                                        onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                                        style={inputStyle} />
                                </div>
                                {editingId && (
                                    <div>
                                        <label style={labelStyle}>Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                            style={inputStyle}>
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={labelStyle}>Catatan</label>
                                <textarea rows={3} value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Catatan internal tentang prospek ini..." style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    padding: '0.625rem 1.25rem', borderRadius: '0.3rem',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                                }}>Batal</button>
                                <button type="submit" disabled={isSaving} style={{
                                    padding: '0.625rem 1.25rem', borderRadius: '0.3rem', border: 'none',
                                    background: 'var(--color-primary)', color: 'white',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: isSaving ? 0.6 : 1,
                                }}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Prospek'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
