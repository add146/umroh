import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, X, Loader2, ImagePlus } from 'lucide-react';

// Simple toolbar for rich text areas
function RichTextToolbar({ id }: { id: string }) {
    const exec = (cmd: string) => {
        document.execCommand(cmd, false);
        document.getElementById(id)?.focus();
    };
    return (
        <div className="flex gap-0.5 px-4 py-3 border-b border-[var(--color-border)] bg-[#0a0907]">
            {[
                { cmd: 'bold', label: 'Bold', active: false },
                { cmd: 'italic', label: 'Italic', active: false },
                { cmd: 'insertUnorderedList', label: 'Bullet List', active: false },
                { cmd: 'insertOrderedList', label: 'Ordered List', active: true },
            ].map(b => (
                <button key={b.cmd} type="button" onClick={() => exec(b.cmd)}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${b.active
                        ? 'bg-[var(--color-primary)] text-[#0a0907]'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >{b.label}</button>
            ))}
        </div>
    );
}

// Rich text editor component
function RichTextEditor({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label className="block text-sm font-bold text-white mb-3">{label}</label>
            <div className="border border-[var(--color-border)] rounded-2xl overflow-hidden bg-[#131210]">
                <RichTextToolbar id={id} />
                <div
                    id={id}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="min-h-[120px] p-4 text-white text-sm leading-7 outline-none"
                />
            </div>
        </div>
    );
}

// Reusable styles
const inputClass = "w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all font-medium placeholder:text-gray-600";
const labelClass = "block text-xs font-black uppercase text-gray-400 tracking-widest mb-2";
const helpClass = "text-xs text-[var(--color-text-light)] mt-2";
const sectionClass = "dark-card p-6 rounded-2xl border border-[var(--color-border)] mb-5";

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

    // Departure helpers
    const addDeparture = () => setDepartures([...departures, { date: '' }]);
    const removeDeparture = (idx: number) => setDepartures(departures.filter((_, i) => i !== idx));
    const updateDeparture = (idx: number, date: string) => {
        const nd = [...departures]; nd[idx] = { date }; setDepartures(nd);
    };

    // Room helpers
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
            <div className="py-20 text-center">
                <Loader2 className="animate-spin w-12 h-12 mx-auto" style={{ color: 'var(--color-primary)' }} />
                <p className="mt-4 text-sm font-bold text-gray-400 uppercase tracking-widest">Menyiapkan data form...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/admin/packages')}
                    className="p-3 dark-card border border-[var(--color-border)] rounded-xl text-white hover:border-[var(--color-primary)] transition-all">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-black tracking-tight">{isEdit ? 'Edit Produk/Layanan' : 'Buat Produk/Layanan'}</h1>
            </div>

            <form onSubmit={handleSubmit}>

                {/* ====== GAMBAR ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Gambar</label>
                    <div className="flex gap-3 flex-wrap">
                        {images.map((img, idx) => (
                            <div key={idx}
                                className="w-24 h-24 rounded-xl overflow-hidden border-2 border-dashed border-[var(--color-border)] flex items-center justify-center cursor-pointer hover:border-[var(--color-primary)] transition-all relative"
                                style={img ? { backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', borderStyle: 'solid', borderColor: 'var(--color-primary)' } : {}}
                                onClick={() => {
                                    const url = prompt('Masukkan URL gambar:', img);
                                    if (url !== null) { const ni = [...images]; ni[idx] = url; setImages(ni); }
                                }}>
                                {!img && <ImagePlus size={24} className="text-gray-600" />}
                                {img && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); const ni = [...images]; ni[idx] = ''; setImages(ni); }}
                                        className="absolute top-1 right-1 bg-black/60 border-none text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className={helpClass}>Terdapat fitur yang akan dikembangkan 5.0</p>
                </div>

                {/* ====== JUDUL ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Judul <span className="text-red-400">*</span></label>
                    <input placeholder="Umroh Full xxx..." value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className={inputClass} required />
                    <p className={helpClass}>Berikan nama yang menarik agar jamaah butuh untuk melihat</p>
                </div>

                {/* ====== HARGA ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Harga <span className="text-red-400">*</span></label>
                    <input type="number" placeholder="Contoh: 35000000" value={form.basePrice}
                        onChange={e => setForm({ ...form, basePrice: e.target.value })}
                        className={inputClass} required />
                    <p className={helpClass}>Berikan harga yang sesuai dan layanan harga</p>
                </div>

                {/* ====== JENIS PAKET ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Jenis Paket</label>
                    <select value={form.packageType} onChange={e => setForm({ ...form, packageType: e.target.value })} className={inputClass}>
                        <option value="">Pilih Jenis Paket</option>
                        <option value="Bintang 5">Bintang 5</option>
                        <option value="Bintang 4">Bintang 4</option>
                        <option value="Bintang 3">Bintang 3</option>
                        <option value="VIP Premium">VIP Premium</option>
                        <option value="Ekonomi Saver">Ekonomi Saver</option>
                        <option value="Reguler">Reguler</option>
                    </select>
                    <p className={helpClass}>Tentukan jenis paket layanan</p>
                    <div className="flex items-center gap-2 mt-3">
                        <input type="checkbox" id="isPromo" checked={form.isPromo}
                            onChange={e => setForm({ ...form, isPromo: e.target.checked })}
                            className="accent-[var(--color-primary)]" />
                        <label htmlFor="isPromo" className="text-sm text-gray-400 cursor-pointer">Ceklist jika paket ada promo</label>
                    </div>
                </div>

                {/* ====== JENIS LAYANAN ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Jenis Layanan</label>
                    <input placeholder="Tentukan jenis layanan yang inilah untuk ditampilkan"
                        value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} className={inputClass} />
                </div>

                {/* ====== DURASI PERJALANAN ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Durasi Perjalanan</label>
                    <input placeholder="Contoh: Selama 12 Hari + Turki" value={form.duration}
                        onChange={e => setForm({ ...form, duration: e.target.value })} className={inputClass} />
                    <p className={helpClass}>Tentukan durasi perjalanan</p>
                </div>

                {/* ====== SETUP TGL KEBERANGKATAN ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Setup Tgl Keberangkatan</label>
                    <div className="flex flex-col gap-3">
                        {departures.map((dep, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input type="date" value={dep.date} onChange={e => updateDeparture(idx, e.target.value)}
                                    className={`${inputClass} flex-1`} />
                                <button type="button" onClick={() => removeDeparture(idx)}
                                    className="p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-400 hover:bg-red-900/40 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {departures.length === 0 && (
                            <input type="date" disabled className={`${inputClass} opacity-40`} />
                        )}
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button type="button" onClick={addDeparture}
                            className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all"
                            style={{ background: 'var(--color-primary)', color: '#0a0907' }}>
                            <Plus size={14} /> Tambah
                        </button>
                    </div>
                    <p className={helpClass}>Tentukan tanggal keberangkatan nya</p>
                </div>

                {/* ====== BANDARA KEBERANGKATAN ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Bandara Keberangkatan</label>
                    <select value={mainAirportId} onChange={e => setMainAirportId(e.target.value)} className={inputClass}>
                        <option value="">Pilih bandara keberangkatan pilihan</option>
                        {masters.airports.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                        ))}
                    </select>
                    <p className={helpClass}>Tentukan bandara paling sesuai pilihan</p>
                </div>

                {/* ====== SETUP TRANSPORTASI ====== */}
                <div className={sectionClass}>
                    <h3 className="text-base font-bold text-white mb-1">Setup Transportasi</h3>
                    <p className={`${helpClass} !mt-0 mb-5`}>Tentukan maskapai sebagai transportasi utama untuk dalam setiap paket layanan</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Pesawat Keberangkatan</label>
                            <select value={form.departureAirlineId} onChange={e => setForm({ ...form, departureAirlineId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p className={helpClass}>Terdapat maskapai layanan pilihan</p>
                        </div>
                        <div>
                            <label className={labelClass}>Pesawat Kepulangan</label>
                            <select value={form.returnAirlineId} onChange={e => setForm({ ...form, returnAirlineId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p className={helpClass}>Pilih dari pesawat kepulangan</p>
                        </div>
                        <div>
                            <label className={labelClass}>Bandara Keberangkatan</label>
                            <select value={form.departureAirportId} onChange={e => setForm({ ...form, departureAirportId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p className={helpClass}>Tentukan pesawat bandara pilihan</p>
                        </div>
                        <div>
                            <label className={labelClass}>Bandara Kedatangan</label>
                            <select value={form.arrivalAirportId} onChange={e => setForm({ ...form, arrivalAirportId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p className={helpClass}>Pilih dari bandara kedatangan</p>
                        </div>
                    </div>
                </div>

                {/* ====== SETUP DATA HOTEL ====== */}
                <div className={sectionClass}>
                    <h3 className="text-base font-bold text-white mb-1">Setup Data Hotel</h3>
                    <p className={`${helpClass} !mt-0 mb-5`}>Berikan data hotel sebagai referensi dari kontrak layanan</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}>Hotel Makkah</label>
                            <select value={form.makkahHotelId} onChange={e => setForm({ ...form, makkahHotelId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                            <p className={helpClass}>Terdapat hotel dekat ke Mekkah untuk di verifikasi</p>
                        </div>
                        <div>
                            <label className={labelClass}>Hotel Madinah</label>
                            <select value={form.madinahHotelId} onChange={e => setForm({ ...form, madinahHotelId: e.target.value })} className={inputClass}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                            <p className={helpClass}>Pilih data hotel dekat ke Madinah</p>
                        </div>
                    </div>
                </div>

                {/* ====== SETUP DATA KAMAR ====== */}
                <div className={sectionClass}>
                    <h3 className="text-base font-bold text-white mb-1">Setup Data Kamar</h3>
                    <p className={`${helpClass} !mt-0 mb-5`}>Berikan data kamar yang ditampilkan dan terdapat varian kamar</p>

                    {rooms.map((room, idx) => (
                        <div key={idx} className="flex gap-3 items-end mb-3">
                            <div className="flex-1">
                                <label className={labelClass}>Kapasitas Kamar</label>
                                <select value={room.name || ''} onChange={e => updateRoom(idx, 'name', e.target.value)} className={inputClass}>
                                    <option value="">Pilih kapasitas kamar</option>
                                    <option value="Quad">Quad (4 Orang)</option>
                                    <option value="Triple">Triple (3 Orang)</option>
                                    <option value="Double">Double (2 Orang)</option>
                                    <option value="Single">Single (1 Orang)</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className={labelClass}>Harga</label>
                                <input type="number" placeholder="15000000" value={room.priceAdjustment || ''}
                                    onChange={e => updateRoom(idx, 'priceAdjustment', parseInt(e.target.value) || 0)} className={inputClass} />
                            </div>
                            <button type="button" onClick={() => removeRoom(idx)}
                                className="p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-400 hover:bg-red-900/40 transition-all mb-0.5">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {rooms.length === 0 && (
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className={labelClass}>Kapasitas Kamar</label>
                                <select disabled className={`${inputClass} opacity-40`}><option>Pilih kapasitas kamar</option></select>
                            </div>
                            <div>
                                <label className={labelClass}>Harga</label>
                                <input type="number" disabled placeholder="15000000" className={`${inputClass} opacity-40`} />
                            </div>
                        </div>
                    )}

                    <button type="button" onClick={addRoom}
                        className="w-full py-3 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-gray-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] text-sm font-bold transition-all">
                        Tambahkan spesifikasi kamar
                    </button>
                </div>

                {/* ====== DESKRIPSI PRODUK/SOLUSI ====== */}
                <div className={sectionClass}>
                    <label className={labelClass}>Deskripsi Produk/Solusi</label>
                    <textarea rows={5} value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        className={`${inputClass} resize-y`}
                        placeholder="Berikan deskripsi mengenai produk layanan anda..." />
                    <p className={helpClass}>Berikan deskripsi produk layanan yang sesuai</p>
                </div>

                {/* ====== ITINERARY ====== */}
                <div className={sectionClass}>
                    <RichTextEditor id="itinerary-editor" label="Itinerary"
                        value={form.itinerary} onChange={v => setForm(f => ({ ...f, itinerary: v }))} />
                </div>

                {/* ====== FASILITAS ====== */}
                <div className={sectionClass}>
                    <RichTextEditor id="facilities-editor" label="Fasilitas"
                        value={form.facilities} onChange={v => setForm(f => ({ ...f, facilities: v }))} />
                </div>

                {/* ====== PERSYARATAN ====== */}
                <div className={sectionClass}>
                    <RichTextEditor id="requirements-editor" label="Persyaratan"
                        value={form.requirements} onChange={v => setForm(f => ({ ...f, requirements: v }))} />
                </div>

                {/* ====== SYARAT & KONDISI ====== */}
                <div className={sectionClass}>
                    <RichTextEditor id="terms-editor" label="Syarat & Kondisi"
                        value={form.termsConditions} onChange={v => setForm(f => ({ ...f, termsConditions: v }))} />
                </div>

                {/* ====== SUBMIT ====== */}
                <div className="flex justify-end mt-4 mb-12">
                    <button type="submit" disabled={saving}
                        className="px-10 py-4 rounded-2xl font-black text-base flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
                        style={{ background: 'var(--color-primary)', color: '#0a0907', opacity: saving ? 0.7 : 1 }}>
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>

            </form>
        </div>
    );
}
