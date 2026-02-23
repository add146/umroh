import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export const IncomingLeads: React.FC = () => {
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeads = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/leads/incoming');
            setLeads(data.incomingLeads || []);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchLeads(); }, []);

    const handleAcceptLead = async (id: string) => {
        try {
            await apiFetch(`/api/prospects/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'contacted' })
            });
            fetchLeads();
        } catch (err) {
            console.error(err);
        }
    };

    const handleWhatsApp = (phone: string, name: string) => {
        if (!phone) return;
        const msg = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name}, saya agen yang ditugaskan untuk membantu Anda terkait rencana ibadah umroh. Apakah bisa kita diskusikan lebih lanjut?`);
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${msg}`, '_blank');
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Inbox Lead Masuk</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Lead jamaah yang di-assign oleh Cabang/Mitra kepada Anda.</p>
                </div>
                {leads.length > 0 && (
                    <span style={{
                        padding: '0.375rem 0.75rem', borderRadius: '999px', fontSize: '0.8125rem',
                        fontWeight: 700, backgroundColor: '#dc2626', color: 'white'
                    }}>
                        {leads.length} baru
                    </span>
                )}
            </div>

            {/* Lead Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {isLoading ? (
                    <div style={{
                        padding: '3rem', gridColumn: '1 / -1', textAlign: 'center',
                        color: 'var(--color-text-muted)', background: 'rgb(19, 18, 16)',
                        borderRadius: '0.3rem', border: '1px solid var(--color-border)'
                    }}>Loading...</div>
                ) : leads.length === 0 ? (
                    <div style={{
                        padding: '3rem', gridColumn: '1 / -1', textAlign: 'center',
                        background: 'rgb(19, 18, 16)', borderRadius: '0.3rem',
                        border: '1px solid var(--color-border)', color: 'var(--color-text-muted)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '0.75rem', opacity: 0.3 }}>inbox</span>
                        Belum ada lead masuk baru. Cabang/Mitra akan mengassign lead ke Anda.
                    </div>
                ) : leads.map(l => (
                    <div key={l.id} style={{
                        background: 'rgb(19, 18, 16)', padding: '1.5rem',
                        borderRadius: '0.3rem', border: '1px solid var(--color-border)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem', margin: '0 0 0.25rem 0' }}>{l.fullName}</h3>
                                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>{l.phone || 'Tidak ada nomor HP'}</p>
                            </div>
                            <span style={{
                                backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                padding: '0.25rem 0.625rem', borderRadius: '4px',
                                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                            }}>BARU</span>
                        </div>

                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.75rem',
                            borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '1.25rem',
                            borderLeft: '3px solid var(--color-primary)', color: 'var(--color-text-muted)'
                        }}>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Catatan:</span><br />
                            {l.notes || '-'}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleAcceptLead(l.id)}
                                style={{
                                    flex: 1, padding: '0.625rem', borderRadius: '0.3rem', border: 'none',
                                    background: 'var(--color-primary)', color: 'white',
                                    cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                Terima & Follow-up
                            </button>
                            {l.phone && (
                                <button
                                    onClick={() => handleWhatsApp(l.phone, l.fullName)}
                                    title="WhatsApp"
                                    style={{
                                        padding: '0.625rem 0.75rem', borderRadius: '0.3rem', border: 'none',
                                        backgroundColor: '#25D366', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
