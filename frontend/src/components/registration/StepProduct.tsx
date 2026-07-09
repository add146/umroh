import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../lib/api';

interface StepProductProps { packageId?: string; }

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const sectionTitle: React.CSSProperties = { fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' };
const sectionDesc: React.CSSProperties = { fontSize: '0.8125rem', color: '#888', margin: '0 0 0.75rem 0' };

const StepProduct: React.FC<StepProductProps> = ({ packageId: initialPackageId }) => {
    const { register, setValue, watch } = useFormContext();
    const [searchParams] = useSearchParams();
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || '');
    const [departures, setDepartures] = useState<any[]>([]);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const [boardingPoints, setBoardingPoints] = useState<any[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [loadingDepartures, setLoadingDepartures] = useState(false);
    const selectedDepartureId = watch('departureId');

    const initialDepartureId = searchParams.get('departure') || '';
    const initialRoomTypeId = searchParams.get('roomType') || '';
    const initialBoardingPointId = searchParams.get('boardingPoint') || '';

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await apiFetch('/api/packages');
                setPackages(data.packages || []);
                if (!initialPackageId && data.packages?.length > 0) setSelectedPackageId(data.packages[0].id);
            } catch (error) { console.error('Failed to fetch packages:', error); }
            finally { setLoadingPackages(false); }
        };
        fetchPackages();
    }, [initialPackageId]);

    useEffect(() => {
        const fetchDepartures = async () => {
            if (!selectedPackageId) { setDepartures([]); return; }
            setLoadingDepartures(true);
            try {
                const data = await apiFetch(`/api/departures?packageId=${selectedPackageId}`);
                setDepartures(data.departures || []);
                if (data.departures?.length > 0) {
                    const matchedDepId = data.departures.some((d: any) => d.id === initialDepartureId)
                        ? initialDepartureId
                        : data.departures[0].id;
                    setValue('departureId', matchedDepId);
                } else {
                    setValue('departureId', '');
                    setRoomTypes([]);
                    setBoardingPoints([]);
                }
            } catch (error) { console.error('Failed to fetch departures:', error); }
            finally { setLoadingDepartures(false); }
        };
        fetchDepartures();
    }, [selectedPackageId, setValue, initialDepartureId]);

    useEffect(() => {
        const fetchRoomsAndBoardingPoints = async () => {
            if (!selectedDepartureId) { 
                setRoomTypes([]); 
                setBoardingPoints([]); 
                return; 
            }
            try {
                const data = await apiFetch(`/api/departures/${selectedDepartureId}`);
                const dep = data.departure;
                setRoomTypes(dep?.roomTypes || data.roomTypes || []);
                setBoardingPoints(dep?.boardingPoints || []);
                
                // Prefill room type
                if (dep?.roomTypes?.length > 0) {
                    const matchedRoom = dep.roomTypes.some((r: any) => r.id === initialRoomTypeId)
                        ? initialRoomTypeId
                        : dep.roomTypes[0].id;
                    setValue('roomTypeId', matchedRoom);
                } else {
                    setValue('roomTypeId', '');
                }

                // Prefill boarding point
                if (dep?.boardingPoints?.length > 0) {
                    const matchedBp = dep.boardingPoints.some((b: any) => b.id === initialBoardingPointId)
                        ? initialBoardingPointId
                        : (dep.boardingPoints.find((b: any) => b.isOrigin)?.id || dep.boardingPoints[0].id);
                    setValue('boardingPointId', matchedBp);
                } else {
                    setValue('boardingPointId', '');
                }
            } catch (error) { console.error('Failed to fetch room types / boarding points:', error); }
        };
        fetchRoomsAndBoardingPoints();
    }, [selectedDepartureId, setValue, initialRoomTypeId, initialBoardingPointId]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Package Selection */}
            <div>
                <h2 style={sectionTitle}>Pilih Produk / Paket</h2>
                <p style={sectionDesc}>Pilih paket umroh atau haji yang Anda inginkan.</p>
                {loadingPackages ? (
                    <div style={{ height: '48px', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }} />
                ) : (
                    <select value={selectedPackageId} onChange={(e) => setSelectedPackageId(e.target.value)} style={inputStyle}>
                        <option value="" disabled>-- Pilih Paket --</option>
                        {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
                    </select>
                )}
            </div>

            {/* Departures */}
            <div>
                <h2 style={sectionTitle}>Pilih Keberangkatan</h2>
                <p style={sectionDesc}>Tentukan tanggal dan kota keberangkatan Anda.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {loadingDepartures ? (
                        <div style={{ gridColumn: '1 / -1', height: '80px', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }} />
                    ) : departures.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'center', color: '#888', border: '2px dashed #333', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            {selectedPackageId ? 'Tidak ada jadwal keberangkatan untuk paket ini.' : 'Pilih paket terlebih dahulu.'}
                        </div>
                    ) : (
                        departures.map((dep) => (
                            <label key={dep.id} style={{
                                display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                                border: selectedDepartureId === dep.id ? '2px solid var(--color-primary)' : '2px solid #333',
                                background: selectedDepartureId === dep.id ? 'var(--color-primary-bg)' : '#0a0907',
                            }}>
                                <input type="radio" value={dep.id} {...register('departureId')} style={{ display: 'none' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
                                        {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontWeight: 700, color: '#ccc' }}>{dep.airport}</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>Status: {dep.status === 'full' ? 'Penuh' : 'Tersedia'}</p>
                            </label>
                        ))
                    )}
                </div>
            </div>

            {/* Boarding Points */}
            {boardingPoints.length > 1 && (
                <div>
                    <h2 style={sectionTitle}>Pilih Kota Keberangkatan</h2>
                    <p style={sectionDesc}>Tentukan bandara asal / transit keberangkatan Anda.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {boardingPoints
                            .slice()
                            .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                            .map((bp) => (
                                <label key={bp.id} style={{
                                    display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                                    border: watch('boardingPointId') === bp.id ? '2px solid var(--color-primary)' : '2px solid #333',
                                    background: watch('boardingPointId') === bp.id ? 'var(--color-primary-bg)' : '#0a0907',
                                }}>
                                    <input type="radio" value={bp.id} {...register('boardingPointId')} style={{ display: 'none' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>
                                            {bp.airport?.city} ({bp.airport?.code})
                                        </span>
                                        <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', fontWeight: 700, color: '#ccc' }}>
                                            {bp.isOrigin ? 'Asal' : 'Transit'}
                                        </span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.8125rem' }}>
                                        {bp.priceAdjustment === 0 
                                            ? 'Tipe Base' 
                                            : bp.priceAdjustment > 0 
                                                ? `+ Rp ${new Intl.NumberFormat('id-ID').format(bp.priceAdjustment)}` 
                                                : `- Rp ${new Intl.NumberFormat('id-ID').format(Math.abs(bp.priceAdjustment))}`
                                        }
                                    </span>
                                    {bp.notes && <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0.25rem 0 0 0' }}>{bp.notes}</p>}
                                </label>
                            ))}
                    </div>
                </div>
            )}

            {/* Room Types */}
            <div>
                <h2 style={sectionTitle}>Pilih Tipe Kamar</h2>
                <p style={sectionDesc}>Kapasitas kamar mempengaruhi harga per paket.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {roomTypes.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', padding: '1rem', textAlign: 'center', color: '#888', border: '2px dashed #333', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                            Pilih jadwal keberangkatan terlebih dahulu.
                        </div>
                    ) : (
                        roomTypes.map((room) => (
                            <label key={room.id} style={{
                                display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                                border: watch('roomTypeId') === room.id ? '2px solid var(--color-primary)' : '2px solid #333',
                                background: watch('roomTypeId') === room.id ? 'var(--color-primary-bg)' : '#0a0907',
                            }}>
                                <input type="radio" value={room.id} {...register('roomTypeId')} style={{ display: 'none' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>{room.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.5rem' }}>{room.capacity} Pax Per Kamar</span>
                                <span style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                                    {room.priceAdjustment >= 0 ? '+' : '-'}
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(room.priceAdjustment))}
                                </span>
                            </label>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StepProduct;
