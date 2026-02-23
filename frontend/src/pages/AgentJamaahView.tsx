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

            <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pembayaran</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi Follow-Up</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat data jamaah...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Belum ada jamaah.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{b.pilgrim?.phone || '-'}</p>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: b.paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : b.paymentStatus === 'partial' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                        color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#fbbf24' : '#f87171'
                                    }}>
                                        {b.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: 'rgba(12, 165, 233, 0.15)', color: '#38bdf8'
                                    }}>
                                        {b.bookingStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        {b.pilgrim?.phone && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: 'none', cursor: 'pointer' }}
                                                onClick={() => handleWhatsApp(b.id, b.pilgrim.phone, b.pilgrim.name)}
                                                title="Hubungi WhatsApp"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>chat</span>
                                            </button>
                                        )}
                                        {b.bookingStatus !== 'pending' && b.bookingStatus !== 'confirmed' && (
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}
                                                onClick={() => handleReadyReview(b.id)}
                                            >
                                                Siap Review
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
