import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import PaymentGateway from '../components/payment/PaymentGateway';

const STATUS_STEPS = [
    { key: 'booking', label: 'BOOKING', sub: 'Completed', icon: 'shopping_cart' },
    { key: 'dp', label: 'DP', sub: 'Confirmed', icon: 'payments' },
    { key: 'installment', label: 'CICILAN', sub: 'In Progress', icon: 'account_balance_wallet' },
    { key: 'fully_paid', label: 'LUNAS', sub: 'Locked', icon: 'lock' },
    { key: 'departed', label: 'BERANGKAT', sub: 'Scheduled', icon: 'flight_takeoff' },
];

export default function RegistrationStatusPage() {
    const { id } = useParams<{ id: string }>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch<any>(`/api/bookings/${id}/status`)
            .then(data => setBooking(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            <p style={{ marginTop: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--color-text-muted)' }}>Memuat Data...</p>
        </div>
    );

    if (!booking) return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '9999px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#ef4444', fontVariationSettings: "'FILL' 1" }}>shield_question</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Akses Ditolak</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Data pendaftaran tidak ditemukan atau kadaluarsa.</p>
            </div>
        </div>
    );

    // Determine current payment step (simplified)
    const activeStep = booking.bookingStatus === 'confirmed' ? 4 : booking.invoices?.some((i: any) => i.status === 'paid') ? 2 : 1;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}>

            {/* Header */}
            <nav style={{ background: '#131210', borderBottom: '1px solid var(--color-border)', padding: '0 1.5rem', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0a0907', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                    </div>
                    <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)' }}>Customer Portal</span>
                    <div style={{ width: '1px', height: '16px', background: 'var(--color-border)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        ID: {id?.substring(0, 8).toUpperCase()}
                    </span>
                </div>
            </nav>

            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

                {/* Greeting */}
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.375rem' }}>
                        Assalamu'alaikum, {booking.pilgrim?.name?.split(' ')[0]}!
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Perjalanan umroh Anda masih dalam proses. Berikut status terkini.
                    </p>
                </div>

                {/* ===== JOURNEY TIMELINE ===== */}
                <div className="dark-card" style={{ borderRadius: '1.25rem', padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                        {/* Background line */}
                        <div style={{ position: 'absolute', top: '19px', left: '32px', right: '32px', height: '2px', background: 'var(--color-border)' }} />
                        <div style={{ position: 'absolute', top: '19px', left: '32px', height: '2px', background: 'var(--color-primary)', width: `${(activeStep / (STATUS_STEPS.length - 1)) * 100}%`, transition: 'width 0.6s ease' }} />

                        {STATUS_STEPS.map((step, idx) => {
                            const isDone = idx < activeStep;
                            const isActive = idx === activeStep;
                            return (
                                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 2 }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '9999px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                                        background: isDone ? 'var(--color-primary)' : isActive ? 'var(--color-primary-bg)' : '#131210',
                                        border: `2px solid ${isDone ? 'var(--color-primary)' : isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                        boxShadow: isActive ? 'var(--shadow-gold)' : 'none'
                                    }}>
                                        {isDone
                                            ? <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0a0907', fontVariationSettings: "'FILL' 1" }}>check</span>
                                            : <span className="material-symbols-outlined" style={{ fontSize: '18px', color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                                        }
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.6875rem', fontWeight: 900, letterSpacing: '0.05em', color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{step.label}</p>
                                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-light)' }}>{step.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== GRID: Payment + Documents ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    {/* Payment Summary */}
                    <div className="dark-card" style={{ borderRadius: '1.25rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                                <h3 style={{ fontWeight: 800 }}>Ringkasan Pembayaran</h3>
                            </div>
                            <button style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>Lihat History</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {[
                                { label: 'TOTAL PAKET', value: booking.departure?.package?.basePrice, style: {} },
                                { label: 'TERBAYAR (33%)', value: Math.floor((booking.departure?.package?.basePrice || 0) * 0.33), style: { color: 'var(--color-primary)' } },
                                { label: 'SISA TAGIHAN', value: Math.ceil((booking.departure?.package?.basePrice || 0) * 0.67), style: {} },
                                { label: 'JATUH TEMPO', value: null, date: 'Oct 15, 2025', style: { color: 'var(--color-error)' } },
                            ].map((item, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '0.75rem', padding: '1rem' }}>
                                    <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>{item.label}</p>
                                    {item.value !== null && item.value !== undefined ? (
                                        <p style={{ fontSize: '1.25rem', fontWeight: 900, ...item.style }}>
                                            Rp {item.value?.toLocaleString('id-ID')}
                                        </p>
                                    ) : (
                                        <p style={{ fontSize: '1.125rem', fontWeight: 900, ...item.style }}>{item.date}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button style={{
                            width: '100%', padding: '0.875rem',
                            background: 'var(--color-primary)', color: 'var(--color-bg)',
                            borderRadius: '0.75rem', fontWeight: 900, fontSize: '0.9375rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            boxShadow: 'var(--shadow-gold)', transition: 'all 0.2s'
                        }}>
                            Bayar Cicilan
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>arrow_forward</span>
                        </button>
                    </div>

                    {/* Documents */}
                    <div className="dark-card" style={{ borderRadius: '1.25rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>folder</span>
                            <h3 style={{ fontWeight: 800 }}>Dokumen</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                            {[
                                { label: 'KTP / NIK', status: 'done' },
                                { label: 'Paspor', status: 'done' },
                                { label: 'Vaksin Meningitis', status: 'required' },
                                { label: 'Foto 4x6 Background Putih', status: 'locked' },
                            ].map(doc => (
                                <div key={doc.label} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.875rem 1rem', borderRadius: '0.75rem',
                                    background: doc.status === 'required' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${doc.status === 'required' ? 'rgba(239,68,68,0.25)' : 'var(--color-border)'}`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: '18px', fontVariationSettings: "'FILL' 1",
                                            color: doc.status === 'done' ? 'var(--color-success)' : doc.status === 'required' ? 'var(--color-error)' : 'var(--color-text-muted)'
                                        }}>
                                            {doc.status === 'done' ? 'check_circle' : doc.status === 'locked' ? 'lock' : 'error'}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{doc.label}</span>
                                    </div>
                                    {doc.status === 'done' ? (
                                        <button style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>Lihat</button>
                                    ) : doc.status === 'required' ? (
                                        <button style={{ fontSize: '0.6875rem', fontWeight: 800, padding: '0.375rem 0.75rem', borderRadius: '0.375rem', background: '#dc2626', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Upload
                                        </button>
                                    ) : (
                                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Terkunci</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>info</span>
                            Dokumen final wajib dilengkapi sebelum Nov 1, 2025
                        </p>
                    </div>
                </div>

                {/* ===== INVOICES ===== */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1rem' }}>Rencana Pembayaran</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {booking.invoices?.map((inv: any) => (
                            <div key={inv.id}>
                                {inv.status !== 'paid' ? (
                                    <PaymentGateway invoiceId={inv.id} amount={inv.amount} bookingCode={inv.invoiceCode} />
                                ) : (
                                    <div className="dark-card" style={{
                                        borderRadius: '1.25rem', padding: '1.5rem',
                                        border: '1px solid rgba(34,197,94,0.25)', background: 'rgba(34,197,94,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '0.875rem', background: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'white', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 900, fontSize: '1rem' }}>Tagihan Terbayar</p>
                                                <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>{inv.invoiceCode}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--color-primary)' }}>
                                                Rp {inv.amount?.toLocaleString('id-ID')}
                                            </p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>
                                                Lunas {new Date(inv.paidAt).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ===== CTA HELP ===== */}
                <div className="dark-card" style={{ borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '9999px', background: 'var(--color-primary-bg)', border: '1px solid var(--color-border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--color-primary)' }}>headset_mic</span>
                        </div>
                        <div>
                            <p style={{ fontWeight: 700 }}>Butuh bantuan dengan perjalanan Anda?</p>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Agen kami siap 24/7 memandu ibadah Anda.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <a href="https://wa.me/" style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700,
                            fontSize: '0.875rem', background: '#25D366', color: 'white', textDecoration: 'none'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span> WhatsApp
                        </a>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.625rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700,
                            fontSize: '0.875rem', border: '1px solid var(--color-border-gold)', color: 'var(--color-primary)'
                        }}>
                            Help Center
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
