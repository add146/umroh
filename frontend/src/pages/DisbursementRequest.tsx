import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../lib/api';

const disbursementSchema = z.object({
    amount: z.number().min(10000, "Minimal pencairan Rp 10.000"),
    bankName: z.string().min(2, "Nama bank wajib diisi"),
    accountNumber: z.string().min(5, "Nomor rekening wajib diisi"),
    accountHolder: z.string().min(3, "Nama pemilik rekening wajib diisi"),
});

type DisbursementData = z.infer<typeof disbursementSchema>;

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--color-border)', borderRadius: '0.5rem', color: 'var(--color-text)',
    outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s ease',
};

export default function DisbursementRequest() {
    const [stats, setStats] = useState({ availableBalance: 0, pendingRequests: 0, paidRequests: 0 });
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<DisbursementData>({
        resolver: zodResolver(disbursementSchema)
    });

    const watchAmount = watch('amount');

    const fetchData = async () => {
        setLoading(true);
        try {
            const dashRes = await apiFetch('/api/affiliate/dashboard');
            const dashData = await dashRes.json();
            const totalEarned = dashData.stats.totalCommissionPaid || 0;

            const reqsRes = await apiFetch('/api/affiliate/disbursement-requests');
            const reqsData = await reqsRes.json();
            setRequests(reqsData);

            let pending = 0;
            let paid = 0;
            let usedBalance = 0;

            reqsData.forEach((r: any) => {
                if (r.status === 'pending') pending += r.amount;
                if (r.status === 'paid') paid += r.amount;
                if (r.status !== 'rejected') usedBalance += r.amount;
            });

            setStats({
                availableBalance: Math.max(0, totalEarned - usedBalance),
                pendingRequests: pending,
                paidRequests: paid
            });
        } catch (e) {
            console.error('Failed to fetch data', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onSubmit = async (data: DisbursementData) => {
        if (data.amount > stats.availableBalance) {
            alert('Saldo tidak mencukupi');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiFetch('/api/affiliate/request-disbursement', {
                method: 'POST',
                body: JSON.stringify(data)
            });

            if (res.ok) {
                alert('Request pencairan berhasil diajukan');
                reset();
                fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Terjadi kesalahan');
            }
        } catch (e) {
            console.error(e);
            alert('Gagal mengajukan pencairan');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
        pending: { label: 'Pending', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', border: 'var(--color-border-gold)', icon: 'schedule' },
        approved: { label: 'Disetujui', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', icon: 'verified' },
        paid: { label: 'Berhasil', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)', icon: 'check_circle' },
        rejected: { label: 'Ditolak', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', icon: 'cancel' },
    };

    if (loading && requests.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', gap: '0.75rem' }}>
                <div style={{
                    width: '20px', height: '20px', border: '2px solid var(--color-primary)',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Memuat data...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* ===== HEADER HERO ===== */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(200,168,81,0.12) 0%, rgba(200,168,81,0.03) 100%)',
                border: '1px solid var(--color-border-gold)',
                borderRadius: '1rem', padding: '2rem',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-50px', right: '-30px', width: '180px', height: '180px',
                    background: 'radial-gradient(circle, rgba(200,168,81,0.15) 0%, transparent 70%)',
                    borderRadius: '100%', pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', position: 'relative', zIndex: 1 }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: '32px', color: 'var(--color-primary)',
                        fontVariationSettings: "'FILL' 1",
                        filter: 'drop-shadow(0 0 10px rgba(200,168,81,0.4))',
                    }}>account_balance_wallet</span>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em', margin: 0 }}>
                        Pencairan <span style={{ color: 'var(--color-primary)' }}>Komisi</span>
                    </h1>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0, position: 'relative', zIndex: 1 }}>
                    Ajukan pencairan saldo komisi Anda ke rekening bank.
                </p>
            </div>

            {/* ===== STAT CARDS ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {[
                    { label: 'Saldo Tersedia', value: formatCurrency(stats.availableBalance), icon: 'account_balance_wallet', color: 'var(--color-primary)', glow: true },
                    { label: 'Dalam Proses', value: formatCurrency(stats.pendingRequests), icon: 'pending_actions', color: '#f59e0b', glow: false },
                    { label: 'Total Dicairkan', value: formatCurrency(stats.paidRequests), icon: 'task_alt', color: '#22c55e', glow: false },
                ].map((stat, i) => (
                    <div key={i} style={{
                        background: stat.glow
                            ? 'linear-gradient(135deg, rgba(200,168,81,0.08) 0%, var(--color-bg-card) 100%)'
                            : 'var(--color-bg-card)',
                        border: `1px solid ${stat.glow ? 'var(--color-border-gold)' : 'var(--color-border)'}`,
                        borderRadius: '1rem', padding: '1.5rem', position: 'relative', overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-border-gold)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = stat.glow ? 'var(--color-border-gold)' : 'var(--color-border)')}>
                        {/* Background icon */}
                        <span className="material-symbols-outlined" style={{
                            position: 'absolute', top: '-10px', right: '-10px', fontSize: '80px',
                            color: stat.color, opacity: 0.06, fontVariationSettings: "'FILL' 1",
                            pointerEvents: 'none',
                        }}>{stat.icon}</span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span className="material-symbols-outlined" style={{
                                fontSize: '18px', color: stat.color, fontVariationSettings: "'FILL' 1",
                            }}>{stat.icon}</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</span>
                        </div>
                        <p style={{
                            fontSize: '1.5rem', fontWeight: 800, color: stat.color, margin: 0,
                            letterSpacing: '-0.02em', position: 'relative', zIndex: 1,
                            filter: stat.glow ? 'drop-shadow(0 0 8px rgba(200,168,81,0.3))' : undefined,
                        }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* ===== FORM + HISTORY ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'start' }}>
                {/* Form Card */}
                <div className="dark-card" style={{ overflow: 'hidden' }}>
                    <div style={{
                        padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>payments</span>
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Form Pencairan</h2>
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                            {/* Amount */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Nominal Pencairan
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '0.75rem', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                                        <span style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.875rem' }}>Rp</span>
                                    </div>
                                    <input type="number" {...register('amount', { valueAsNumber: true })}
                                        placeholder="100000"
                                        style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                </div>
                                {errors.amount && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.amount.message}</p>}

                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {[{ label: '50%', mult: 0.5 }, { label: 'Tarik Semua', mult: 1 }].map(btn => (
                                        <button key={btn.label} type="button"
                                            onClick={() => setValue('amount', Math.floor(stats.availableBalance * btn.mult))}
                                            style={{
                                                padding: '0.25rem 0.625rem', fontSize: '0.7rem', fontWeight: 600,
                                                background: 'var(--color-bg-card)', border: '1px solid var(--color-border)',
                                                borderRadius: '0.375rem', color: 'var(--color-text-muted)',
                                                cursor: 'pointer', transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bank Name */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nama Bank</label>
                                <input type="text" {...register('bankName')} placeholder="BCA, Mandiri, BSI, dll" style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                {errors.bankName && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.bankName.message}</p>}
                            </div>

                            {/* Account Number */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nomor Rekening</label>
                                <input type="text" {...register('accountNumber')} placeholder="0123456789" style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                {errors.accountNumber && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.accountNumber.message}</p>}
                            </div>

                            {/* Account Holder */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nama Pemilik Rekening</label>
                                <input type="text" {...register('accountHolder')} placeholder="Sesuai buku tabungan" style={inputStyle}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--color-border)')} />
                                {errors.accountHolder && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.25rem' }}>{errors.accountHolder.message}</p>}
                            </div>

                            {/* Submit */}
                            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <button type="submit"
                                    disabled={submitting || stats.availableBalance === 0 || (watchAmount || 0) > stats.availableBalance}
                                    className="btn btn-primary"
                                    style={{
                                        width: '100%', justifyContent: 'center', padding: '0.75rem',
                                        boxShadow: 'var(--shadow-gold)',
                                        opacity: (submitting || stats.availableBalance === 0 || (watchAmount || 0) > stats.availableBalance) ? 0.5 : 1,
                                        cursor: (submitting || stats.availableBalance === 0 || (watchAmount || 0) > stats.availableBalance) ? 'not-allowed' : 'pointer',
                                    }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
                                    {submitting ? 'Memproses...' : 'Ajukan Pencairan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* History Table */}
                <div className="dark-card" style={{ overflow: 'hidden' }}>
                    <div style={{
                        padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <h2 style={{
                            fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', margin: 0,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>history</span>
                            Riwayat Pencairan
                        </h2>
                        <button onClick={fetchData} title="Refresh" style={{
                            width: '32px', height: '32px', borderRadius: '0.375rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--color-text-muted)', transition: 'all 0.15s ease',
                            background: 'transparent',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>refresh</span>
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '0.875rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    {['Tanggal', 'Nominal', 'Rekening Tujuan', 'Status'].map(h => (
                                        <th key={h} style={{
                                            padding: '0.875rem 1.25rem', fontSize: '0.7rem', fontWeight: 600,
                                            color: 'var(--color-text-muted)', textTransform: 'uppercase',
                                            letterSpacing: '0.08em', whiteSpace: 'nowrap',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-text-light)', fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                                                <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, margin: 0 }}>Belum ada riwayat pencairan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req) => {
                                        const cfg = statusConfig[req.status] || statusConfig.pending;
                                        return (
                                            <tr key={req.id}
                                                style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s ease' }}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-hover)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td style={{ padding: '0.875rem 1.25rem', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                    {new Date(req.requestedAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                                                    {formatCurrency(req.amount)}
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.85rem' }}>{req.bankName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.125rem' }}>{req.accountNumber} — {req.accountHolder}</div>
                                                </td>
                                                <td style={{ padding: '0.875rem 1.25rem' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                                                        padding: '0.3rem 0.75rem', borderRadius: '9999px',
                                                        fontSize: '0.7rem', fontWeight: 700,
                                                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                                                    }}
                                                        title={req.status === 'rejected' ? req.adminNotes : undefined}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Responsive override for mobile */}
            <style>{`
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: 1fr 2fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
