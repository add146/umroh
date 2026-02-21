import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { apiFetch } from '../../lib/api';

interface StepReviewProps {
    isLoading: boolean;
}

const StepReview: React.FC<StepReviewProps> = ({ isLoading }) => {
    const { watch } = useFormContext();
    const data = watch();
    const [priceDetails, setPriceDetails] = useState<{ basePrice: number, roomAdjustment: number, total: number, packageName: string, roomName: string } | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!data.departureId || !data.roomTypeId) return;
            try {
                const response = await apiFetch(`/api/departures/${data.departureId}`);
                if (response.departure && response.departure.package) {
                    const room = (response.departure.roomTypes || response.roomTypes || []).find((r: any) => r.id === data.roomTypeId);
                    if (room) {
                        const basePrice = response.departure.package.basePrice || 0;
                        const adjustment = room.priceAdjustment || 0;
                        setPriceDetails({
                            basePrice,
                            roomAdjustment: adjustment,
                            total: basePrice + adjustment,
                            packageName: response.departure.package.name,
                            roomName: room.name
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to fetch price details:", error);
            }
        };
        fetchDetails();
    }, [data.departureId, data.roomTypeId]);

    const SummaryItem = ({ label, value }: { label: string; value: string | boolean | undefined }) => (
        <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
            <span className="text-sm font-bold text-gray-900 text-right">{value?.toString() || '-'}</span>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-black text-gray-900 mb-2">Review Pendaftaran</h2>
                <p className="text-sm text-gray-500">Silakan periksa kembali seluruh data sebelum menekan tombol Daftar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl">
                        <h3 className="text-sm font-black text-brand-primary mb-4 border-b pb-2 uppercase tracking-tighter">IDENTITAS UTAMA</h3>
                        <SummaryItem label="Nama Lengkap" value={data.pilgrim?.name} />
                        <SummaryItem label="No. KTP" value={data.pilgrim?.noKtp} />
                        <SummaryItem label="Tgl Lahir" value={data.pilgrim?.born} />
                        <SummaryItem label="Pekerjaan" value={data.pilgrim?.work} />
                    </div>

                    <div className="bg-gray-50 p-6 rounded-2xl">
                        <h3 className="text-sm font-black text-brand-primary mb-4 border-b pb-2 uppercase tracking-tighter">KONTAK & DARURAT</h3>
                        <SummaryItem label="No. WhatsApp" value={data.pilgrim?.phone} />
                        <SummaryItem label="Darurat" value={data.pilgrim?.famContactName} />
                        <SummaryItem label="HP Darurat" value={data.pilgrim?.famContact} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-brand-secondary/30">
                        <h3 className="text-sm font-black text-brand-primary mb-4 border-b pb-2 uppercase tracking-tighter">RINCIAN PAKET</h3>
                        <SummaryItem label="Paket" value={priceDetails?.packageName || 'Memuat...'} />
                        <SummaryItem label="Pilihan Kamar" value={priceDetails?.roomName || 'Memuat...'} />
                        <SummaryItem label="Status Paspor" value={data.pilgrim?.hasPassport ? 'Sudah Ada' : 'Belum Ada'} />
                    </div>

                    <div className="p-6 rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/20">
                        {priceDetails ? (
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-white/80 text-sm">
                                    <span>Harga Dasar</span>
                                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceDetails.basePrice)}</span>
                                </div>
                                <div className="flex justify-between text-white/80 text-sm border-b border-white/20 pb-3">
                                    <span>Penyesuaian Kamar</span>
                                    <span>{priceDetails.roomAdjustment >= 0 ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(priceDetails.roomAdjustment))}</span>
                                </div>
                                <div className="flex justify-between items-end font-bold text-lg pt-1">
                                    <span>Total Tagihan</span>
                                    <span className="text-2xl text-brand-secondary">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceDetails.total)}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] font-bold text-white/60 uppercase mb-4">Memuat rincian harga...</p>
                        )}
                        <div className="flex justify-between items-center text-sm font-medium opacity-90 border-t border-white/20 pt-4 mt-2">
                            <span>Lanjutkan Pembayaran di Tahap Berikutnya</span>
                            <span>➔</span>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-[10px] text-yellow-700 leading-relaxed italic">
                        * Dengan menekan tombol daftar, Anda menyetujui seluruh syarat dan ketentuan perjalanan yang berlaku di Al Madinah Umroh.
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-brand-primary">Sedang Memproses Booking...</p>
                </div>
            )}
        </div>
    );
};

export default StepReview;
