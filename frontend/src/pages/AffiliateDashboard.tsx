import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import { QRCodeModal } from '../components/QRCodeModal';
import { CommissionCalculator } from '../components/CommissionCalculator';
import { DigitalCard } from '../components/DigitalCard';

interface AffiliateStats {
    affiliateCode: string;
    role: string;
    stats: {
        totalReferrals: number;
        totalClicks: number;
        totalCommissionPending: number;
        totalCommissionPaid: number;
    };
}

interface CommissionEntry {
    id: string;
    amount: number;
    commissionType: string;
    status: 'pending' | 'paid';
    createdAt: string;
    paidAt: string | null;
    booking: {
        id: string;
        pilgrim: { name: string };
    };
}

interface ReferralBooking {
    id: string;
    bookedAt: string;
    totalPrice: number;
    paymentStatus: string;
    pilgrim: { name: string; phone: string };
    departure: {
        departureDate: string;
        package: { name: string };
    };
}

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const StatCard: React.FC<{ label: string; value: string | number; color?: string; sub?: string }> = ({ label, value, color = 'var(--color-primary)', sub }) => (
    <div style={{
        background: '#1a1917',
        border: '1px solid var(--color-border)',
        borderRadius: '1rem',
        padding: '1.5rem',
        flex: 1,
        minWidth: '200px'
    }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{value}</p>
        {sub && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>{sub}</p>}
    </div>
);

const AffiliateDashboard: React.FC = () => {
    const [stats, setStats] = useState<AffiliateStats | null>(null);
    const [history, setHistory] = useState<CommissionEntry[]>([]);
    const [referrals, setReferrals] = useState<ReferralBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'profil' | 'referrals' | 'commissions'>('profil');
    const [isQrOpen, setIsQrOpen] = useState(false);

    const frontendUrl = window.location.origin;

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [s, h, r] = await Promise.all([
                    apiClient.get('/affiliate/dashboard'),
                    apiClient.get('/affiliate/commission-history'),
                    apiClient.get('/affiliate/my-bookings'),
                ]);
                setStats(s);
                setHistory(Array.isArray(h) ? h : []);
                setReferrals(Array.isArray(r) ? r : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const affiliateLink = stats?.affiliateCode
        ? `${frontendUrl}/register?ref=${stats.affiliateCode}`
        : '';

    const handleCopy = () => {
        if (affiliateLink) {
            navigator.clipboard.writeText(affiliateLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const statusColor: Record<string, string> = {
        paid: '#16a34a',
        pending: '#d97706',
        unpaid: '#dc2626',
        cancelled: '#6b7280',
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <p style={{ color: 'var(--color-text-light)' }}>Memuat dashboard affiliasi…</p>
        </div>
    );

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--color-primary-bg)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '24px' }}>account_balance_wallet</span>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Dashboard Affiliasi</h1>
                    <p style={{ color: 'var(--color-text-light)', margin: 0, fontSize: '0.875rem' }}>Kelola referral dan pantau komisi Anda secara real-time</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                <StatCard label="Total Referral" value={stats?.stats.totalReferrals ?? 0} />
                <StatCard label="Total Klik Link" value={stats?.stats.totalClicks ?? 0} />
                <StatCard
                    label="Komisi Pending"
                    value={formatCurrency(stats?.stats.totalCommissionPending ?? 0)}
                    sub="Menunggu pencairan"
                />
                <StatCard
                    label="Komisi Dibayar"
                    value={formatCurrency(stats?.stats.totalCommissionPaid ?? 0)}
                    sub="Total komisi diterima"
                />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--color-border)', flexWrap: 'wrap' }}>
                {(['profil', 'referrals', 'commissions'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontWeight: activeTab === tab ? 700 : 400,
                            color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-light)',
                            borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                            marginBottom: '-2px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        {tab === 'profil' ? 'Profil & Alat Penjualan' : tab === 'referrals' ? `Daftar Referral (${referrals.length})` : `Riwayat Komisi (${history.length})`}
                    </button>
                ))}
            </div>

            {/* Profile & Tools Tab */}
            {activeTab === 'profil' && (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                    {/* Left Column: Digital Card & Calculator */}
                    <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <DigitalCard
                            name="User Affiliasi" // TODO: Add real name from API if available
                            role={stats?.role || 'Reseller'}
                            affiliateCode={stats?.affiliateCode || '-'}
                        />
                        <CommissionCalculator />
                    </div>

                    {/* Right Column: Links */}
                    <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Affiliate Link Card */}
                        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'text-bottom', marginRight: '4px' }}>link</span> Link Referral Anda
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    readOnly
                                    value={affiliateLink || 'Kode affiliasi belum tersedia'}
                                    style={{ flex: 1, background: 'var(--color-bg)', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--color-border)', color: 'var(--color-text)', minWidth: 0 }}
                                />
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        background: copied ? 'var(--color-primary)' : 'var(--color-primary-bg)',
                                        color: copied ? '#0a0907' : 'var(--color-primary)',
                                        padding: '0.875rem 1.5rem',
                                        borderRadius: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: copied ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{copied ? 'check' : 'content_copy'}</span> {copied ? 'Tersalin' : 'Salin'}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsQrOpen(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700 }}
                                    disabled={!affiliateLink}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code</span> QR Code
                                </button>
                            </div>
                            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Kode: <strong style={{ color: 'var(--color-primary)' }}>{stats?.affiliateCode || '-'}</strong> • Bagikan ke calon jamaah, komisi otomatis dihitung.
                            </p>
                        </div>

                        {/* Reseller Recruitment Link (Agen only) */}
                        {stats?.role === 'agen' && (
                            <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'text-bottom', marginRight: '4px' }}>handshake</span> Link Rekrut Reseller
                                </p>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={stats?.affiliateCode ? `${frontendUrl}/join/${stats.affiliateCode}` : 'Kode belum tersedia'}
                                        style={{ flex: 1, background: 'var(--color-bg)', borderRadius: '0.75rem', padding: '0.875rem 1rem', fontFamily: 'monospace', fontSize: '0.9rem', border: '1px solid var(--color-border)', color: 'var(--color-text)', minWidth: 0 }}
                                    />
                                    <button
                                        onClick={() => {
                                            if (stats?.affiliateCode) {
                                                navigator.clipboard.writeText(`${frontendUrl}/join/${stats.affiliateCode}`);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }
                                        }}
                                        style={{
                                            background: copied ? 'var(--color-primary)' : 'var(--color-primary-bg)',
                                            color: copied ? '#0a0907' : 'var(--color-primary)',
                                            padding: '0.875rem 1.5rem',
                                            borderRadius: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            border: copied ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{copied ? 'check' : 'content_copy'}</span> {copied ? 'Tersalin' : 'Salin'}
                                    </button>
                                </div>
                                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    Bagikan link ini ke siapa saja. Mereka bisa langsung mendaftar sebagai reseller di bawah Anda.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* Referrals Table */}
            {activeTab === 'referrals' && (
                <div style={{ background: '#1a1917', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    {referrals.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-border)' }}>groups</span>
                            <p>Belum ada jamaah yang mendaftar via link Anda</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['Jamaah', 'Paket', 'Tgl Keberangkatan', 'Total Harga', 'Status Bayar', 'Tgl Booking'].map(h => (
                                        <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {referrals.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.pilgrim?.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{b.pilgrim?.phone}</p>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{b.departure?.package?.name}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.875rem' }}>{b.departure?.departureDate}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(b.totalPrice)}</td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: statusColor[b.paymentStatus] + '20',
                                                color: statusColor[b.paymentStatus] || '#666'
                                            }}>
                                                {b.paymentStatus.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                            {new Date(b.bookedAt).toLocaleDateString('id-ID')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Commission History Table */}
            {activeTab === 'commissions' && (
                <div style={{ background: '#1a1917', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    {history.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--color-border)' }}>account_balance_wallet</span>
                            <p>Belum ada riwayat komisi</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['Jamaah', 'Jumlah Komisi', 'Tipe', 'Status', 'Tgl Komisi', 'Tgl Cair'].map(h => (
                                        <th key={h} style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-text-light)', fontWeight: 600 }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600, fontSize: '0.9rem' }}>{e.booking?.pilgrim?.name || '-'}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 700, fontSize: '1rem', color: '#16a34a' }}>{formatCurrency(e.amount)}</td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {e.commissionType === 'percentage' ? '%' : 'Flat'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                background: e.status === 'paid' ? '#dcfce7' : '#fef3c7',
                                                color: e.status === 'paid' ? '#16a34a' : '#d97706'
                                            }}>
                                                {e.status === 'paid' ? '✓ Dibayar' : '⏳ Pending'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                            {new Date(e.createdAt).toLocaleDateString('id-ID')}
                                        </td>
                                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                                            {e.paidAt ? new Date(e.paidAt).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <QRCodeModal
                isOpen={isQrOpen}
                onClose={() => setIsQrOpen(false)}
                affiliateLink={affiliateLink}
                affiliateCode={stats?.affiliateCode || ''}
            />
        </div>
    );
};

export default AffiliateDashboard;
