import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { apiFetch } from '../../lib/api';

interface StepProductProps {
    packageId?: string;
}

const StepProduct: React.FC<StepProductProps> = ({ packageId: initialPackageId }) => {
    const { register, setValue, watch } = useFormContext();
    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || '');
    const [departures, setDepartures] = useState<any[]>([]);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const [loadingPackages, setLoadingPackages] = useState(true);
    const [loadingDepartures, setLoadingDepartures] = useState(false);

    const selectedDepartureId = watch('departureId');

    // Fetch packages
    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await apiFetch('/api/packages');
                setPackages(data.packages || []);
                if (!initialPackageId && data.packages?.length > 0) {
                    setSelectedPackageId(data.packages[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch packages:', error);
            } finally {
                setLoadingPackages(false);
            }
        };
        fetchPackages();
    }, [initialPackageId]);

    // Fetch departures when package changes
    useEffect(() => {
        const fetchDepartures = async () => {
            if (!selectedPackageId) {
                setDepartures([]);
                return;
            }
            setLoadingDepartures(true);
            try {
                const data = await apiFetch(`/api/departures?packageId=${selectedPackageId}`);
                setDepartures(data.departures || []);
                if (data.departures?.length > 0) {
                    setValue('departureId', data.departures[0].id);
                } else {
                    setValue('departureId', '');
                    setRoomTypes([]);
                }
            } catch (error) {
                console.error('Failed to fetch departures:', error);
            } finally {
                setLoadingDepartures(false);
            }
        };
        fetchDepartures();
    }, [selectedPackageId, setValue]);

    // Fetch rooms when departure changes
    useEffect(() => {
        const fetchRooms = async () => {
            if (!selectedDepartureId) {
                setRoomTypes([]);
                return;
            }
            try {
                const data = await apiFetch(`/api/departures/${selectedDepartureId}`);
                setRoomTypes(data.departure?.roomTypes || data.roomTypes || []);
                if (data.departure?.roomTypes?.length > 0) {
                    setValue('roomTypeId', data.departure.roomTypes[0].id);
                } else if (data.roomTypes?.length > 0) {
                    setValue('roomTypeId', data.roomTypes[0].id);
                } else {
                    setValue('roomTypeId', '');
                }
            } catch (error) {
                console.error('Failed to fetch room types:', error);
            }
        };
        fetchRooms();
    }, [selectedDepartureId, setValue]);

    return (
        <div className="space-y-8">
            {/* Package Selection */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Produk / Paket</h2>
                <p className="text-sm text-gray-500 mb-3">Pilih paket umroh atau haji yang Anda inginkan.</p>
                {loadingPackages ? (
                    <div className="h-12 bg-gray-50 animate-pulse rounded-xl w-full"></div>
                ) : (
                    <select
                        value={selectedPackageId}
                        onChange={(e) => setSelectedPackageId(e.target.value)}
                        className="w-full p-4 border-2 border-gray-100 rounded-xl focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all appearance-none cursor-pointer text-gray-900 font-medium"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 1rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em'
                        }}
                    >
                        <option value="" disabled>-- Pilih Paket --</option>
                        {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                                {pkg.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Keberangkatan</h2>
                <p className="text-sm text-gray-500">Tentukan tanggal dan kota keberangkatan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loadingDepartures ? (
                    <div className="col-span-2 h-20 bg-gray-50 animate-pulse rounded-xl"></div>
                ) : departures.length === 0 ? (
                    <div className="col-span-2 p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                        {selectedPackageId ? 'Tidak ada jadwal keberangkatan untuk paket ini.' : 'Pilih paket terlebih dahulu.'}
                    </div>
                ) : (
                    departures.map((dep) => (
                        <label
                            key={dep.id}
                            className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedDepartureId === dep.id ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <input
                                type="radio"
                                value={dep.id}
                                {...register('departureId')}
                                className="sr-only"
                            />
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-bold text-gray-900">
                                    {new Date(dep.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="bg-gray-200 text-[10px] px-2 py-0.5 rounded font-black">{dep.airport}</span>
                            </div>
                            <p className="text-xs text-gray-500">Status: {dep.status === 'full' ? 'Penuh' : 'Tersedia'}</p>
                        </label>
                    ))
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Tipe Kamar</h2>
                <p className="text-sm text-gray-500">Kapasitas kamar mempengaruhi harga per paket.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roomTypes.length === 0 ? (
                    <div className="col-span-3 p-4 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                        Pilih jadwal keberangkatan terlebih dahulu.
                    </div>
                ) : (
                    roomTypes.map((room) => (
                        <label
                            key={room.id}
                            className={`flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all ${watch('roomTypeId') === room.id ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-100 hover:border-gray-200'}`}
                        >
                            <input
                                type="radio"
                                value={room.id}
                                {...register('roomTypeId')}
                                className="sr-only"
                            />
                            <span className="text-sm font-bold text-gray-900 mb-1">{room.name}</span>
                            <span className="text-xs text-gray-500 mb-3">{room.capacity} Pax Per Kamar</span>
                            <span className="text-brand-primary font-black">
                                {room.priceAdjustment >= 0 ? '+' : '-'}
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(room.priceAdjustment))}
                            </span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
};

export default StepProduct;
