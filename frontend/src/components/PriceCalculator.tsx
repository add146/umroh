import React, { useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface PackageOption {
    id: string;
    name: string;
    basePrice: number;
    dpAmount: number;
}

interface DepartureOption {
    id: string;
    departureDate: string;
    airport: string;
    tripName?: string;
    totalSeats: number;
    bookedSeats: number;
}

interface RoomOption {
    id: string;
    name: string;
    priceAdjustment: number;
}

interface CalcResult {
    pricePerPax: number;
    totalPrice: number;
    pax: number;
    dpPerPax: number;
    totalDp: number;
    remainingBalance: number;
    installments: { term: number; amount: number; dueDate: string }[];
}

const formatRupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

export const PriceCalculator: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [packages, setPackages] = useState<PackageOption[]>([]);
    const [departures, setDepartures] = useState<DepartureOption[]>([]);
    const [rooms, setRooms] = useState<RoomOption[]>([]);

    const [selectedPackage, setSelectedPackage] = useState('');
    const [selectedDeparture, setSelectedDeparture] = useState('');
    const [selectedRoom, setSelectedRoom] = useState('');
    const [pax, setPax] = useState(1);

    const [result, setResult] = useState<CalcResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch packages once
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const res = await apiFetch('/api/packages');
                if (res.ok) {
                    const data = await res.json();
                    setPackages(data.packages || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchPackages();
    }, []);

    // Fetch departures when package changes
    useEffect(() => {
        if (!selectedPackage) { setDepartures([]); return; }
        const fetchDepartures = async () => {
            try {
                const res = await apiFetch(`/api/departures?packageId=${selectedPackage}`);
                if (res.ok) {
                    const data = await res.json();
                    setDepartures(data.departures || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchDepartures();
        setSelectedDeparture('');
        setSelectedRoom('');
        setResult(null);
    }, [selectedPackage]);

    // Fetch rooms when departure changes
    useEffect(() => {
        if (!selectedDeparture) { setRooms([]); return; }
        const fetchRooms = async () => {
            try {
                const res = await apiFetch(`/api/departures/${selectedDeparture}/rooms`);
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data.roomTypes || data.rooms || []);
                }
            } catch (e) { console.error(e); }
        };
        fetchRooms();
        setSelectedRoom('');
        setResult(null);
    }, [selectedDeparture]);

    const handleCalculate = async () => {
        if (!selectedPackage || !selectedDeparture || !selectedRoom) {
            setError('Lengkapi semua pilihan terlebih dahulu');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const res = await apiFetch('/api/price-calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    packageId: selectedPackage,
                    departureId: selectedDeparture,
                    roomTypeId: selectedRoom,
                    pax
                })
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                setError('Gagal menghitung harga');
            }
        } catch (e) {
            console.error(e);
            setError('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const handleShareWA = () => {
        if (!result) return;
        const pkg = packages.find(p => p.id === selectedPackage);
        const dep = departures.find(d => d.id === selectedDeparture);
        const room = rooms.find(r => r.id === selectedRoom);

        const text = `🕋 *Simulasi Harga Umroh*\n\n` +
            `📦 Paket: ${pkg?.name || '-'}\n` +
            `📅 Keberangkatan: ${dep?.departureDate || '-'}\n` +
            `🛏️ Tipe Kamar: ${room?.name || '-'}\n` +
            `👥 Jumlah: ${pax} Pax\n\n` +
            `💰 *Harga per Pax: ${formatRupiah(result.pricePerPax)}*\n` +
            `💰 *Total: ${formatRupiah(result.totalPrice)}*\n\n` +
            `📝 Skema Pembayaran:\n` +
            `• DP: ${formatRupiah(result.totalDp)}\n` +
            result.installments.map(i => `• Cicilan ${i.term}: ${formatRupiah(i.amount)} (jatuh tempo: ${i.dueDate})`).join('\n') +
            `\n\nHubungi saya untuk pendaftaran! 🤝`;

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const selectStyle: React.CSSProperties = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontSize: '0.9rem'
    };

    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>calculate</span>
                    Kalkulator Harga
                </h2>
                {onClose && (
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Package */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Paket</label>
                    <select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} style={selectStyle}>
                        <option value="">— Pilih Paket —</option>
                        {packages.map(p => (
                            <option key={p.id} value={p.id}>{p.name} — {formatRupiah(p.basePrice)}</option>
                        ))}
                    </select>
                </div>

                {/* Departure */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Keberangkatan</label>
                    <select value={selectedDeparture} onChange={e => setSelectedDeparture(e.target.value)} style={selectStyle} disabled={!selectedPackage}>
                        <option value="">— Pilih Batch —</option>
                        {departures.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.tripName || d.departureDate} — {d.airport} (Sisa {d.totalSeats - d.bookedSeats} seat)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Room */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tipe Kamar</label>
                    <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={selectStyle} disabled={!selectedDeparture}>
                        <option value="">— Pilih Kamar —</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id}>
                                {r.name} {r.priceAdjustment > 0 ? `(+${formatRupiah(r.priceAdjustment)})` : r.priceAdjustment < 0 ? `(${formatRupiah(r.priceAdjustment)})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Pax Stepper */}
                <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.25rem' }}>Jumlah Pax</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={() => setPax(Math.max(1, pax - 1))}
                            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >−</button>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, minWidth: '2rem', textAlign: 'center' }}>{pax}</span>
                        <button
                            onClick={() => setPax(pax + 1)}
                            style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >+</button>
                    </div>
                </div>

                {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

                <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 600 }}
                >
                    {loading ? 'Menghitung...' : 'Hitung Harga'}
                </button>
            </div>

            {/* Result */}
            {result && (
                <div style={{ marginTop: '1.5rem', background: 'var(--color-bg)', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>receipt_long</span>
                        Hasil Simulasi
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Harga/Pax</span>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{formatRupiah(result.pricePerPax)}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total ({result.pax} pax)</span>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{formatRupiah(result.totalPrice)}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>DP (Down Payment)</span>
                            <p style={{ margin: 0, fontWeight: 700 }}>{formatRupiah(result.totalDp)}</p>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sisa Pelunasan</span>
                            <p style={{ margin: 0, fontWeight: 700 }}>{formatRupiah(result.remainingBalance)}</p>
                        </div>
                    </div>

                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Skema Cicilan (3x)</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.installments.map(inst => (
                            <div key={inst.term} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--color-bg-card)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                <span style={{ fontSize: '0.85rem' }}>Cicilan {inst.term}</span>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontWeight: 600 }}>{formatRupiah(inst.amount)}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>s/d {inst.dueDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Share WA button */}
                    <button
                        onClick={handleShareWA}
                        style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>share</span>
                        Share ke WhatsApp
                    </button>
                </div>
            )}
        </div>
    );
};
