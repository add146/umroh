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

    // Filter bookings into columns
    const unpaidBookings = bookings.filter(b => b.paymentStatus === 'unpaid' && b.bookingStatus !== 'cancelled');
    const partialBookings = bookings.filter(b => b.paymentStatus === 'partial' && b.bookingStatus !== 'cancelled');
    const paidBookings = bookings.filter(b => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled');

    const renderCard = (b: any) => (
        <div key={b.id} style={{
            backgroundColor: 'rgb(30, 29, 27)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
        }}>
            <div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{b.pilgrim?.name || 'Anon'}</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{b.pilgrim?.phone || '-'}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                    backgroundColor: b.paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : b.paymentStatus === 'partial' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                    color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#fbbf24' : '#f87171'
                }}>
                    {b.paymentStatus.toUpperCase()}
                </span>
                <span style={{
                    padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                    backgroundColor: 'rgba(12, 165, 233, 0.15)', color: '#38bdf8'
                }}>
                    {b.bookingStatus.toUpperCase()}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                {b.pilgrim?.phone && (
                    <button
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: 'none', cursor: 'pointer' }}
                        onClick={() => handleWhatsApp(b.id, b.pilgrim.phone, b.pilgrim.name)}
                        title="Hubungi WhatsApp"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>chat</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>WA</span>
                    </button>
                )}
                {b.bookingStatus !== 'pending' && b.bookingStatus !== 'confirmed' && (
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '0.375rem', textTransform: 'uppercase', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                        onClick={() => handleReadyReview(b.id)}
                    >
                        Review
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Data Jamaah (Follow-Up)</h1>
                    <p style={{ color: 'var(--color-text-light)' }}>Pantau dan verifikasi data jamaah Anda sebelum direview Cabang</p>
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat pipeline jamaah...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    {/* Column 1: Baru Terdaftar */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ef4444' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Terdaftar Baru</h3>
                            <span style={{ background: '#ef4444', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{unpaidBookings.length}</span>
                        </div>
                        <div>
                            {unpaidBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                unpaidBookings.map(renderCard)
                            )}
                        </div>
                    </div>

                    {/* Column 2: DP / Cicilan */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f59e0b' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>DP / Proses Cicilan</h3>
                            <span style={{ background: '#f59e0b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{partialBookings.length}</span>
                        </div>
                        <div>
                            {partialBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                partialBookings.map(renderCard)
                            )}
                        </div>
                    </div>

                    {/* Column 3: Lunas */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #22c55e' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Lunas</h3>
                            <span style={{ background: '#22c55e', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{paidBookings.length}</span>
                        </div>
                        <div>
                            {paidBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                paidBookings.map(renderCard)
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

