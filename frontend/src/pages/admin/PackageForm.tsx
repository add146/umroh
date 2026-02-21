import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, GripVertical, Image as ImageIcon, Save, Package, X } from 'lucide-react';

export default function PackageForm() {
    const navigate = useNavigate();
    const [loadingMasters, setLoadingMasters] = useState(true);
    const [saving, setSaving] = useState(false);

    // Master Data States
    const [masters, setMasters] = useState({
        hotels: [] as any[],
        airlines: [] as any[],
        airports: [] as any[]
    });

    // Main Form
    const [form, setForm] = useState({
        name: '',
        slug: '',
        packageType: 'Reguler',
        basePrice: '',
        starRating: 3,
        isPromo: false,
        promoText: '',
        makkahHotelId: '',
        madinahHotelId: '',
        description: '',
        termsConditions: '',
        requirements: '',
    });

    // Complex Arrays Arrays
    const [facilities, setFacilities] = useState<{ icon: string, name: string }[]>([
        { icon: 'flight', name: 'Tiket Pesawat PP' }
    ]);
    const [itineraries, setItineraries] = useState<{ day: number, date: string, title: string, desc: string }[]>([
        { day: 1, date: '', title: 'Keberangkatan', desc: 'Berkumpul di Lounge Bandara 4 jam sebelum keberangkatan.' }
    ]);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [h, al, ap] = await Promise.all([
                    apiFetch<any>('/api/masters/hotels'),
                    apiFetch<any>('/api/masters/airlines'),
                    apiFetch<any>('/api/masters/airports')
                ]);
                setMasters({ hotels: h.hotels, airlines: al.airlines, airports: ap.airports });
            } catch (error) {
                toast.error('Gagal memuat master data relasi.');
            } finally {
                setLoadingMasters(false);
            }
        };

        fetchMasters();
    }, []);

    // Handlers
    const addFacility = () => setFacilities([...facilities, { icon: '', name: '' }]);
    const updateFacility = (index: number, field: string, value: string) => {
        const nf = [...facilities];
        nf[index] = { ...nf[index], [field]: value };
        setFacilities(nf);
    };
    const removeFacility = (index: number) => setFacilities(facilities.filter((_, i) => i !== index));

    const addItinerary = () => {
        setItineraries([...itineraries, {
            day: itineraries.length + 1, date: '', title: '', desc: ''
        }]);
    };
    const updateItinerary = (index: number, field: string, value: string) => {
        const ni = [...itineraries];
        ni[index] = { ...ni[index], [field]: value };
        setItineraries(ni);
    };
    const removeItinerary = (index: number) => setItineraries(itineraries.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.slug || !form.basePrice) {
            toast.error("Nama, Slug, dan Harga Dasar wajib diisi");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                basePrice: parseInt(form.basePrice),
                facilities: JSON.stringify(facilities),
                itinerary: JSON.stringify(itineraries)
            };

            await apiFetch('/api/packages', {
                method: 'POST',
                body: JSON.stringify({ ...payload, isActive: true }) // enforce schema validation map
            });
            toast.success('Paket Layanan berhasil dibuat!');
            navigate('/admin/packages');

        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loadingMasters) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Sedang menyinkronkan data hotel & maskapai...</div>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/packages')} style={{ padding: '0.5rem', background: '#222', border: '1px solid #333', borderRadius: '0.5rem', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Form Layanan Paket</h1>
                    <p style={{ color: 'var(--color-primary)', fontSize: '0.875rem', margin: 0 }}>Desain konten produk untuk jamaah</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 2fr) 1fr', gap: '1.5rem', alignItems: 'start' }}>

                {/* KIRI - Konten Utama */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Basic Info */}
                    <div style={{ background: '#131210', border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} color="var(--color-primary)" /> Informasi Dasar
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#aaa', marginBottom: '0.5rem' }}>Nama Paket</label>
                                <input className="admin-input" placeholder="Contoh: Premium Umroh Plus Turkey 12 Hari" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#aaa', marginBottom: '0.5rem' }}>Slug (URL)</label>
                                <input className="admin-input" placeholder="premium-turkey-oct" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#aaa', marginBottom: '0.5rem' }}>Harga Dasar (Mulai Dari)</label>
                                <input type="number" className="admin-input" placeholder="35000000" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }} required />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', color: '#aaa', marginBottom: '0.5rem' }}>Deskripsi Singkat (Landing Page)</label>
                                <textarea rows={3} className="admin-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }} />
                            </div>
                        </div>
                    </div>

                    {/* Itinerary Builder */}
                    <div style={{ background: '#131210', border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 600 }}>Rencana Perjalanan (Itinerary)</h3>
                            <button type="button" onClick={addItinerary} style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(200, 168, 81, 0.15)', color: 'var(--color-primary)', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                                <Plus size={16} /> Tambah Hari
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {itineraries.map((it, idx) => (
                                <div key={idx} style={{ padding: '1.25rem', background: '#0a0907', border: '1px solid #222', borderRadius: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'start' }}>
                                    <div style={{ marginTop: '10px', color: '#555', cursor: 'grab' }}><GripVertical size={20} /></div>
                                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#888' }}>Day</label>
                                            <input type="number" value={it.day} onChange={e => updateItinerary(idx, 'day', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#131210', border: '1px solid #333', color: 'white', borderRadius: '0.25rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', color: '#888' }}>Aktivitas / Judul Utama</label>
                                            <input type="text" value={it.title} onChange={e => updateItinerary(idx, 'title', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#131210', border: '1px solid #333', color: 'white', borderRadius: '0.25rem' }} placeholder="Misal: Tiba di Madinah & Check-in Hotel" />
                                        </div>
                                        <div style={{ gridColumn: '2', marginTop: '-0.5rem' }}>
                                            <label style={{ fontSize: '0.75rem', color: '#888' }}>Keterangan Lanjut</label>
                                            <textarea rows={2} value={it.desc} onChange={e => updateItinerary(idx, 'desc', e.target.value)} style={{ width: '100%', padding: '0.5rem', background: '#131210', border: '1px solid #333', color: 'white', borderRadius: '0.25rem' }} />
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => removeItinerary(idx)} style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: '10px' }}><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fasilitas */}
                    <div style={{ background: '#131210', border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 600 }}>Cakupan Fasilitas</h3>
                            <button type="button" onClick={addFacility} style={{ display: 'flex', gap: '4px', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                                <Plus size={16} /> Tambah Fasilitas
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {facilities.map((fac, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <input value={fac.icon} onChange={e => updateFacility(idx, 'icon', e.target.value)} placeholder="Mat Icon (misal: flight)" style={{ width: '80px', padding: '0.625rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', fontSize: '0.75rem' }} />
                                    <input value={fac.name} onChange={e => updateFacility(idx, 'name', e.target.value)} placeholder="Nama Fasilitas" style={{ flex: 1, padding: '0.625rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', fontSize: '0.875rem' }} />
                                    <button type="button" onClick={() => removeFacility(idx)} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* KANAN - Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Media */}
                    <div style={{ background: '#131210', border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Media</h3>
                        <div style={{ border: '1px dashed #444', background: '#0a0907', padding: '2rem', borderRadius: '0.75rem', textAlign: 'center', cursor: 'pointer' }}>
                            <ImageIcon size={32} color="#555" style={{ margin: '0 auto 0.5rem auto' }} />
                            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-primary)' }}>Upload Foto Cover</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>PNG, JPG up to 5MB</p>
                        </div>
                    </div>

                    {/* Atribut Pemasaran */}
                    <div style={{ background: '#131210', border: '1px solid #333', borderRadius: '1rem', padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Akomodasi (Hotel)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem' }}>Hotel Makkah</label>
                                <select value={form.makkahHotelId} onChange={e => setForm({ ...form, makkahHotelId: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }}>
                                    <option value="">-- Pilih dari Master Data --</option>
                                    {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem' }}>Hotel Madinah</label>
                                <select value={form.madinahHotelId} onChange={e => setForm({ ...form, madinahHotelId: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }}>
                                    <option value="">-- Pilih dari Master Data --</option>
                                    {masters.hotels.filter(h => h.city.toLowerCase() === 'madinah' || true).map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem' }}>Tipe Paket Experiece</label>
                                <select value={form.packageType} onChange={e => setForm({ ...form, packageType: e.target.value })} style={{ width: '100%', padding: '0.75rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }}>
                                    <option>Bintang 5</option>
                                    <option>Bintang 4</option>
                                    <option>Bintang 3</option>
                                    <option>VIP Premium</option>
                                    <option>Ekonomi Saver</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <button type="submit" disabled={saving} style={{ width: '100%', padding: '1rem', background: 'var(--color-primary)', color: '#000', fontWeight: 800, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                        {saving ? 'Loading...' : <><Save size={20} /> Terbitkan Paket</>}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', marginTop: '-0.5rem' }}>Setelah terbit, Anda dapat membuat jadwal Keberangkatan (Departures).</p>

                </div>
            </form>
        </div>
    );
}
