import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export const IncomingLeads: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/leads/incoming');
            if (res.ok) {
                const data = await res.json();
                setLeads(data.incomingLeads || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleAcceptLead = async (id: string) => {
        try {
            const res = await apiFetch(`/api/prospects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'contacted' })
            });
            if (res.ok) {
                alert('Lead diterima dan masuk ke daftar Prospek.');
                fetchLeads();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Inbox Lead Masuk</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Lead jamaah yang di-assign oleh Cabang/Mitra kepada Anda.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {isLoading ? (
                    <p>Loading...</p>
                ) : leads.length === 0 ? (
                    <div style={{ padding: '2rem', backgroundColor: 'var(--color-bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Belum ada lead masuk baru.
                    </div>
                ) : leads.map(l => (
                    <div key={l.id} style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.125rem' }}>{l.fullName}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{l.phone || 'No phone'}</p>
                            </div>
                            <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>BARU</span>
                        </div>
                        <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1.5rem', borderLeft: '3px solid var(--color-primary)' }}>
                            <span style={{ fontWeight: 600 }}>Catatan Pusat:</span><br />
                            {l.notes || '-'}
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            onClick={() => handleAcceptLead(l.id)}
                        >
                            Terima & Follow-up
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
