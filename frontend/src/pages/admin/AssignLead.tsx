import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const AssignLead: React.FC = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        targetAgentId: '',
        fullName: '',
        phone: '',
        notes: ''
    });

    useEffect(() => {
        const fetchAgents = async () => {
            setIsLoadingAgents(true);
            try {
                const data = await apiFetch('/api/users');
                setAgents(data.users?.filter((u: any) => u.role === 'agen' || u.role === 'mitra') || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoadingAgents(false);
            }
        };
        fetchAgents();
    }, []);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAssigning(true);
        setSuccess(false);
        try {
            await apiFetch('/api/leads/assign', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            setSuccess(true);
            setForm({ targetAgentId: '', fullName: '', phone: '', notes: '' });
            setTimeout(() => setSuccess(false), 4000);
        } catch (err: any) {
            alert(`Gagal: ${err.message || 'Terjadi kesalahan'}`);
        } finally {
            setIsAssigning(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.75rem', borderRadius: '0.3rem',
        border: '1px solid var(--color-border)', backgroundColor: 'rgb(30, 29, 27)',
        color: 'var(--color-text)', fontSize: '0.875rem',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.8125rem', marginBottom: '0.375rem',
        fontWeight: 600, color: 'var(--color-text-muted)',
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Assign Lead ke Agen</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                    Terima calon jamaah? Distribusikan ke Agen terbaik Anda untuk di-follow-up.
                </p>
            </div>

            {success && (
                <div style={{
                    padding: '0.875rem 1.25rem', borderRadius: '0.3rem', marginBottom: '1.5rem',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e', fontWeight: 600, fontSize: '0.875rem',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                    Lead berhasil didistribusikan ke Agen! Agen akan menerima notifikasi.
                </div>
            )}

            <div style={{
                background: 'rgb(19, 18, 16)', padding: '2rem', borderRadius: '0.3rem',
                border: '1px solid var(--color-border)',
            }}>
                <form onSubmit={handleAssign}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Pilih Agen / Mitra Tujuan *</label>
                        <select
                            required
                            value={form.targetAgentId}
                            onChange={e => setForm({ ...form, targetAgentId: e.target.value })}
                            style={inputStyle}
                        >
                            <option value="" disabled>-- Pilih Agen / Mitra --</option>
                            {isLoadingAgents ? (
                                <option disabled>Loading...</option>
                            ) : agents.length === 0 ? (
                                <option disabled>Tidak ada Agen/Mitra ditemukan</option>
                            ) : agents.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.role.toUpperCase()})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>Nama Lengkap Prospek *</label>
                        <input
                            type="text" required
                            value={form.fullName}
                            onChange={e => setForm({ ...form, fullName: e.target.value })}
                            style={inputStyle}
                            placeholder="Contoh: Bpk. H. Ahmad"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={labelStyle}>No. WhatsApp / HP</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            style={inputStyle}
                            placeholder="08123456789"
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={labelStyle}>Catatan Internal</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            style={inputStyle}
                            placeholder="Tertarik paket Plus Turki keberangkatan Desember."
                        />
                    </div>

                    <button type="submit" disabled={isAssigning || isLoadingAgents} style={{
                        width: '100%', padding: '0.875rem', borderRadius: '0.3rem', border: 'none',
                        background: 'var(--color-primary)', color: 'white', fontWeight: 700,
                        fontSize: '0.9375rem', cursor: 'pointer', opacity: isAssigning ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    }}>
                        {isAssigning ? (
                            'Mengirim Data...'
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                                Assign Lead Sekarang
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};
