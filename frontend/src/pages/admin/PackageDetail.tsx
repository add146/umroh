import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, MapPin, Users, BedDouble, X, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

export default function PackageDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [activeDepartureId, setActiveDepartureId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Forms state
    const [departureForm, setDepartureForm] = useState({ date: '', airport: '', seats: 45 });
    const [roomForm, setRoomForm] = useState({ name: '', capacity: 4, priceAdjustment: 0 });

    const fetchPackageDetail = async () => {
        try {
            const data = await apiFetch<{ package: any }>(`/api/packages/${id}`);
            if (data.package) {
                setPkg(data.package);
            } else {
                navigate('/admin/packages');
                toast.error('Paket tidak ditemukan');
            }
        } catch (error) {
            toast.error('Gagal memuat detail paket');
            navigate('/admin/packages');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchPackageDetail();
    }, [id]);

    const handleCreateDeparture = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await apiFetch('/api/departures', {
                method: 'POST',
                body: JSON.stringify({
                    packageId: id,
                    departureDate: departureForm.date,
                    airport: departureForm.airport,
                    totalSeats: departureForm.seats
                })
            });
            toast.success('Jadwal keberangkatan ditambahkan');
            setIsDepartureModalOpen(false);
            setDepartureForm({ date: '', airport: '', seats: 45 });
            fetchPackageDetail();
        } catch (error) {
            toast.error('Gagal menambah jadwal keberangkatan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeDepartureId) return;

        setIsSubmitting(true);
        try {
            await apiFetch(`/api/departures/${activeDepartureId}/rooms`, {
                method: 'POST',
                body: JSON.stringify([
                    {
                        name: roomForm.name,
                        capacity: roomForm.capacity,
                        priceAdjustment: roomForm.priceAdjustment
                    }
                ])
            });
            toast.success('Tipe kamar berhasil ditambahkan');
            setIsRoomModalOpen(false);
            setRoomForm({ name: '', capacity: 4, priceAdjustment: 0 });
            fetchPackageDetail();
        } catch (error) {
            toast.error('Gagal menambahkan tipe kamar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDeparture = async (id: string) => {
        if (!confirm('Hapus jadwal keberangkatan ini? Seluruh data tipe kamar juga akan terhapus.')) return;
        try {
            await apiFetch(`/api/departures/${id}`, { method: 'DELETE' });
            toast.success('Jadwal keberangkatan dihapus');
            fetchPackageDetail();
        } catch (error) {
            toast.error('Gagal menghapus jadwal keberangkatan. Pastikan tidak ada jamaah yang terdaftar.');
        }
    };

    const handleDeleteRoom = async (id: string) => {
        if (!confirm('Hapus pilihan tipe kamar ini?')) return;
        try {
            await apiFetch(`/api/departures/rooms/${id}`, { method: 'DELETE' });
            toast.success('Tipe kamar dihapus');
            fetchPackageDetail();
        } catch (error) {
            toast.error('Gagal menghapus tipe kamar.');
        }
    };

    const openRoomModal = (departureId: string) => {
        setActiveDepartureId(departureId);
        setRoomForm({ name: '', capacity: 4, priceAdjustment: 0 });
        setIsRoomModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!pkg) return null;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-border)] pb-8 pt-4">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin/packages')}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Paket
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tight">{pkg.name}</h1>
                            <span className="px-3 py-1 bg-white/5 text-gray-400 font-mono text-xs rounded-lg">
                                {pkg.id.split('-')[0]}
                            </span>
                        </div>
                        <p className="text-lg text-primary font-black mt-2 tracking-tight">
                            Base: Rp{pkg.basePrice.toLocaleString('id-ID')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsDepartureModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-[#0a0907] rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Keberangkatan
                </button>
            </div>

            {/* Package Details (Master Data Recap) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)]">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Informasi Paket</h3>
                        <p className="text-sm text-gray-400 mb-4">{pkg.description}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Tipe Paket</span>
                                <span className="font-bold text-white">{pkg.packageType || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Promo</span>
                                <span className="font-bold text-white">{pkg.isPromo ? 'Ya (Potongan Aktif)' : 'Tidak'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)]">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Akomodasi Hotel</h3>
                        <div className="space-y-4">
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Makkah</span>
                                <p className="font-bold text-white">{pkg.makkahHotel?.name || 'Belum diset'}</p>
                                {pkg.makkahHotel && <p className="text-xs text-gray-400 mt-1">Bintang {pkg.makkahHotel.starRating} • Jarak {pkg.makkahHotel.distance}m</p>}
                            </div>
                            <div>
                                <span className="block text-xs uppercase tracking-widest text-gray-500 mb-1">Madinah</span>
                                <p className="font-bold text-white">{pkg.madinahHotel?.name || 'Belum diset'}</p>
                                {pkg.madinahHotel && <p className="text-xs text-gray-400 mt-1">Bintang {pkg.madinahHotel.starRating} • Jarak {pkg.madinahHotel.distance}m</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)]">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Fasilitas Termasuk</h3>
                        <div className="flex flex-wrap gap-2">
                            {(() => {
                                try {
                                    const facs = JSON.parse(pkg.facilities || '[]');
                                    if (facs.length === 0) return <span className="text-gray-500 italic text-sm">Belum ada data fasilitas</span>;
                                    return facs.map((fac: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 text-sm">
                                            <span className="material-symbols-outlined text-[16px] text-primary">{fac.icon || 'check_circle'}</span>
                                            <span className="text-gray-300">{fac.name}</span>
                                        </div>
                                    ));
                                } catch (e) {
                                    return <span className="text-red-400 text-sm">Format fasilitas error</span>;
                                }
                            })()}
                        </div>
                    </div>

                    <div className="dark-card p-6 rounded-2xl border border-[var(--color-border)]">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Itinerary (Singkat)</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {(() => {
                                try {
                                    const itins = JSON.parse(pkg.itinerary || '[]');
                                    if (itins.length === 0) return <span className="text-gray-500 italic text-sm">Belum ada data itinerary</span>;
                                    return itins.map((it: any, idx: number) => (
                                        <div key={idx} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold leading-none shrink-0 border border-primary/30">
                                                    {it.day}
                                                </div>
                                                {idx < itins.length - 1 && <div className="w-px h-full bg-white/10 my-1"></div>}
                                            </div>
                                            <div className="pb-3">
                                                <p className="font-bold text-white text-sm leading-tight">{it.title || 'Agenda Baru'}</p>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{it.desc}</p>
                                            </div>
                                        </div>
                                    ));
                                } catch (e) {
                                    return <span className="text-red-400 text-sm">Format itinerary error</span>;
                                }
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Departures List */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-white tracking-tight">Jadwal Keberangkatan & Opsi Kamar</h2>

                {pkg.departures?.length === 0 ? (
                    <div className="dark-card border border-[var(--color-border)] rounded-[32px] p-16 text-center">
                        <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white tracking-tight">Belum Ada Keberangkatan</h3>
                        <p className="text-gray-500 mt-2">Tambahkan jadwal keberangkatan untuk paket umroh ini.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {pkg.departures.map((dep: any) => (
                            <div key={dep.id} className="dark-card border border-[var(--color-border)] rounded-[32px] overflow-hidden shadow-2xl">
                                {/* Departure Header */}
                                <div className="bg-[#131210]/50 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full md:w-auto">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Tanggal</p>
                                            <p className="text-lg font-bold text-white">
                                                {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Bandara</p>
                                            <p className="text-lg font-bold text-white">{dep.airport}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-1.5"><Users className="w-3 h-3" /> Kuota</p>
                                            <p className="text-lg font-bold text-white">{dep.bookedSeats} <span className="text-gray-500 text-sm">/ {dep.totalSeats} Pax</span></p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Status</p>
                                            <span className="inline-block px-3 py-1 bg-green-500/10 text-green-500 rounded-full font-black text-[10px] uppercase tracking-widest">
                                                {dep.status === 'available' ? 'Tersedia' : dep.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                                        <button
                                            onClick={() => handleDeleteDeparture(dep.id)}
                                            className="px-4 py-3 border border-red-900/50 text-red-400 rounded-xl hover:bg-red-950/50 hover:text-red-300 transition-all flex items-center justify-center"
                                            title="Hapus Keberangkatan"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openRoomModal(dep.id)}
                                            className="flex-1 md:w-auto px-6 py-3 bg-white/5 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
                                        >
                                            <BedDouble className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                            <span>+ Tipe Kamar</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Room Types List */}
                                <div className="p-6 md:p-8">
                                    {(!dep.roomTypes || dep.roomTypes.length === 0) ? (
                                        <p className="text-center text-sm font-bold text-gray-500 italic py-4">
                                            Belum ada opsi kamar disetup untuk keberangkatan ini. Form pendaftaran jamaah mungkin tidak bisa dilanjutkan jika kamar kosong.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {dep.roomTypes.map((room: any) => (
                                                <div key={room.id} className="p-5 rounded-2xl border border-white/10 bg-[#131210] hover:border-primary/50 transition-colors group">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-bold text-white text-lg tracking-tight">{room.name}</h4>
                                                        <div className="flex gap-2">
                                                            <span className="px-2.5 py-1 bg-white/5 rounded-md text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
                                                                {room.capacity} Orang
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteRoom(room.id)}
                                                                className="p-1.5 rounded-md text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                                                title="Hapus Tipe Kamar"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end justify-between mt-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Harga Pax</p>
                                                            <p className="text-xl font-black text-primary tracking-tight">
                                                                <span className="text-sm mr-1">Rp</span>
                                                                {(pkg.basePrice + room.priceAdjustment).toLocaleString('id-ID')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            {room.priceAdjustment > 0 && (
                                                                <span className="text-xs font-bold text-red-400 block">+Rp{room.priceAdjustment.toLocaleString('id-ID')}</span>
                                                            )}
                                                            {room.priceAdjustment < 0 && (
                                                                <span className="text-xs font-bold text-green-400 block">-Rp{Math.abs(room.priceAdjustment).toLocaleString('id-ID')}</span>
                                                            )}
                                                            {room.priceAdjustment === 0 && (
                                                                <span className="text-xs font-bold text-gray-500 block">Base Price</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Moderate & Modal logic */}
            {isDepartureModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="max-w-md w-full dark-card rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--color-border)]">
                        <div className="bg-[#131210] px-8 py-6 flex items-center justify-between border-b border-[var(--color-border)]">
                            <h3 className="text-xl font-bold text-white tracking-wider">Tambah Keberangkatan</h3>
                            <button onClick={() => setIsDepartureModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDeparture} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Tanggal Keberangkatan</label>
                                    <input
                                        type="date"
                                        required
                                        value={departureForm.date}
                                        onChange={(e) => setDepartureForm({ ...departureForm, date: e.target.value })}
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2 ml-1">Bulan dan tahun yang terlihat di form client.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Additional label inputs */}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Bandara (Kode / Nama)</label>
                                    <input
                                        type="text"
                                        required
                                        value={departureForm.airport}
                                        onChange={(e) => setDepartureForm({ ...departureForm, airport: e.target.value })}
                                        placeholder="Misal: Juanda Int (SUB)"
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Kuota Seat Tersedia</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={departureForm.seats}
                                        onChange={(e) => setDepartureForm({ ...departureForm, seats: parseInt(e.target.value) || 0 })}
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-black text-lg"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsDepartureModalOpen(false)} className="flex-1 py-4 bg-white/5 text-gray-300 rounded-2xl font-bold hover:bg-white/10 transition-all font-black uppercase text-sm tracking-widest">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-[#0a0907] rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 uppercase text-sm tracking-widest">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isRoomModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="max-w-md w-full dark-card rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--color-border)]">
                        <div className="bg-[#131210] px-8 py-6 flex items-center justify-between border-b border-[var(--color-border)]">
                            <h3 className="text-xl font-bold text-white tracking-wider">Tambah Tipe Kamar</h3>
                            <button onClick={() => setIsRoomModalOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="p-8 space-y-6">
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl mb-6">
                                <p className="text-xs font-bold text-primary tracking-wide text-center">Harga Dasar Paket: Rp {(pkg?.basePrice || 0).toLocaleString('id-ID')}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Nama Kapasitas / Tipe Bed</label>
                                    <input
                                        type="text"
                                        required
                                        value={roomForm.name}
                                        onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                                        placeholder="Misal: Quad Bed (4 Orang)"
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Kapasitas (Orang)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={roomForm.capacity}
                                        onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 0 })}
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-black"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-2 ml-1">Kelipatan checkout (1 s/d {roomForm.capacity} pax per kamar).</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Penyesuaian Harga (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-4 text-gray-500 font-bold">± Rp</span>
                                        <input
                                            type="number"
                                            required
                                            value={roomForm.priceAdjustment === 0 ? '' : roomForm.priceAdjustment}
                                            onChange={(e) => setRoomForm({ ...roomForm, priceAdjustment: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-16 pr-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-black text-lg"
                                            placeholder="Contoh: 1500000"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 ml-1">Isi 0 jika sama dengan Base Price. Isi angka positif (+) jika lebih mahal, dan angka negatif (-) jika lebih murah.</p>

                                    {roomForm.priceAdjustment !== 0 && (
                                        <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center text-sm font-black">
                                            <span className="text-gray-400">Total Harga Jamaah:</span>
                                            <span className="text-white">Rp {((pkg?.basePrice || 0) + (roomForm.priceAdjustment || 0)).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="flex-1 py-4 bg-white/5 text-gray-300 rounded-2xl font-bold hover:bg-white/10 transition-all font-black uppercase text-sm tracking-widest">
                                    Batal
                                </button>
                                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-[#0a0907] rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 uppercase text-sm tracking-widest">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
