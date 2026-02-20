import { useFormContext } from 'react-hook-form';
import OCRUpload from './OCRUpload';

const StepPassport: React.FC = () => {
    const { register, watch, setValue } = useFormContext();
    const hasPassport = watch('pilgrim.hasPassport');

    const handleOCRSuccess = (data: any) => {
        if (data.passportNo) setValue('pilgrim.noPassport', data.passportNo);
        if (data.issuingOffice) setValue('pilgrim.passportFrom', data.issuingOffice);
        if (data.expiryDate) setValue('pilgrim.passportExpiry', data.expiryDate);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Data Paspor</h2>
                    <p className="text-sm text-gray-500">Kosongkan jika Anda belum memiliki paspor.</p>
                </div>
                <div className="flex items-center gap-4">
                    {hasPassport && <OCRUpload docType="passport" onSuccess={handleOCRSuccess} />}
                    <div className="flex items-center bg-gray-50 p-3 rounded-2xl border">
                        <span className="text-xs font-bold text-gray-400 mr-3">SUDAH PUNYA PASPOR?</span>
                        <input
                            type="checkbox"
                            {...register('pilgrim.hasPassport')}
                            className="w-6 h-6 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                        />
                    </div>
                </div>
            </div>

            {hasPassport && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor Paspor</label>
                        <input
                            type="text"
                            {...register('pilgrim.noPassport')}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                            placeholder="e.g. A 1234567"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kantor Imigrasi (Dikeluarkan di)</label>
                        <input
                            type="text"
                            {...register('pilgrim.passportFrom')}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                            placeholder="Jakarta Selatan, Surabaya, dsb"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Pengeluaran</label>
                        <input
                            type="date"
                            {...register('pilgrim.passportReleaseDate')}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Habis Berlaku</label>
                        <input
                            type="date"
                            {...register('pilgrim.passportExpiry')}
                            className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        />
                    </div>
                </div>
            )}

            {!hasPassport && (
                <div className="p-8 border-2 border-dashed rounded-2xl text-center bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Anda memilih opsi <strong>Belum Memiliki Paspor</strong>.</p>
                    <p className="text-xs text-gray-400">Anda tetap dapat melanjutkan pendaftaran. Pengurusan paspor dapat dibantu oleh tim kami setelah booking selesai.</p>
                </div>
            )}
        </div>
    );
};

export default StepPassport;
