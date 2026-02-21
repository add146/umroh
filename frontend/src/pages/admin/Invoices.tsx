import { useState, useEffect } from 'react';
import { Check, X, Eye, Loader2, CreditCard, Landmark, Filter, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProof, setSelectedProof] = useState<string | null>(null);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const data = await apiFetch<any[]>('/api/payments/invoices');
            setInvoices(data);
        } catch (error) {
            toast.error('Gagal mengambil data tagihan');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySpace = async (id: string, status: 'paid' | 'cancelled') => {
        try {
            await apiFetch(`/api/payments/${id}/verify`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            toast.success(`Tagihan berhasil di-${status === 'paid' ? 'Setujui' : 'Batalkan'}`);
            fetchInvoices();
        } catch (error) {
            toast.error('Gagal memverifikasi tagihan');
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-border)] pb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        Verifikasi Pembayaran
                        <span className="text-xs bg-[var(--color-primary-bg)] text-primary px-3 py-1 rounded-full">{invoices.filter(i => i.status === 'pending').length} Menunggu</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Monitoring arus pembayaran jamaah dan verifikasi bukti transfer.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                        <input className="w-full pl-11 pr-4 py-3 bg-[#131210] text-white border-none rounded-xl text-sm focus:ring-4 focus:ring-primary/20 transition-all outline-none font-bold" placeholder="Cari Kode Invoice / Nama..." />
                    </div>
                    <button className="p-3 bg-[#131210] text-white rounded-xl hover:bg-white/10 transition-all">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="dark-card rounded-[32px] border border-[var(--color-border)] shadow-2xl shadow-gray-200/50 overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210]/50 divide-x divide-white/10">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Data Invoice</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Identitas Jamaah</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Nominal & Mode</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-right">Manajemen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-24 text-center">
                                    <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-300">Mensinkronisasi Data...</p>
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-24 text-center">
                                    <div className="bg-[#131210] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="text-gray-200 w-10 h-10" />
                                    </div>
                                    <p className="text-gray-400 font-bold italic tracking-tight">Tidak ada histori tagihan yang tersedia.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-primary/[0.01] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="font-mono text-sm font-black text-white tracking-tighter">{inv.invoiceCode}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                Dibuat: {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary font-black text-sm">
                                                {inv.booking?.pilgrim?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-white tracking-tight">{inv.booking?.pilgrim?.name || 'N/A'}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.booking?.pilgrim?.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-primary tracking-tight">
                                                <span className="text-xs mr-0.5 text-secondary">Rp</span>
                                                {inv.amount.toLocaleString('id-ID')}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                {inv.paymentMode === 'auto' ? (
                                                    <CreditCard className="w-3 h-3 text-secondary" />
                                                ) : (
                                                    <Landmark className="w-3 h-3 text-secondary" />
                                                )}
                                                <span className="text-[9px] font-black uppercase text-secondary tracking-widest">
                                                    {inv.paymentMode === 'auto' ? 'Midtrans' : 'Manual Transfer'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.15em] ${inv.status === 'paid' ? 'bg-[#22c55e]/10 text-success' :
                                            inv.status === 'pending' ? 'bg-amber-500/10 text-amber-500 animate-pulse' :
                                                inv.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-white/10 text-gray-400'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'paid' ? 'bg-success' :
                                                inv.status === 'pending' ? 'bg-amber-600' : 'bg-current'
                                                }`}></div>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {inv.transferProofKey && (
                                                <button
                                                    onClick={() => setSelectedProof(inv.transferProofKey)}
                                                    className="p-3 dark-card border border-[var(--color-border)] shadow-sm text-secondary rounded-xl hover:shadow-md hover:border-secondary transition-all"
                                                    title="Lihat Bukti Transfer"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            )}
                                            {inv.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleVerifySpace(inv.id, 'paid')}
                                                        className="p-3 bg-success text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                                                        title="Setujui Pembayaran"
                                                    >
                                                        <Check className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifySpace(inv.id, 'cancelled')}
                                                        className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                        title="Tolak Pembayaran"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedProof && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="max-w-4xl w-full dark-card rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-primary px-10 py-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 dark-card/10 rounded-xl text-secondary">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Dokumen Bukti Transfer</h3>
                            </div>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-3 dark-card/10 text-white rounded-2xl hover:dark-card/20 transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10 bg-[#131210] flex justify-center max-h-[70vh] overflow-auto">
                            <img
                                src={`${import.meta.env.VITE_API_URL}/api/payments/proof/${selectedProof.replace('proofs/', '')}`}
                                alt="Bukti Transfer"
                                className="w-auto h-auto rounded-3xl shadow-2xl border-8 border-white"
                            />
                        </div>
                        <div className="p-8 dark-card border-t border-[var(--color-border)] flex justify-end gap-4">
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="px-8 py-3 bg-white/5 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-white/10 hover:text-white transition-all"
                            >
                                Tutup Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
