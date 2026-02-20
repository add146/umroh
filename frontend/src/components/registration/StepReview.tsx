import React from 'react';
import { useFormContext } from 'react-hook-form';

interface StepReviewProps {
    isLoading: boolean;
}

const StepReview: React.FC<StepReviewProps> = ({ isLoading }) => {
    const { watch } = useFormContext();
    const data = watch();

    const SummaryItem = ({ label, value }: { label: string; value: string | boolean | undefined }) => (
        <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 uppercase font-bold">{label}</span>
            <span className="text-sm font-bold text-gray-900">{value?.toString() || '-'}</span>
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
                        <SummaryItem label="ID Keberangkatan" value={data.departureId?.split('-')[0] + '...'} />
                        <SummaryItem label="Status Paspor" value={data.pilgrim?.hasPassport ? 'Sudah Ada' : 'Belum Ada'} />
                    </div>

                    <div className="p-6 rounded-2xl bg-brand-primary text-white shadow-xl shadow-brand-primary/20">
                        <p className="text-[10px] font-bold text-white/60 uppercase mb-1">Total yang harus dibayar akan muncul di halaman berikutnya</p>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">Lanjutkan Pendaftaran</span>
                            <span className="text-2xl text-brand-secondary">➔</span>
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
