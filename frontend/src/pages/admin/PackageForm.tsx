import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, X, Loader2, ImagePlus } from 'lucide-react';

// Simple toolbar for rich text areas
function RichTextToolbar({ id }: { id: string }) {
    const exec = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        document.getElementById(id)?.focus();
    };
    return (
        <div style={{ display: 'flex', gap: '2px', padding: '0.5rem', borderBottom: '1px solid #333', background: '#0a0907' }}>
            {[
                { cmd: 'bold', label: 'Bold', style: { fontWeight: 700 } },
                { cmd: 'italic', label: 'Italic', style: { fontStyle: 'italic' } },
                { cmd: 'insertUnorderedList', label: 'Bullet List', style: {} },
                { cmd: 'insertOrderedList', label: 'Ordered List', style: {} },
            ].map(b => (
                <button key={b.cmd} type="button" onClick={() => exec(b.cmd)} style={{
                    padding: '0.375rem 0.75rem', borderRadius: '0.25rem', border: 'none',
                    background: b.cmd === 'insertOrderedList' ? 'var(--color-primary)' : 'transparent',
                    color: b.cmd === 'insertOrderedList' ? '#000' : '#aaa',
                    fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    ...b.style as any,
                }}>{b.label}</button>
            ))}
        </div>
    );
}

// Rich text editor component
function RichTextEditor({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'white' }}>{label}</label>
            <div style={{ border: '1px solid #333', borderRadius: '0.5rem', overflow: 'hidden', background: '#131210' }}>
                <RichTextToolbar id={id} />
                <div
                    id={id}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: value }}
                    style={{
                        minHeight: '120px', padding: '1rem', color: 'white', fontSize: '0.875rem',
                        lineHeight: 1.7, outline: 'none', background: '#131210',
                    }}
                />
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem', background: '#f8f8f8', border: '1px solid #e0e0e0',
    color: '#222', borderRadius: '0.5rem', fontSize: '0.875rem',
};

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#444', marginBottom: '0.5rem',
};

const sectionStyle: React.CSSProperties = {
    background: 'white', border: '1px solid #e0e0e0', borderRadius: '0.75rem',
    padding: '1.5rem', marginBottom: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#222',
};

const helpStyle: React.CSSProperties = {
    fontSize: '0.75rem', color: '#999', marginTop: '0.375rem',
};

interface RoomConfig {
    name: string;
    capacity: number;
    priceAdjustment: number;
}

interface DepartureConfig {
    date: string;
}

export default function PackageForm() {
    const navigate = useNavigate();
    const { id: editId } = useParams<{ id: string }>();
    const isEdit = Boolean(editId);

    const [loadingMasters, setLoadingMasters] = useState(true);
    const [loadingPackage, setLoadingPackage] = useState(false);
    const [saving, setSaving] = useState(false);

    // Master Data
    const [masters, setMasters] = useState({
        hotels: [] as any[],
        airlines: [] as any[],
        airports: [] as any[],
    });

    // Form State
    const [form, setForm] = useState({
        name: '',
        basePrice: '',
        packageType: '',
        isPromo: false,
        serviceType: '',
        duration: '',
        description: '',
        makkahHotelId: '',
        madinahHotelId: '',
        // Transportasi
        departureAirlineId: '',
        returnAirlineId: '',
        departureAirportId: '',
        arrivalAirportId: '',

        termsConditions: '',
        requirements: '',
        itinerary: '<ol><li>Persiapan</li><li>...</li></ol>',
        facilities: '<ol><li>Fasilitas 1</li><li>...</li></ol>',
    });

    const [images, setImages] = useState<string[]>(['', '', '', '', '']);
    const [departures, setDepartures] = useState<DepartureConfig[]>([]);
    const [rooms, setRooms] = useState<RoomConfig[]>([]);
    const [mainAirportId, setMainAirportId] = useState('');

    // Load master data
    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [h, al, ap] = await Promise.all([
                    apiFetch<any>('/api/masters/hotels'),
                    apiFetch<any>('/api/masters/airlines'),
                    apiFetch<any>('/api/masters/airports'),
                ]);
                setMasters({ hotels: h.hotels, airlines: al.airlines, airports: ap.airports });
            } catch {
                toast.error('Gagal memuat master data.');
            } finally {
                setLoadingMasters(false);
            }
        };
        fetchMasters();
    }, []);

    // Load existing package for edit mode
    useEffect(() => {
        if (!editId) return;
        setLoadingPackage(true);
        apiFetch<{ package: any }>(`/api/packages/${editId}`)
            .then(data => {
                const pkg = data.package;
                if (!pkg) { toast.error('Paket tidak ditemukan'); navigate('/admin/packages'); return; }
                setForm({
                    name: pkg.name || '',
                    basePrice: String(pkg.basePrice || ''),
                    packageType: pkg.packageType || '',
                    isPromo: pkg.isPromo || false,
                    serviceType: pkg.serviceType || '',
                    duration: pkg.duration || '',
                    description: pkg.description || '',
                    makkahHotelId: pkg.makkahHotelId || '',
                    madinahHotelId: pkg.madinahHotelId || '',
                    departureAirlineId: '',
                    returnAirlineId: '',
                    departureAirportId: '',
                    arrivalAirportId: '',
                    termsConditions: pkg.termsConditions || '',
                    requirements: pkg.requirements || '',
                    itinerary: pkg.itinerary || '<ol><li></li></ol>',
                    facilities: pkg.facilities || '<ol><li></li></ol>',
                });
                if (pkg.images) {
                    try {
                        const parsed = JSON.parse(pkg.images);
                        setImages([...parsed, ...Array(5 - parsed.length).fill('')].slice(0, 5));
                    } catch { }
                }
                if (pkg.image) {
                    setImages(prev => { const n = [...prev]; n[0] = pkg.image; return n; });
                }
            })
            .catch(() => toast.error('Gagal memuat data paket'))
            .finally(() => setLoadingPackage(false));
    }, [editId]);

    // Add departure date
    const addDeparture = () => setDepartures([...departures, { date: '' }]);
    const removeDeparture = (idx: number) => setDepartures(departures.filter((_, i) => i !== idx));
    const updateDeparture = (idx: number, date: string) => {
        const nd = [...departures]; nd[idx] = { date }; setDepartures(nd);
    };

    // Add room config
    const addRoom = () => setRooms([...rooms, { name: '', capacity: 4, priceAdjustment: 0 }]);
    const removeRoom = (idx: number) => setRooms(rooms.filter((_, i) => i !== idx));
    const updateRoom = (idx: number, field: string, value: any) => {
        const nr = [...rooms]; nr[idx] = { ...nr[idx], [field]: value }; setRooms(nr);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.name || !form.basePrice) {
            toast.error("Judul dan Harga wajib diisi");
            return;
        }

        setSaving(true);
        try {
            const validImages = images.filter(Boolean);
            const payload: any = {
                name: form.name,
                basePrice: parseInt(form.basePrice),
                packageType: form.packageType || undefined,
                isPromo: form.isPromo,
                serviceType: form.serviceType || undefined,
                duration: form.duration || undefined,
                description: form.description || undefined,
                makkahHotelId: form.makkahHotelId || null,
                madinahHotelId: form.madinahHotelId || null,
                itinerary: form.itinerary || undefined,
                facilities: form.facilities || undefined,
                termsConditions: form.termsConditions || undefined,
                requirements: form.requirements || undefined,
                image: validImages[0] || undefined,
                images: validImages.length > 0 ? JSON.stringify(validImages) : undefined,
                isActive: true,
            };

            let packageId = editId;

            if (isEdit) {
                await apiFetch(`/api/packages/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                toast.success('Paket berhasil diperbarui!');
            } else {
                const res = await apiFetch<{ package: any }>('/api/packages', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                packageId = res.package.id;
                toast.success('Paket berhasil dibuat!');
            }

            // Create departures + room types if in create mode
            if (!isEdit && packageId) {
                for (const dep of departures) {
                    if (!dep.date) continue;
                    const airport = masters.airports.find(a => a.id === mainAirportId);
                    try {
                        const depRes = await apiFetch<{ departure: any }>('/api/departures', {
                            method: 'POST',
                            body: JSON.stringify({
                                packageId,
                                departureDate: dep.date,
                                airport: airport?.code || 'TBD',
                                totalSeats: 45,
                                departureAirlineId: form.departureAirlineId || undefined,
                                returnAirlineId: form.returnAirlineId || undefined,
                                departureAirportId: form.departureAirportId || undefined,
                                arrivalAirportId: form.arrivalAirportId || undefined,
                            }),
                        });

                        // Add room types to this departure
                        if (rooms.length > 0 && depRes.departure?.id) {
                            await apiFetch(`/api/departures/${depRes.departure.id}/rooms`, {
                                method: 'POST',
                                body: JSON.stringify(rooms),
                            });
                        }
                    } catch (err) {
                        console.error('Failed to create departure:', err);
                    }
                }
            }

            navigate('/admin/packages');
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loadingMasters || loadingPackage) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <Loader2 className="animate-spin text-primary w-12 h-12" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: '1rem', color: '#888' }}>Menyiapkan data form...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/packages')} style={{ padding: '0.5rem', background: '#222', border: '1px solid #333', borderRadius: '0.5rem', color: '#fff', cursor: 'pointer', display: 'flex' }}>
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{isEdit ? 'Edit Produk/Layanan' : 'Buat Produk/Layanan'}</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>

                {/* ====== GAMBAR ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Gambar <span style={{ color: '#ccc', fontWeight: 400 }}>*</span></label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{
                                width: '100px', height: '100px', borderRadius: '0.5rem', overflow: 'hidden',
                                border: img ? '2px solid var(--color-primary)' : '2px dashed #ddd',
                                background: img ? `url(${img}) center/cover` : '#fafafa',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                position: 'relative',
                            }}
                                onClick={() => {
                                    const url = prompt('Masukkan URL gambar:', img);
                                    if (url !== null) {
                                        const ni = [...images]; ni[idx] = url; setImages(ni);
                                    }
                                }}>
                                {!img && <ImagePlus size={24} color="#ccc" />}
                                {img && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); const ni = [...images]; ni[idx] = ''; setImages(ni); }}
                                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p style={helpStyle}>Terdapat fitur yang akan dikembangkan 5.0</p>
                </div>

                {/* ====== JUDUL ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Judul <span style={{ color: 'red' }}>*</span></label>
                    <input
                        placeholder="Umroh Full xxx..."
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        style={inputStyle}
                        required
                    />
                    <p style={helpStyle}>Berikan nama yang menarik agar jamaah butuh untuk melihat</p>
                </div>

                {/* ====== HARGA ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Harga <span style={{ color: 'red' }}>*</span></label>
                    <input
                        type="number"
                        placeholder="Contoh: 35000000"
                        value={form.basePrice}
                        onChange={e => setForm({ ...form, basePrice: e.target.value })}
                        style={inputStyle}
                        required
                    />
                    <p style={helpStyle}>Berikan harga yang sesuai dan layanan harga</p>
                </div>

                {/* ====== JENIS PAKET ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Jenis Paket</label>
                    <select
                        value={form.packageType}
                        onChange={e => setForm({ ...form, packageType: e.target.value })}
                        style={inputStyle}
                    >
                        <option value="">Pilih Jenis Paket</option>
                        <option value="Bintang 5">Bintang 5</option>
                        <option value="Bintang 4">Bintang 4</option>
                        <option value="Bintang 3">Bintang 3</option>
                        <option value="VIP Premium">VIP Premium</option>
                        <option value="Ekonomi Saver">Ekonomi Saver</option>
                        <option value="Reguler">Reguler</option>
                    </select>
                    <p style={helpStyle}>Tentukan jenis paket layanan</p>
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="isPromo" checked={form.isPromo} onChange={e => setForm({ ...form, isPromo: e.target.checked })} />
                        <label htmlFor="isPromo" style={{ fontSize: '0.875rem', color: '#666', cursor: 'pointer' }}>Ceklist jika paket ada promo</label>
                    </div>
                </div>

                {/* ====== JENIS LAYANAN ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Jenis Layanan</label>
                    <input
                        placeholder="Tentukan jenis layanan yang inilah untuk ditampilkan"
                        value={form.serviceType}
                        onChange={e => setForm({ ...form, serviceType: e.target.value })}
                        style={inputStyle}
                    />
                </div>

                {/* ====== DURASI PERJALANAN ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Durasi Perjalanan</label>
                    <input
                        placeholder="Contoh: Selama 12 Hari + Turki"
                        value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })}
                        style={inputStyle}
                    />
                    <p style={helpStyle}>Tentukan tanggal keberangkatan nya</p>
                </div>

                {/* ====== SETUP TGL KEBERANGKATAN ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Setup Tgl Keberangkatan</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {departures.map((dep, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="date"
                                    value={dep.date}
                                    onChange={e => updateDeparture(idx, e.target.value)}
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                                <button type="button" onClick={() => removeDeparture(idx)}
                                    style={{ padding: '0.875rem', background: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', color: '#c33', cursor: 'pointer' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {departures.length === 0 && (
                            <input type="date" disabled style={{ ...inputStyle, opacity: 0.5 }} placeholder="Pick a date" />
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                        <button type="button" onClick={addDeparture}
                            style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '0.375rem', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8125rem' }}>
                            <Plus size={14} /> Tambah
                        </button>
                    </div>
                    <p style={helpStyle}>Tentukan tanggal keberangkatan nya</p>
                </div>

                {/* ====== BANDARA KEBERANGKATAN ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Bandara Keberangkatan</label>
                    <select
                        value={mainAirportId}
                        onChange={e => setMainAirportId(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">Pilih bandara keberangkatan pilihan</option>
                        {masters.airports.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                        ))}
                    </select>
                    <p style={helpStyle}>Tentukan bandara paling sekitar pilihan</p>
                </div>

                {/* ====== SETUP TRANSPORTASI ====== */}
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Setup Transportasi</h3>
                    <p style={{ ...helpStyle, marginTop: '-0.25rem', marginBottom: '1rem' }}>Tentukan maskapai sebagai transportasi utama untuk dalam setiap pake layanan</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Pesawat Keberangkatan</label>
                            <select value={form.departureAirlineId} onChange={e => setForm({ ...form, departureAirlineId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p style={helpStyle}>Terdapat maskapai layanan pilihan</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Pesawat Kepulangan</label>
                            <select value={form.returnAirlineId} onChange={e => setForm({ ...form, returnAirlineId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p style={helpStyle}>Pilih dari pesawat kepulangan</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Bandara Keberangkatan</label>
                            <select value={form.departureAirportId} onChange={e => setForm({ ...form, departureAirportId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p style={helpStyle}>Tentukan pesawat bandara pilihan</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Bandara Kedatangan</label>
                            <select value={form.arrivalAirportId} onChange={e => setForm({ ...form, arrivalAirportId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p style={helpStyle}>Pilih dari pesawat kedatangan.</p>
                        </div>
                    </div>
                </div>

                {/* ====== SETUP DATA HOTEL ====== */}
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Setup Data Hotel</h3>
                    <p style={{ ...helpStyle, marginTop: '-0.25rem', marginBottom: '1rem' }}>Berikan data hotel akuntansi dimana akan jadi referensi dari kontrak layanan</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Hotel Makkah</label>
                            <select value={form.makkahHotelId} onChange={e => setForm({ ...form, makkahHotelId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                            <p style={helpStyle}>Terdapat hotel ceras ke mekkah untuk di serifikasi</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Hotel Madinah</label>
                            <select value={form.madinahHotelId} onChange={e => setForm({ ...form, madinahHotelId: e.target.value })} style={inputStyle}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                            <p style={helpStyle}>Pilih data hotel ceras ke mekkah ceras ke mekkah</p>
                        </div>
                    </div>
                </div>

                {/* ====== SETUP DATA KAMAR ====== */}
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Setup Data Kamar</h3>
                    <p style={{ ...helpStyle, marginTop: '-0.25rem', marginBottom: '1rem' }}>Berikan data kamar yang ditampilkan dan terdapat dua varian kamara</p>

                    {rooms.map((room, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Kapasitas Kamar</label>
                                <select value={room.name || ''} onChange={e => updateRoom(idx, 'name', e.target.value)} style={inputStyle}>
                                    <option value="">Pilih kapasitas kamar</option>
                                    <option value="Quad">Quad (4 Orang)</option>
                                    <option value="Triple">Triple (3 Orang)</option>
                                    <option value="Double">Double (2 Orang)</option>
                                    <option value="Single">Single (1 Orang)</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={labelStyle}>Harga</label>
                                <input
                                    type="number"
                                    placeholder="15000000"
                                    value={room.priceAdjustment || ''}
                                    onChange={e => updateRoom(idx, 'priceAdjustment', parseInt(e.target.value) || 0)}
                                    style={inputStyle}
                                />
                            </div>
                            <button type="button" onClick={() => removeRoom(idx)}
                                style={{ padding: '0.875rem', background: '#fee', border: '1px solid #fcc', borderRadius: '0.5rem', color: '#c33', cursor: 'pointer', marginBottom: '0.15rem' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {rooms.length === 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Kapasitas Kamar</label>
                                <select disabled style={{ ...inputStyle, opacity: 0.5 }}><option>Pilih kapasitas kamar</option></select>
                            </div>
                            <div>
                                <label style={labelStyle}>Harga</label>
                                <input type="number" disabled placeholder="15000000" style={{ ...inputStyle, opacity: 0.5 }} />
                            </div>
                        </div>
                    )}

                    <button type="button" onClick={addRoom}
                        style={{
                            width: '100%', padding: '0.75rem', background: '#fafafa', border: '1px dashed #ccc',
                            borderRadius: '0.5rem', color: '#888', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                        }}>
                        Tambahkan spesifikasi kamar
                    </button>
                </div>

                {/* ====== DESKRIPSI PRODUK/SOLUSI ====== */}
                <div style={sectionStyle}>
                    <label style={labelStyle}>Deskripsi Produk/Solusi</label>
                    <textarea
                        rows={5}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        placeholder="Berikan deskripsi mengenai produk layanan anda..."
                    />
                    <p style={helpStyle}>Berikan deskripsi produk layanan yang sesuai karena akan ditampilkan tangungjawab</p>
                </div>

                {/* ====== ITINERARY ====== */}
                <div style={sectionStyle}>
                    <RichTextEditor
                        id="itinerary-editor"
                        label="Itinerary"
                        value={form.itinerary}
                        onChange={v => setForm(f => ({ ...f, itinerary: v }))}
                    />
                </div>

                {/* ====== FASILITAS ====== */}
                <div style={sectionStyle}>
                    <RichTextEditor
                        id="facilities-editor"
                        label="Fasilitas"
                        value={form.facilities}
                        onChange={v => setForm(f => ({ ...f, facilities: v }))}
                    />
                </div>

                {/* ====== PERSYARATAN ====== */}
                <div style={sectionStyle}>
                    <RichTextEditor
                        id="requirements-editor"
                        label="Persyaratan"
                        value={form.requirements}
                        onChange={v => setForm(f => ({ ...f, requirements: v }))}
                    />
                </div>

                {/* ====== SYARAT & KONDISI ====== */}
                <div style={sectionStyle}>
                    <RichTextEditor
                        id="terms-editor"
                        label="Syarat & Kondisi"
                        value={form.termsConditions}
                        onChange={v => setForm(f => ({ ...f, termsConditions: v }))}
                    />
                </div>

                {/* ====== SUBMIT ====== */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem', marginBottom: '3rem' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            padding: '0.875rem 3rem', background: 'var(--color-primary)', color: '#000',
                            fontWeight: 800, border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem',
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

            </form>
        </div>
    );
}
