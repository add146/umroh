import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

const cardStyle: React.CSSProperties = { background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)', fontWeight: 600 };
const sectionTitle: React.CSSProperties = { fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' };

export default function PackageDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isDepartureModalOpen, setIsDepartureModalOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [activeDepartureId, setActiveDepartureId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departureForm, setDepartureForm] = useState({ date: '', airport: '', seats: 45 });
    const [roomForm, setRoomForm] = useState({ name: '', capacity: 4, priceAdjustment: 0 });
    const [masters, setMasters] = useState({ airports: [] as any[] });

    const fetchPackageDetail = async () => {
        try {
            const data = await apiFetch<{ package: any }>(`/api/packages/${id}`);
            if (data.package) { setPkg(data.package); } else { navigate('/admin/packages'); toast.error('Paket tidak ditemukan'); }
            const ap = await apiFetch<any>('/api/masters/airports');
            setMasters({ airports: ap.airports || [] });
        } catch (error) { toast.error('Gagal memuat detail paket'); navigate('/admin/packages'); }
        finally { setLoading(false); }
    };

    useEffect(() => { if (id) fetchPackageDetail(); }, [id]);

    const handleCreateDeparture = async (e: React.FormEvent) => {
        e.preventDefault(); setIsSubmitting(true);
        try {
            await apiFetch('/api/departures', { method: 'POST', body: JSON.stringify({ packageId: id, departureDate: departureForm.date, airport: departureForm.airport, totalSeats: departureForm.seats }) });
            toast.success('Jadwal keberangkatan ditambahkan'); setIsDepartureModalOpen(false); setDepartureForm({ date: '', airport: '', seats: 45 }); fetchPackageDetail();
        } catch (error) { toast.error('Gagal menambah jadwal keberangkatan'); } finally { setIsSubmitting(false); }
    };

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault(); if (!activeDepartureId) return; setIsSubmitting(true);
        try {
            await apiFetch(`/api/departures/${activeDepartureId}/rooms`, { method: 'POST', body: JSON.stringify([{ name: roomForm.name, capacity: roomForm.capacity, priceAdjustment: roomForm.priceAdjustment }]) });
            toast.success('Tipe kamar berhasil ditambahkan'); setIsRoomModalOpen(false); setRoomForm({ name: '', capacity: 4, priceAdjustment: 0 }); fetchPackageDetail();
        } catch (error) { toast.error('Gagal menambahkan tipe kamar'); } finally { setIsSubmitting(false); }
    };

    const handleDeleteDeparture = async (depId: string) => {
        if (!confirm('Hapus jadwal keberangkatan ini?')) return;
        try { await apiFetch(`/api/departures/${depId}`, { method: 'DELETE' }); toast.success('Jadwal dihapus'); fetchPackageDetail(); }
        catch (error) { toast.error('Gagal menghapus jadwal.'); }
    };

    const handleDeleteRoom = async (roomId: string) => {
        if (!confirm('Hapus pilihan tipe kamar ini?')) return;
        try { await apiFetch(`/api/departures/rooms/${roomId}`, { method: 'DELETE' }); toast.success('Tipe kamar dihapus'); fetchPackageDetail(); }
        catch (error) { toast.error('Gagal menghapus tipe kamar.'); }
    };

    const openRoomModal = (departureId: string) => { setActiveDepartureId(departureId); setRoomForm({ name: '', capacity: 4, priceAdjustment: 0 }); setIsRoomModalOpen(true); };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>Memuat detail paket...</div>;
    if (!pkg) return null;

    return (
        <div className="animate-in fade-in duration-700" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/packages')} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '1rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                    Kembali ke Daftar Paket
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', margin: 0 }}>{pkg.name}</h1>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{pkg.id.split('-')[0]}</span>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Base: Rp{pkg.basePrice.toLocaleString('id-ID')}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => navigate(`/admin/packages/${pkg.id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.75rem 1.25rem', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            Edit Paket
                        </button>
                        <button onClick={() => setIsDepartureModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.75rem 1.25rem', background: 'var(--color-primary)', color: 'white', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem', border: 'none' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                            Tambah Keberangkatan
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
                <div style={cardStyle}>
                    <h3 style={sectionTitle}><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>info</span> Informasi Paket</h3>
                    <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1rem' }}>{pkg.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>Tipe Paket</span>
                            <span style={{ fontWeight: 700, color: 'white' }}>{pkg.packageType || '-'}</span>
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>Promo</span>
                            <span style={{ fontWeight: 700, color: 'white' }}>{pkg.isPromo ? 'Ya (Potongan Aktif)' : 'Tidak'}</span>
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={sectionTitle}><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>hotel</span> Akomodasi Hotel</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>Makkah</span>
                            <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{pkg.makkahHotel?.name || 'Belum diset'}</p>
                            {pkg.makkahHotel && <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0 0 0' }}>Bintang {pkg.makkahHotel.starRating} • Jarak {pkg.makkahHotel.distance}m</p>}
                        </div>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>Madinah</span>
                            <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{pkg.madinahHotel?.name || 'Belum diset'}</p>
                            {pkg.madinahHotel && <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0 0 0' }}>Bintang {pkg.madinahHotel.starRating} • Jarak {pkg.madinahHotel.distance}m</p>}
                        </div>
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={sectionTitle}><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>check_circle</span> Fasilitas Termasuk</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {(() => {
                            try {
                                const facs = JSON.parse(pkg.facilities || '[]');
                                if (facs.length === 0) return <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.875rem' }}>Belum ada data fasilitas</span>;
                                return facs.map((fac: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.375rem', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.8125rem' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>{fac.icon || 'check_circle'}</span>
                                        <span style={{ color: '#ccc' }}>{fac.name}</span>
                                    </div>
                                ));
                            } catch (e) { return <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>Format fasilitas error</span>; }
                        })()}
                    </div>
                </div>

                <div style={cardStyle}>
                    <h3 style={sectionTitle}><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>route</span> Itinerary (Singkat)</h3>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {(() => {
                            try {
                                const itins = JSON.parse(pkg.itinerary || '[]');
                                if (itins.length === 0) return <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.875rem' }}>Belum ada data itinerary</span>;
                                return itins.map((it: any, idx: number) => (
                                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 800, flexShrink: 0 }}>{it.day}</div>
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'white', margin: '0 0 0.125rem 0', fontSize: '0.875rem' }}>{it.title || 'Agenda Baru'}</p>
                                            <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>{it.desc}</p>
                                        </div>
                                    </div>
                                ));
                            } catch (e) { return <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>Format itinerary error</span>; }
                        })()}
                    </div>
                </div>
            </div>

            {/* Departures Section */}
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>Jadwal Keberangkatan & Opsi Kamar</h2>

                {pkg.departures?.length === 0 ? (
                    <div style={{ ...cardStyle, padding: '3rem', textAlign: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#555', display: 'block', marginBottom: '0.75rem' }}>calendar_month</span>
                        <h3 style={{ fontWeight: 700, color: 'white', margin: '0 0 0.5rem 0' }}>Belum Ada Keberangkatan</h3>
                        <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>Tambahkan jadwal keberangkatan untuk paket umroh ini.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {pkg.departures.map((dep: any) => (
                            <div key={dep.id} style={cardStyle}>
                                {/* Departure Meta */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '2rem' }}>
                                        <div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>calendar_month</span> Tanggal
                                            </span>
                                            <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{new Date(dep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>location_on</span> Bandara
                                            </span>
                                            <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{dep.airport}</p>
                                        </div>
                                        <div>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>group</span> Kuota
                                            </span>
                                            <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{dep.bookedSeats} <span style={{ color: '#888', fontSize: '0.875rem' }}>/ {dep.totalSeats} Pax</span></p>
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.25rem' }}>Status</span>
                                            <span style={{ padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
                                                {dep.status === 'available' ? 'Tersedia' : dep.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleDeleteDeparture(dep.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }} title="Hapus">
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                        </button>
                                        <button onClick={() => openRoomModal(dep.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 700 }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>bed</span>
                                            + Tipe Kamar
                                        </button>
                                    </div>
                                </div>

                                {/* Room Types */}
                                {(!dep.roomTypes || dep.roomTypes.length === 0) ? (
                                    <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: '0.875rem', padding: '1rem 0' }}>
                                        Belum ada opsi kamar disetup untuk keberangkatan ini.
                                    </p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                        {dep.roomTypes.map((room: any) => (
                                            <div key={room.id} style={{ padding: '1rem', borderRadius: '0.75rem', border: '1px solid #333', background: '#0a0907' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                                                    <h4 style={{ fontWeight: 700, color: 'white', margin: 0, fontSize: '1rem' }}>{room.name}</h4>
                                                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                                                        <span style={{ padding: '0.125rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 700, color: '#888' }}>{room.capacity} Orang</span>
                                                        <button onClick={() => handleDeleteRoom(room.id)} style={{ padding: '0.25rem', background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer' }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.6875rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.25rem 0' }}>Total Harga Pax</p>
                                                        <p style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>Rp{(pkg.basePrice + room.priceAdjustment).toLocaleString('id-ID')}</p>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        {room.priceAdjustment > 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>+Rp{room.priceAdjustment.toLocaleString('id-ID')}</span>}
                                                        {room.priceAdjustment < 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>-Rp{Math.abs(room.priceAdjustment).toLocaleString('id-ID')}</span>}
                                                        {room.priceAdjustment === 0 && <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888' }}>Base Price</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Departure Modal */}
            {isDepartureModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 60 }}>
                    <div style={{ maxWidth: '28rem', width: '100%', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>Tambah Keberangkatan</h3>
                            <button onClick={() => setIsDepartureModalOpen(false)} style={{ padding: '0.375rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateDeparture} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Tanggal Keberangkatan</label>
                                    <input type="date" required value={departureForm.date} onChange={(e) => setDepartureForm({ ...departureForm, date: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Bandara</label>
                                    <select required value={departureForm.airport} onChange={(e) => setDepartureForm({ ...departureForm, airport: e.target.value })} style={inputStyle}>
                                        <option value="">Pilih Bandara</option>
                                        {masters.airports.map(a => <option key={a.id} value={a.code}>{a.name} ({a.code})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Kuota Seat Tersedia</label>
                                    <input type="number" required min="1" value={departureForm.seats} onChange={(e) => setDepartureForm({ ...departureForm, seats: parseInt(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsDepartureModalOpen(false)} style={{ flex: 1, padding: '0.875rem', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.875rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Room Modal */}
            {isRoomModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', zIndex: 60 }}>
                    <div style={{ maxWidth: '28rem', width: '100%', background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
                            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.125rem' }}>Tambah Tipe Kamar</h3>
                            <button onClick={() => setIsRoomModalOpen(false)} style={{ padding: '0.375rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRoom} style={{ padding: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'var(--color-primary-bg)', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                Harga Dasar Paket: Rp {(pkg?.basePrice || 0).toLocaleString('id-ID')}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Nama Kapasitas / Tipe Bed</label>
                                    <input type="text" required value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="Misal: Quad Bed (4 Orang)" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Kapasitas (Orang)</label>
                                    <input type="number" required min="1" value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value) || 0 })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Penyesuaian Harga (Rp)</label>
                                    <input type="number" required value={roomForm.priceAdjustment === 0 ? '' : roomForm.priceAdjustment} onChange={(e) => setRoomForm({ ...roomForm, priceAdjustment: parseInt(e.target.value) || 0 })} placeholder="Contoh: 1500000" style={inputStyle} />
                                    <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0 0 0' }}>Isi 0 jika sama dengan Base Price. Positif (+) jika lebih mahal, negatif (-) jika lebih murah.</p>
                                    {roomForm.priceAdjustment !== 0 && (
                                        <div style={{ marginTop: '0.5rem', padding: '0.625rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700 }}>
                                            <span style={{ color: '#888' }}>Total Harga Jamaah:</span>
                                            <span style={{ color: 'white' }}>Rp {((pkg?.basePrice || 0) + (roomForm.priceAdjustment || 0)).toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setIsRoomModalOpen(false)} style={{ flex: 1, padding: '0.875rem', background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Batal</button>
                                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '0.875rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
