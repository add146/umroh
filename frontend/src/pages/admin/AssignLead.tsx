import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

export const AssignLead: React.FC = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [isLoadingAgents, setIsLoadingAgents] = useState(true);
    const [isAssigning, setIsAssigning] = useState(false);

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
                // Fetch downlines. Cabangs can assign to Mitras/Agents.
                // Assuming GET /api/users returns users downlines (as per our past structure)
                const res = await apiFetch('/api/users');
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data.users?.filter((u: any) => u.role === 'agen' || u.role === 'mitra') || []);
                }
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
        try {
            const res = await apiFetch('/api/leads/assign', {
                method: 'POST',
                body: JSON.stringify(form)
            });
            if (res.ok) {
                alert('Lead berhasil didistribusikan ke Agen!');
                setForm({ targetAgentId: '', fullName: '', phone: '', notes: '' });
            } else {
                const err = await res.json();
                alert(`Gagal: ${err.error || 'Terjadi kesalahan'}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsAssigning(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Assign Lead ke Agen</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Terima calon jamaah? Distribusikan ke Agen terbaik Anda untuk difollow-up.</p>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '2rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                <form onSubmit={handleAssign}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Pilih Agen / Mitra Tujuan</label>
                        <select
                            required
                            value={form.targetAgentId}
                            onChange={e => setForm({ ...form, targetAgentId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc' }}
                        >
                            <option value="" disabled>-- Pilih Agen / Mitra --</option>
                            {isLoadingAgents ? (
                                <option disabled>Loading...</option>
                            ) : agents.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.role.toUpperCase()})</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Lengkap Prospek</label>
                        <input
                            type="text"
                            required
                            value={form.fullName}
                            onChange={e => setForm({ ...form, fullName: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            placeholder="Contoh: Bpk. H. Ahmad"
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>No. WhatsApp / HP</label>
                        <input
                            type="text"
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            placeholder="08123456789"
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Catatan Internal</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                            placeholder="Tertarik paket Plus Turki keberangkatan Desember."
                        ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }} disabled={isAssigning || isLoadingAgents}>
                        {isAssigning ? 'Mengirim Data...' : 'Assign Lead Sekarang'}
                    </button>
                </form>
            </div>
        </div>
    );
};
