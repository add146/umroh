import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';
import { toast } from 'sonner';

// Shared inline styles (same as MasterDataPage)
const cardStyle: React.CSSProperties = {
    background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)',
};
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem',
};
const selectStyle: React.CSSProperties = {
    ...inputStyle, appearance: 'auto' as any,
};
const helpStyle: React.CSSProperties = {
    fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.375rem',
};
const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
};

// Simple rich text editor
function RichTextEditor({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            <label style={labelStyle}>{label}</label>
            <div style={{ border: '1px solid #333', borderRadius: '0.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: '2px', padding: '0.5rem', borderBottom: '1px solid #333', background: '#0a0907' }}>
                    {[
                        { cmd: 'bold', label: 'Bold' },
                        { cmd: 'italic', label: 'Italic' },
                        { cmd: 'insertUnorderedList', label: 'Bullet' },
                        { cmd: 'insertOrderedList', label: 'Numbered' },
                    ].map(b => (
                        <button key={b.cmd} type="button"
                            onClick={() => { document.execCommand(b.cmd, false); document.getElementById(id)?.focus(); }}
                            style={{
                                padding: '0.35rem 0.65rem', borderRadius: '0.25rem', border: 'none',
                                background: 'transparent', color: '#888', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            }}>{b.label}</button>
                    ))}
                </div>
                <div
                    id={id}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: value }}
                    style={{ minHeight: '100px', padding: '0.875rem', color: 'white', fontSize: '0.875rem', lineHeight: 1.7, outline: 'none', background: '#0a0907' }}
                />
            </div>
        </div>
    );
}

interface RoomConfig { name: string; capacity: number; priceAdjustment: number; }
interface DepartureConfig { date: string; }

export default function PackageForm() {
    const navigate = useNavigate();
    const { id: editId } = useParams<{ id: string }>();
    const isEdit = Boolean(editId);

    const [loadingMasters, setLoadingMasters] = useState(true);
    const [loadingPackage, setLoadingPackage] = useState(false);
    const [saving, setSaving] = useState(false);

    const [masters, setMasters] = useState({ hotels: [] as any[], airlines: [] as any[], airports: [] as any[] });

    const [form, setForm] = useState({
        name: '', basePrice: '', packageType: '', isPromo: false, serviceType: '', duration: '', description: '',
        makkahHotelId: '', madinahHotelId: '',
        departureAirlineId: '', returnAirlineId: '', departureAirportId: '', arrivalAirportId: '',
        termsConditions: '', requirements: '',
        itinerary: '<ol><li>Persiapan</li><li>...</li></ol>',
        facilities: '<ol><li>Fasilitas 1</li><li>...</li></ol>',
    });

    const [images, setImages] = useState<string[]>(['', '', '', '', '']);
    const [departures, setDepartures] = useState<DepartureConfig[]>([]);
    const [rooms, setRooms] = useState<RoomConfig[]>([]);
    const [mainAirportId, setMainAirportId] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [h, al, ap] = await Promise.all([
                    apiFetch<any>('/api/masters/hotels'),
                    apiFetch<any>('/api/masters/airlines'),
                    apiFetch<any>('/api/masters/airports'),
                ]);
                setMasters({ hotels: h.hotels, airlines: al.airlines, airports: ap.airports });
            } catch { toast.error('Gagal memuat master data.'); }
            finally { setLoadingMasters(false); }
        })();
    }, []);

    useEffect(() => {
        if (!editId) return;
        setLoadingPackage(true);
        apiFetch<{ package: any }>(`/api/packages/${editId}`)
            .then(data => {
                const pkg = data.package;
                if (!pkg) { toast.error('Paket tidak ditemukan'); navigate('/admin/packages'); return; }
                setForm({
                    name: pkg.name || '', basePrice: String(pkg.basePrice || ''), packageType: pkg.packageType || '',
                    isPromo: pkg.isPromo || false, serviceType: pkg.serviceType || '', duration: pkg.duration || '',
                    description: pkg.description || '', makkahHotelId: pkg.makkahHotelId || '', madinahHotelId: pkg.madinahHotelId || '',
                    departureAirlineId: '', returnAirlineId: '', departureAirportId: '', arrivalAirportId: '',
                    termsConditions: pkg.termsConditions || '', requirements: pkg.requirements || '',
                    itinerary: pkg.itinerary || '<ol><li></li></ol>', facilities: pkg.facilities || '<ol><li></li></ol>',
                });
                if (pkg.images) { try { const p = JSON.parse(pkg.images); setImages([...p, ...Array(5 - p.length).fill('')].slice(0, 5)); } catch { } }
                if (pkg.image) { setImages(prev => { const n = [...prev]; n[0] = pkg.image; return n; }); }
            })
            .catch(() => toast.error('Gagal memuat data paket'))
            .finally(() => setLoadingPackage(false));
    }, [editId]);

    const addDeparture = () => setDepartures([...departures, { date: '' }]);
    const removeDeparture = (idx: number) => setDepartures(departures.filter((_, i) => i !== idx));
    const updateDeparture = (idx: number, date: string) => { const nd = [...departures]; nd[idx] = { date }; setDepartures(nd); };

    const addRoom = () => setRooms([...rooms, { name: '', capacity: 4, priceAdjustment: 0 }]);
    const removeRoom = (idx: number) => setRooms(rooms.filter((_, i) => i !== idx));
    const updateRoom = (idx: number, field: string, value: any) => { const nr = [...rooms]; nr[idx] = { ...nr[idx], [field]: value }; setRooms(nr); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.basePrice) { toast.error("Judul dan Harga wajib diisi"); return; }
        setSaving(true);
        try {
            const validImages = images.filter(Boolean);
            const payload: any = {
                name: form.name, basePrice: parseInt(form.basePrice),
                packageType: form.packageType || undefined, isPromo: form.isPromo,
                serviceType: form.serviceType || undefined, duration: form.duration || undefined,
                description: form.description || undefined,
                makkahHotelId: form.makkahHotelId || null, madinahHotelId: form.madinahHotelId || null,
                itinerary: form.itinerary || undefined, facilities: form.facilities || undefined,
                termsConditions: form.termsConditions || undefined, requirements: form.requirements || undefined,
                image: validImages[0] || undefined,
                images: validImages.length > 0 ? JSON.stringify(validImages) : undefined,
                isActive: true,
            };

            let packageId = editId;
            if (isEdit) {
                await apiFetch(`/api/packages/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
                toast.success('Paket berhasil diperbarui!');
            } else {
                const res = await apiFetch<{ package: any }>('/api/packages', { method: 'POST', body: JSON.stringify(payload) });
                packageId = res.package.id;
                toast.success('Paket berhasil dibuat!');
            }

            if (!isEdit && packageId) {
                for (const dep of departures) {
                    if (!dep.date) continue;
                    const airport = masters.airports.find(a => a.id === mainAirportId);
                    try {
                        const depRes = await apiFetch<{ departure: any }>('/api/departures', {
                            method: 'POST',
                            body: JSON.stringify({
                                packageId, departureDate: dep.date, airport: airport?.code || 'TBD', totalSeats: 45,
                                departureAirlineId: form.departureAirlineId || undefined,
                                returnAirlineId: form.returnAirlineId || undefined,
                                departureAirportId: form.departureAirportId || undefined,
                                arrivalAirportId: form.arrivalAirportId || undefined,
                            }),
                        });
                        if (rooms.length > 0 && depRes.departure?.id) {
                            await apiFetch(`/api/departures/${depRes.departure.id}/rooms`, {
                                method: 'POST', body: JSON.stringify(rooms),
                            });
                        }
                    } catch (err) { console.error('Failed to create departure:', err); }
                }
            }
            navigate('/admin/packages');
        } catch (error: any) { toast.error('Gagal menyimpan: ' + error.message); }
        finally { setSaving(false); }
    };

    if (loadingMasters || loadingPackage) {
        return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Memuat data...</div>;
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                        {isEdit ? 'Edit Produk/Layanan' : 'Buat Produk/Layanan'}
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Kelola dan konfigurasi paket perjalanan umroh.</p>
                </div>
                <button onClick={() => navigate('/admin/packages')} style={{
                    padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid #333',
                    color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem',
                }}>← Kembali</button>
            </div>

            <form onSubmit={handleSubmit}>

                {/* ====== GAMBAR ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>image</span>
                        Gambar
                    </h2>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {images.map((img, idx) => (
                            <div key={idx} style={{
                                width: '80px', height: '80px', borderRadius: '0.5rem', overflow: 'hidden',
                                border: img ? '2px solid var(--color-primary)' : '2px dashed #333',
                                background: img ? `url(${img}) center/cover` : '#0a0907',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
                            }} onClick={() => { const url = prompt('URL gambar:', img); if (url !== null) { const ni = [...images]; ni[idx] = url; setImages(ni); } }}>
                                {!img && <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#555' }}>add_photo_alternate</span>}
                                {img && <button type="button" onClick={(e) => { e.stopPropagation(); const ni = [...images]; ni[idx] = ''; setImages(ni); }}
                                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>}
                            </div>
                        ))}
                    </div>
                    <p style={helpStyle}>Klik untuk menambah URL gambar produk</p>
                </div>

                {/* ====== DATA UTAMA ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>edit_note</span>
                        Informasi Paket
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Judul <span style={{ color: '#ef4444' }}>*</span></label>
                            <input placeholder="Umroh Full xxx..." value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
                            <p style={helpStyle}>Berikan nama yang menarik agar jamaah butuh untuk melihat</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Harga <span style={{ color: '#ef4444' }}>*</span></label>
                            <input type="number" placeholder="Contoh: 35000000" value={form.basePrice}
                                onChange={e => setForm({ ...form, basePrice: e.target.value })} style={inputStyle} required />
                            <p style={helpStyle}>Berikan harga yang sesuai dan layanan harga</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Jenis Paket</label>
                                <select value={form.packageType} onChange={e => setForm({ ...form, packageType: e.target.value })} style={selectStyle}>
                                    <option value="">Pilih Jenis Paket</option>
                                    <option value="Bintang 5">Bintang 5</option>
                                    <option value="Bintang 4">Bintang 4</option>
                                    <option value="Bintang 3">Bintang 3</option>
                                    <option value="VIP Premium">VIP Premium</option>
                                    <option value="Reguler">Reguler</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Jenis Layanan</label>
                                <input placeholder="Tentukan jenis layanan" value={form.serviceType}
                                    onChange={e => setForm({ ...form, serviceType: e.target.value })} style={inputStyle} />
                            </div>
                        </div>
                        <div>
                            <label style={labelStyle}>Durasi Perjalanan</label>
                            <input placeholder="Contoh: Selama 12 Hari + Turki" value={form.duration}
                                onChange={e => setForm({ ...form, duration: e.target.value })} style={inputStyle} />
                            <p style={helpStyle}>Tentukan durasi perjalanan</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" id="isPromo" checked={form.isPromo} onChange={e => setForm({ ...form, isPromo: e.target.checked })} />
                            <label htmlFor="isPromo" style={{ fontSize: '0.875rem', color: '#888', cursor: 'pointer' }}>Ceklist jika paket ada promo</label>
                        </div>
                    </div>
                </div>

                {/* ====== KEBERANGKATAN ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>flight_takeoff</span>
                        Setup Keberangkatan
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Tanggal Keberangkatan</label>
                            {departures.map((dep, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input type="date" value={dep.date} onChange={e => updateDeparture(idx, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                    <button type="button" onClick={() => removeDeparture(idx)} style={{ padding: '0.875rem', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                                    </button>
                                </div>
                            ))}
                            <button type="button" onClick={addDeparture} style={{
                                padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8125rem', marginTop: '0.25rem',
                            }}>+ Tambah</button>
                            <p style={helpStyle}>Tentukan tanggal keberangkatan</p>
                        </div>
                        <div>
                            <label style={labelStyle}>Bandara Keberangkatan</label>
                            <select value={mainAirportId} onChange={e => setMainAirportId(e.target.value)} style={selectStyle}>
                                <option value="">Pilih bandara keberangkatan pilihan</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                            <p style={helpStyle}>Tentukan bandara paling sesuai pilihan</p>
                        </div>
                    </div>
                </div>

                {/* ====== TRANSPORTASI ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>flight</span>
                        Setup Transportasi
                    </h2>
                    <p style={{ ...helpStyle, marginTop: '-0.75rem', marginBottom: '1rem' }}>Tentukan maskapai sebagai transportasi utama untuk dalam setiap paket layanan</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Pesawat Keberangkatan</label>
                            <select value={form.departureAirlineId} onChange={e => setForm({ ...form, departureAirlineId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Pesawat Kepulangan</label>
                            <select value={form.returnAirlineId} onChange={e => setForm({ ...form, returnAirlineId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Pesawat</option>
                                {masters.airlines.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Bandara Keberangkatan</label>
                            <select value={form.departureAirportId} onChange={e => setForm({ ...form, departureAirportId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Bandara Kedatangan</label>
                            <select value={form.arrivalAirportId} onChange={e => setForm({ ...form, arrivalAirportId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Bandara</option>
                                {masters.airports.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== HOTEL ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>hotel</span>
                        Setup Data Hotel
                    </h2>
                    <p style={{ ...helpStyle, marginTop: '-0.75rem', marginBottom: '1rem' }}>Berikan data hotel sebagai referensi dari kontrak layanan</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Hotel Makkah</label>
                            <select value={form.makkahHotelId} onChange={e => setForm({ ...form, makkahHotelId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Hotel Madinah</label>
                            <select value={form.madinahHotelId} onChange={e => setForm({ ...form, madinahHotelId: e.target.value })} style={selectStyle}>
                                <option value="">Pilih Hotel</option>
                                {masters.hotels.map(h => <option key={h.id} value={h.id}>{h.name} (Bintang {h.starRating})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ====== KAMAR ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>bed</span>
                        Setup Data Kamar
                    </h2>
                    <p style={{ ...helpStyle, marginTop: '-0.75rem', marginBottom: '1rem' }}>Berikan data kamar yang ditampilkan</p>

                    {rooms.map((room, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'end' }}>
                            <div>
                                <label style={labelStyle}>Kapasitas Kamar</label>
                                <select value={room.name || ''} onChange={e => updateRoom(idx, 'name', e.target.value)} style={selectStyle}>
                                    <option value="">Pilih kapasitas</option>
                                    <option value="Quad">Quad (4 Orang)</option>
                                    <option value="Triple">Triple (3 Orang)</option>
                                    <option value="Double">Double (2 Orang)</option>
                                    <option value="Single">Single (1 Orang)</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Harga</label>
                                <input type="number" placeholder="15000000" value={room.priceAdjustment || ''}
                                    onChange={e => updateRoom(idx, 'priceAdjustment', parseInt(e.target.value) || 0)} style={inputStyle} />
                            </div>
                            <button type="button" onClick={() => removeRoom(idx)} style={{ padding: '0.875rem', color: 'var(--color-error)', background: 'rgba(239,68,68,0.1)', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', display: 'block' }}>delete</span>
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={addRoom} style={{
                        width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed #333',
                        borderRadius: '0.5rem', color: '#888', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600,
                    }}>Tambahkan spesifikasi kamar</button>
                </div>

                {/* ====== DESKRIPSI ====== */}
                <div style={cardStyle}>
                    <h2 style={sectionTitleStyle}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>description</span>
                        Deskripsi Produk
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Deskripsi</label>
                            <textarea rows={4} value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                                style={{ ...inputStyle, resize: 'vertical' as any }}
                                placeholder="Berikan deskripsi mengenai produk layanan anda..." />
                        </div>
                    </div>
                </div>

                {/* ====== ITINERARY ====== */}
                <div style={cardStyle}>
                    <RichTextEditor id="itinerary-editor" label="Itinerary" value={form.itinerary} onChange={v => setForm(f => ({ ...f, itinerary: v }))} />
                </div>

                {/* ====== FASILITAS ====== */}
                <div style={cardStyle}>
                    <RichTextEditor id="facilities-editor" label="Fasilitas" value={form.facilities} onChange={v => setForm(f => ({ ...f, facilities: v }))} />
                </div>

                {/* ====== PERSYARATAN ====== */}
                <div style={cardStyle}>
                    <RichTextEditor id="requirements-editor" label="Persyaratan" value={form.requirements} onChange={v => setForm(f => ({ ...f, requirements: v }))} />
                </div>

                {/* ====== SYARAT & KONDISI ====== */}
                <div style={cardStyle}>
                    <RichTextEditor id="terms-editor" label="Syarat & Kondisi" value={form.termsConditions} onChange={v => setForm(f => ({ ...f, termsConditions: v }))} />
                </div>

                {/* ====== SUBMIT ====== */}
                <button type="submit" disabled={saving} style={{
                    width: '100%', marginBottom: '3rem', padding: '1rem', background: 'var(--color-primary)',
                    color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    fontSize: '1rem', opacity: saving ? 0.7 : 1,
                }}>
                    {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Data'}
                </button>

            </form>
        </div>
    );
}
