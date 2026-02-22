import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export const AgentJamaahView: React.FC = () => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await apiFetch('/api/bookings');
            if (res.ok) {
                const data = await res.json();
                setBookings(data.bookings || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleReadyReview = async (id: string) => {
        if (!window.confirm('Tandai jamaah ini sudah siap direview Cabang?')) return;
        try {
            const res = await apiFetch(`/api/bookings/${id}/ready-for-review`, { method: 'POST' });
            if (res.ok) {
                alert('Berhasil ditandai siap direview');
                fetchBookings();
            } else {
                alert('Gagal menandai');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleWhatsApp = async (id: string, phone: string, name: string) => {
        const message = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name}, kami dari tim pendaftaran Al-Madinah ingin menginformasikan...`);
        // Log follow up
        await apiFetch(`/api/bookings/${id}/follow-up`, { method: 'POST' });
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${message}`, '_blank');
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Data Jamaah (Follow-Up)</h1>
                    <p style={{ color: 'var(--color-text-light)' }}>Pantau dan verifikasi data jamaah Anda sebelum direview Cabang</p>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Jamaah</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Pembayaran</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem' }}>Status</th>
                            <th style={{ padding: '1rem', fontSize: '0.875rem', textAlign: 'right' }}>Aksi Follow-Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Belum ada jamaah.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{b.pilgrim?.phone || '-'}</p>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                        backgroundColor: b.paymentStatus === 'paid' ? '#dcfce7' : b.paymentStatus === 'partial' ? '#fef08a' : '#fee2e2',
                                        color: b.paymentStatus === 'paid' ? '#166534' : b.paymentStatus === 'partial' ? '#854d0e' : '#991b1b'
                                    }}>
                                        {b.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem',
                                        backgroundColor: '#e0f2fe', color: '#0369a1'
                                    }}>
                                        {b.bookingStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    {b.pilgrim?.phone && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#25D366', color: 'white', border: 'none' }}
                                            onClick={() => handleWhatsApp(b.id, b.pilgrim.phone, b.pilgrim.name)}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>chat</span> WA
                                        </button>
                                    )}
                                    {b.bookingStatus !== 'pending' && b.bookingStatus !== 'confirmed' && (
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                                            onClick={() => handleReadyReview(b.id)}
                                        >
                                            Tandai Siap Review
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
