import React from 'react';
import KuotaBar from './KuotaBar';

interface PackageCardProps {
    id: string;
    name: string;
    description?: string;
    basePrice: number;
    image?: string;
    departureDate?: string;
    totalSeats?: number;
    bookedSeats?: number;
    onBook?: (id: string) => void;
}

const PackageCard: React.FC<PackageCardProps> = ({
    id,
    name,
    description,
    basePrice,
    image,
    departureDate,
    totalSeats,
    bookedSeats,
    onBook
}) => {
    const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(basePrice);

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col h-full">
            <div className="relative h-48 bg-gray-200">
                {image ? (
                    <img src={image} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-brand-secondary text-brand-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                    BEST SELLER
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{name}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{description}</p>

                {departureDate && (
                    <div className="flex items-center text-xs text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                        <span className="mr-2">📅</span>
                        <span>Berangkat: <strong>{new Date(departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                    </div>
                )}

                <div className="mt-auto">
                    {totalSeats !== undefined && bookedSeats !== undefined && (
                        <div className="mb-4">
                            <KuotaBar total={totalSeats} booked={bookedSeats} />
                        </div>
                    )}

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Mulai dari</p>
                            <p className="text-xl font-black text-brand-primary">{formattedPrice}</p>
                        </div>
                        <button
                            onClick={() => onBook?.(id)}
                            disabled={totalSeats !== undefined && bookedSeats !== undefined && bookedSeats >= totalSeats}
                            className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
                        >
                            Daftar Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageCard;
