import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { apiFetch } from '../../lib/api';

interface StepProductProps {
    packageId: string;
}

const StepProduct: React.FC<StepProductProps> = ({ packageId }) => {
    const { register, setValue, watch } = useFormContext();
    const [departures, setDepartures] = useState<any[]>([]);
    const [roomTypes, setRoomTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const selectedDepartureId = watch('departureId');

    useEffect(() => {
        const fetchDepartures = async () => {
            try {
                const data = await apiFetch(`/api/departures?packageId=${packageId}`);
                setDepartures(data.departures || []);
                if (data.departures?.length > 0) {
                    setValue('departureId', data.departures[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch departures:', error);
            } finally {
                setLoading(false);
            }
        };
        if (packageId) fetchDepartures();
    }, [packageId, setValue]);

    useEffect(() => {
        const fetchRooms = async () => {
            if (!selectedDepartureId) return;
            try {
                const data = await apiFetch(`/api/departures/${selectedDepartureId}`);
                setRoomTypes(data.departure.roomTypes || []);
                if (data.departure.roomTypes?.length > 0) {
                    setValue('roomTypeId', data.departure.roomTypes[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch room types:', error);
            }
        };
        fetchRooms();
    }, [selectedDepartureId, setValue]);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Keberangkatan</h2>
                <p className="text-sm text-gray-500">Tentukan tanggal dan kota keberangkatan Anda.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                    <div className="col-span-2 h-20 bg-gray-50 animate-pulse rounded-xl"></div>
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
                            <p className="text-xs text-gray-500">Status: {dep.status}</p>
                        </label>
                    ))
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Pilih Tipe Kamar</h2>
                <p className="text-sm text-gray-500">Kapasitas kamar mempengaruhi harga per paket.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roomTypes.map((room) => (
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
                ))}
            </div>
        </div>
    );
};

export default StepProduct;
