import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, CreditCard, Landmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

interface PaymentGatewayProps {
    invoiceId: string;
    amount: number;
    bookingCode: string;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ invoiceId, amount, bookingCode }) => {
    const [mode, setMode] = useState<'auto' | 'manual' | null>(null);
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [proofUploaded, setProofUploaded] = useState(false);

    useEffect(() => {
        fetchPaymentMode();
    }, []);

    const fetchPaymentMode = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/mode`);
            const data = await res.json();
            setMode(data.mode);
            setBanks(data.banks);
        } catch (error) {
            toast.error('Gagal mengambil metode pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const handleMidtransPay = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${invoiceId}/snap-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const { token } = await res.json();

            if (token && (window as any).snap) {
                (window as any).snap.pay(token, {
                    onSuccess: () => {
                        toast.success('Pembayaran Berhasil!');
                        window.location.reload();
                    },
                    onPending: () => {
                        toast.info('Menunggu Pembayaran');
                    },
                    onError: () => {
                        toast.error('Pembayaran Gagal');
                    }
                });
            }
        } catch (error) {
            toast.error('Gagal memproses pembayaran otomatis');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('proof', file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/${invoiceId}/upload-proof`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success('Bukti transfer berhasil diunggah!');
                setProofUploaded(true);
            } else {
                toast.error('Gagal mengunggah bukti');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan pengunggahan');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
    );

    return (
        <div className="group space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary/20">
                <div className="bg-primary px-8 py-5 flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                        <CreditCard className="w-5 h-5 text-secondary" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-wide uppercase">Metode Pembayaran</h2>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-gray-100 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Kode Invoice</p>
                            <p className="text-2xl font-black text-gray-900 font-mono tracking-tighter">{bookingCode}</p>
                        </div>
                        <div className="text-left md:text-right space-y-1">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Total Tagihan</p>
                            <p className="text-3xl font-black text-primary tracking-tight">
                                <span className="text-xl mr-1 text-secondary">Rp</span>
                                {amount.toLocaleString('id-ID')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Auto Payment Section */}
                        <div className={`relative group/opt p-6 rounded-2xl border-2 transition-all duration-300 ${mode === 'auto' ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-dashed border-gray-200 opacity-50 grayscale cursor-not-allowed'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl transition-colors duration-300 ${mode === 'auto' ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <h3 className="font-black uppercase text-xs tracking-widest text-gray-900">Pembayaran Otomatis</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                                Gunakan Virtual Account (BCA, Mandiri, BNI), GoPay, ShopeePay, atau Kartu Kredit. Terkonfirmasi otomatis dalam hitungan detik.
                            </p>
                            <button
                                onClick={handleMidtransPay}
                                disabled={mode !== 'auto'}
                                className="w-full bg-primary py-4 px-6 rounded-xl text-white font-black text-sm uppercase tracking-widest transition-all duration-300 hover:bg-primary-light hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none"
                            >
                                Bayar Instan (Snap)
                            </button>
                            {mode === 'auto' && (
                                <div className="absolute top-4 right-4 animate-pulse">
                                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                </div>
                            )}
                        </div>

                        {/* Manual Payment Section */}
                        <div className={`relative group/opt p-6 rounded-2xl border-2 transition-all duration-300 ${mode === 'manual' ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/5' : 'border-dashed border-gray-200 opacity-50 grayscale cursor-not-allowed'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-xl transition-colors duration-300 ${mode === 'manual' ? 'bg-secondary text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                    <Landmark className="w-5 h-5" />
                                </div>
                                <h3 className="font-black uppercase text-xs tracking-widest text-gray-900">Transfer Manual</h3>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">
                                Kirim langsung ke rekening Al Madinah. Diperlukan unggah bukti transfer dan verifikasi admin manual.
                            </p>

                            {mode === 'manual' && banks.length > 0 && (
                                <div className="space-y-3 mb-6 animate-in slide-in-from-top-2 duration-300">
                                    {banks.map(bank => (
                                        <div key={bank.id} className="bg-white p-4 rounded-xl border border-secondary/20 shadow-sm hover:border-secondary transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[10px] font-black uppercase text-secondary tracking-widest mb-1 block">{bank.bankName}</span>
                                            </div>
                                            <p className="text-lg font-black font-mono text-gray-900 tracking-wider mb-1">{bank.accountNumber}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">a/n {bank.accountHolder}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="relative">
                                <input
                                    type="file"
                                    id="proof-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*,.pdf"
                                    disabled={uploading || proofUploaded}
                                />
                                <label htmlFor="proof-upload" className={`block w-full ${uploading || proofUploaded ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <div className={`flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-300 border-2 ${proofUploaded ? 'bg-success/5 border-success text-success' :
                                            uploading ? 'bg-gray-100 border-gray-200 text-gray-400' :
                                                'bg-white border-secondary text-secondary hover:bg-secondary hover:text-white hover:shadow-xl hover:shadow-secondary/20'
                                        }`}>
                                        {uploading ? (
                                            <Loader2 className="animate-spin w-5 h-5" />
                                        ) : proofUploaded ? (
                                            <CheckCircle className="w-5 h-5" />
                                        ) : (
                                            <Upload className="w-5 h-5" />
                                        )}
                                        {proofUploaded ? "Menunggu Verifikasi" : "Unggah Bukti Transaksi"}
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
