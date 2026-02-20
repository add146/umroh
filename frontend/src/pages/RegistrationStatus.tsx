import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import PaymentGateway from '../components/payment/PaymentGateway';
import { Loader2, ClipboardCheck, User, Calendar, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

export default function RegistrationStatusPage() {
    const { id } = useParams<{ id: string }>();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, [id]);

    const fetchStatus = async () => {
        try {
            const data = await apiFetch<any>(`/api/bookings/${id}/status`);
            setBooking(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="mt-4 text-xs font-black uppercase tracking-[0.3em] text-gray-400">Memuat Data Keberangkatan...</p>
        </div>
    );

    if (!booking) return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Akses Ditolak</h2>
                    <p className="text-gray-500 font-medium">Data pendaftaran tidak ditemukan atau kadaluarsa.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFC] overflow-x-hidden selection:bg-secondary/30">
            {/* Top Navigation / Brand */}
            <div className="bg-white border-b border-gray-100/50 sticky top-0 z-50 backdrop-blur-md bg-white/80">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/20">A</div>
                        <h1 className="text-2xl font-black text-primary tracking-tighter italic">AL MADINAH</h1>
                    </div>
                    <div className="hidden md:flex items-center gap-6">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Customer Portal</span>
                        <div className="h-4 w-px bg-gray-200"></div>
                        <span className="text-sm font-bold text-primary">ID: {id?.substring(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar: Information */}
                    <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-left-8 duration-700">
                        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                                <User className="w-24 h-24" />
                            </div>

                            <h3 className="text-[10px] font-black uppercase text-secondary tracking-[0.3em] mb-8 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                Informasi Jamaah
                            </h3>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl text-primary">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Nama Lengkap</p>
                                        <p className="text-lg font-black text-gray-900 leading-none">{booking.pilgrim.name}</p>
                                        <p className="text-xs font-bold text-primary opacity-60 tracking-tight">{booking.pilgrim.phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl text-primary">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Paket & Keberangkatan</p>
                                        <p className="text-lg font-black text-gray-900 leading-tight">{booking.departure.package.name}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] bg-secondary/10 text-secondary px-3 py-1 rounded-full font-black uppercase tracking-widest">
                                                {new Date(booking.departure.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-gray-50 rounded-2xl text-primary">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Status Reservasi</p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${booking.bookingStatus === 'confirmed' ? 'bg-success text-white' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {booking.bookingStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Branding Card */}
                        <div className="bg-primary rounded-[32px] p-8 text-white relative overflow-hidden group shadow-2xl shadow-primary/30">
                            <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                                <ShieldCheck className="w-48 h-48" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-secondary">
                                <ShieldCheck className="w-4 h-4" /> Trusted Partner
                            </h4>
                            <p className="text-xl font-black leading-tight mb-4 tracking-tight">Kenyamanan & Keamanan Ibadah Anda Prioritas Kami.</p>
                            <p className="text-xs text-white/60 font-medium">Layanan bantuan 24/7 tersedia bagi seluruh jamaah Al Madinah.</p>
                        </div>
                    </div>

                    {/* Main Content: Payment Flow */}
                    <div className="lg:col-span-8 space-y-10 animate-in slide-in-from-right-8 duration-1000 delay-200">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] flex items-center gap-3">
                                <div className="h-px bg-gray-200 flex-1"></div>
                                Monitoring Rencana Pembayaran
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </h3>
                        </div>

                        {booking.invoices.map((inv: any, idx: number) => (
                            <div key={inv.id} className="relative">
                                {idx > 0 && <div className="absolute -top-10 left-10 w-px h-10 bg-dashed border-l border-gray-200"></div>}

                                {inv.status !== 'paid' ? (
                                    <div className="transform transition-all duration-500 hover:scale-[1.01]">
                                        <PaymentGateway
                                            invoiceId={inv.id}
                                            amount={inv.amount}
                                            bookingCode={inv.invoiceCode}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[32px] border-2 border-green-500/20 bg-gradient-to-br from-white to-green-50 shadow-xl p-8 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-150 transition-transform duration-[2000ms]">
                                            <ClipboardCheck className="w-32 h-32" />
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-success rounded-2xl flex items-center justify-center text-white shadow-xl shadow-success/30 transform transition-transform group-hover:rotate-12">
                                                    <ClipboardCheck className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3 transition-all">
                                                        <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase">Tagihan Terbayar</h4>
                                                        <span className="bg-success text-white text-[8px] px-3 py-1 rounded-full font-black tracking-widest uppercase">Verified</span>
                                                    </div>
                                                    <p className="text-[11px] font-bold text-success/70 font-mono tracking-widest">{inv.invoiceCode}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Lunas: {new Date(inv.paidAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Total Mutasi</p>
                                                <p className="text-3xl font-black text-primary tracking-tighter">
                                                    <span className="text-base mr-1 text-secondary">Rp</span>
                                                    {inv.amount.toLocaleString('id-ID')}
                                                </p>
                                                <div className="mt-3 inline-flex items-center gap-2 text-[10px] font-black text-success uppercase tracking-wider">
                                                    Transaksi Sukses <ArrowRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Extra trust footer */}
                        <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 flex flex-col md:flex-row items-center gap-8 justify-between opacity-80">
                            <div className="flex gap-4">
                                <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm"><ShieldCheck className="w-6 h-6 text-primary" /></div>
                                <div>
                                    <p className="text-xs font-black uppercase text-gray-900 tracking-widest">Enkripsi End-to-End</p>
                                    <p className="text-[10px] text-gray-500 font-medium">Seluruh transaksi Anda dilindungi sistem keamanan berstandar tinggi.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
