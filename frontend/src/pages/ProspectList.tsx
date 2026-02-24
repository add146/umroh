import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { QuickBookModal } from '../components/QuickBookModal';

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
    const [showQuickBook, setShowQuickBook] = useState(false);
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
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px', height: '48px', background: 'var(--color-primary-bg)',
                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>group</span>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Prospect List (CRM)</h1>
                        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola calon jamaah potensial dan lacak progress follow-up Anda.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setShowQuickBook(true)}
                        className="btn"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>bolt</span>
                        Quick Book
                    </button>
                    <button
                        onClick={openAdd}
                        className="btn btn-primary"
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person_add</span>
                        Tambah Prospek
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
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
                            padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid',
                            borderColor: filterStatus === tab.key ? 'var(--color-primary)' : 'var(--color-border)',
                            backgroundColor: filterStatus === tab.key ? 'var(--color-primary-bg)' : 'transparent',
                            color: filterStatus === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: 600, fontSize: '0.8125rem', transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                    >
                        {tab.label} <span style={{ opacity: 0.6, marginLeft: '4px' }}>{(counts as any)[tab.key] ?? 0}</span>
                    </button>
                ))}
            </div>

            {/* Table Container */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No. HP</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sumber</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Follow-up</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Belum ada prospek{filterStatus !== 'all' ? ` dengan status "${filterStatus}"` : ''}.</td></tr>
                        ) : filtered.map((p) => {
                            const st = getStatusStyle(p.status);
                            return (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="hover:bg-white/[0.02]">
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{p.fullName}</div>
                                        {p.address && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{p.address}</div>}
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>{p.phone || '-'}</td>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <select
                                            value={p.status}
                                            onChange={e => handleStatusChange(p.id, e.target.value)}
                                            disabled={p.status === 'converted'}
                                            style={{
                                                padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem',
                                                fontWeight: 700, border: 'none', cursor: 'pointer',
                                                backgroundColor: st.bg, color: st.color, outline: 'none'
                                            }}
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value} style={{ background: '#1a1917', color: 'white' }}>{s.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{p.source || '-'}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{p.followUpDate || '-'}</td>
                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {p.phone && p.status !== 'converted' && (
                                                <button
                                                    onClick={() => handleWhatsApp(p.phone!, p.fullName)}
                                                    style={{
                                                        padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                                                        backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', cursor: 'pointer'
                                                    }}
                                                    title="Hubungi WhatsApp"
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block' }}>chat</span>
                                                </button>
                                            )}
                                            {p.status !== 'converted' && (
                                                <button
                                                    onClick={() => handleConvert(p)}
                                                    style={{
                                                        padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none',
                                                        background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                                                        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                                                    }}
                                                >
                                                    Convert
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEdit(p)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                                                    background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block' }}>edit_square</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: '0.5rem', border: 'none',
                                                    background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block' }}>delete</span>
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
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 9999, padding: '1.5rem',
                    backdropFilter: 'blur(4px)'
                }} onClick={() => setShowModal(false)}>
                    <div style={{
                        background: '#1a1917', borderRadius: '1.25rem',
                        border: '1px solid var(--color-border)', width: '100%', maxWidth: '560px',
                        maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '2rem 2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
                                    {editingId ? 'Edit Prospek' : 'Tambah Prospek Baru'}
                                </h2>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
                                    {editingId ? 'Perbarui data calon jamaah.' : 'Tambah calon jamaah potensial ke daftar CRM Anda.'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ color: 'var(--color-text-light)' }}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSave} style={{ padding: '2rem' }}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Nama Lengkap *</label>
                                <input required type="text" value={form.fullName}
                                    onChange={e => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Contoh: Bpk. Ahmad"
                                    style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle}>No. HP / WhatsApp</label>
                                    <input type="text" value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="08123456789"
                                        style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Sumber Lead</label>
                                    <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                                        style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }}>
                                        <option value="" style={{ background: '#1a1917' }}>-- Pilih Sumber --</option>
                                        {SOURCE_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#1a1917' }}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={labelStyle}>Alamat</label>
                                <input type="text" value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Alamat tinggal"
                                    style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div>
                                    <label style={labelStyle}>Tanggal Follow-up</label>
                                    <input type="date" value={form.followUpDate}
                                        onChange={e => setForm({ ...form, followUpDate: e.target.value })}
                                        style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }} />
                                </div>
                                {editingId && (
                                    <div>
                                        <label style={labelStyle}>Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                            style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }}>
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value} style={{ background: '#1a1917' }}>{s.label}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={labelStyle}>Catatan</label>
                                <textarea rows={3} value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Catatan internal tentang prospek ini..."
                                    style={{ ...inputStyle, background: '#0a0907', border: '1px solid #333', padding: '0.875rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    flex: 1, padding: '1rem', borderRadius: '0.75rem',
                                    border: '1px solid var(--color-border)', background: 'transparent',
                                    color: 'var(--color-text-muted)', cursor: 'pointer', fontWeight: 600
                                }}>Batal</button>
                                <button type="submit" disabled={isSaving} className="btn btn-primary" style={{
                                    flex: 2, padding: '1rem', borderRadius: '0.75rem', opacity: isSaving ? 0.6 : 1,
                                }}>{isSaving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambah Prospek'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick Book Modal */}
            <QuickBookModal
                isOpen={showQuickBook}
                onClose={() => setShowQuickBook(false)}
                onSuccess={(id) => {
                    setShowQuickBook(false);
                    navigate(`/payment/${id}`);
                }}
            />
        </div>
    );
};
