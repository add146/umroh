import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

const thStyle: React.CSSProperties = {
    padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-muted)', fontSize: '0.875rem',
};
const tdStyle: React.CSSProperties = { padding: '1rem 1.5rem' };

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    useEffect(() => { fetchInvoices(); }, []);

    const fetchInvoices = async () => {
        try {
            const data = await apiFetch<any[]>('/api/payments/invoices');
            setInvoices(data);
        } catch (error) { toast.error('Gagal mengambil data tagihan'); }
        finally { setLoading(false); }
    };

    const handleVerify = async (id: string, status: 'paid' | 'cancelled') => {
        try {
            await apiFetch(`/api/payments/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ status }) });
            toast.success(`Tagihan berhasil di-${status === 'paid' ? 'Setujui' : 'Batalkan'}`);
            fetchInvoices();
        } catch (error) { toast.error('Gagal memverifikasi tagihan'); }
    };

    const getStatusStyle = (status: string): React.CSSProperties => {
        const base: React.CSSProperties = { padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', display: 'inline-block' };
        if (status === 'paid') return { ...base, background: 'rgba(34,197,94,0.1)', color: '#22c55e' };
        if (status === 'cancelled') return { ...base, background: 'rgba(239,68,68,0.1)', color: '#ef4444' };
        return { ...base, background: 'rgba(234,179,8,0.1)', color: '#eab308' };
    };

    const pendingCount = invoices.filter(i => i.status === 'pending').length;

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Verifikasi Pembayaran</h1>
                    {pendingCount > 0 && <span style={{ fontSize: '0.75rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700 }}>{pendingCount} Menunggu</span>}
                </div>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Monitoring arus pembayaran jamaah dan verifikasi bukti transfer.</p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', maxWidth: '400px' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#888' }}>search</span>
                    <input style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' }} placeholder="Cari Kode Invoice / Nama..." />
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={thStyle}>Data Invoice</th>
                            <th style={thStyle}>Identitas Jamaah</th>
                            <th style={thStyle}>Nominal & Mode</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Manajemen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Data invoice tidak ditemukan.</td></tr>
                        ) : invoices.map(inv => (
                            <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <td style={tdStyle}>
                                    <p style={{ fontFamily: 'monospace', fontWeight: 800, color: 'white', margin: '0 0 0.125rem 0', fontSize: '0.8125rem' }}>{inv.invoiceCode}</p>
                                    <p style={{ fontSize: '0.6875rem', color: '#888', margin: 0 }}>Dibuat: {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: 'var(--color-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.875rem' }}>
                                            {inv.booking?.pilgrim?.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0' }}>{inv.booking?.pilgrim?.name || 'N/A'}</p>
                                            <p style={{ fontSize: '0.6875rem', color: '#888', margin: 0 }}>{inv.booking?.pilgrim?.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={tdStyle}>
                                    <p style={{ fontWeight: 800, color: 'var(--color-primary)', margin: '0 0 0.125rem 0' }}>Rp{inv.amount.toLocaleString('id-ID')}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#888' }}>{inv.paymentMode === 'auto' ? 'credit_card' : 'account_balance'}</span>
                                        <span style={{ fontSize: '0.6875rem', color: '#888' }}>{inv.paymentMode === 'auto' ? 'Midtrans' : 'Manual Transfer'}</span>
                                    </div>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                    <span style={getStatusStyle(inv.status)}>{inv.status}</span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                                        {inv.transferProofKey && (
                                            <button onClick={() => setSelectedProof(inv.transferProofKey)} style={{ padding: '0.5rem', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Lihat Bukti">
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>visibility</span>
                                            </button>
                                        )}
                                        {inv.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleVerify(inv.id, 'paid')} style={{ padding: '0.5rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Setujui">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>check</span>
                                                </button>
                                                <button onClick={() => handleVerify(inv.id, 'cancelled')} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Tolak">
                                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>close</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 60 }}>
                    <div style={{ maxWidth: '56rem', width: '100%', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'white' }}>receipt_long</span>
                                <h3 style={{ margin: 0, fontWeight: 700, color: 'white' }}>Dokumen Bukti Transfer</h3>
                            </div>
                            <button onClick={() => setSelectedProof(null)} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', display: 'block' }}>close</span>
                            </button>
                        </div>
                        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', maxHeight: '70vh', overflow: 'auto', background: '#0a0907' }}>
                            <img src={`${import.meta.env.VITE_API_URL}/api/payments/proof/${selectedProof.replace('proofs/', '')}`} alt="Bukti Transfer" style={{ maxWidth: '100%', height: 'auto', borderRadius: '1rem' }} />
                        </div>
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setSelectedProof(null)} style={{ padding: '0.625rem 1.5rem', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Tutup Preview</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
