import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export const ProspectList: React.FC = () => {
    const [prospects, setProspects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeneratingWA, setIsGeneratingWA] = useState(false);

    const fetchProspects = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/prospects');
            if (res.ok) {
                const data = await res.json();
                setProspects(data.prospects || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProspects();
    }, []);

    const handleWhatsApp = (phone: string, name: string) => {
        const message = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name}, perkenalkan saya agen resmi Al-Madinah. Apakah Bapak/Ibu memiliki rencana ibadah umroh dalam waktu dekat?`);
        // We log the manual action if we had a pure tracking endpoint, 
        // but for now just open WA
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${message}`, '_blank');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Prospect List (CRM)</h1>
                    <p style={{ color: 'var(--color-text-light)' }}>Kelola calon jamaah Anda</p>
                </div>
                {/* We'll skip the add modal for brevity, but they can add here */}
                <button className="btn btn-primary" onClick={() => alert('Fitur tambah prospek manual segera hadir')}>Tambah Prospek</button>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Nama</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>No. HP</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Status</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Sumber</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : prospects.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Belum ada prospek.</td></tr>
                        ) : prospects.map((p) => (
                            <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{p.fullName}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{p.phone || '-'}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem',
                                        backgroundColor: p.status === 'new' ? '#fef3c7' : p.status === 'converted' ? '#dcfce7' : '#e0e7ff',
                                        color: p.status === 'new' ? '#92400e' : p.status === 'converted' ? '#166534' : '#3730a3'
                                    }}>
                                        {p.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{p.source || '-'}</td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    {p.phone && p.status !== 'converted' && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#25D366', color: 'white', border: 'none' }}
                                            onClick={() => handleWhatsApp(p.phone, p.fullName)}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat</span> WA
                                        </button>
                                    )}
                                    {p.status !== 'converted' && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                            onClick={() => alert('Arahkan ke form registrasi package dengan data prospek terisi.')}
                                        >
                                            Convert
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
