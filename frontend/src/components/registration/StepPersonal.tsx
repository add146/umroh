import { useFormContext } from 'react-hook-form';
import OCRUpload from './OCRUpload';

const StepPersonal: React.FC = () => {
    const { register, setValue, formState: { errors } } = useFormContext();

    const handleOCRSuccess = (data: any) => {
        if (data.name) setValue('pilgrim.name', data.name);
        if (data.nik) setValue('pilgrim.noKtp', data.nik);
        if (data.born) setValue('pilgrim.born', data.born);
        if (data.address) setValue('pilgrim.address', data.address);
        if (data.fatherName) setValue('pilgrim.fatherName', data.fatherName);
        if (data.sex) setValue('pilgrim.sex', data.sex === 'L' ? 'L' : 'P');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Data Pribadi</h2>
                    <p className="text-sm text-gray-500">Pastikan data sesuai dengan KTP Anda.</p>
                </div>
                <div className="w-64">
                    <OCRUpload docType="ktp" onSuccess={handleOCRSuccess} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Lengkap (Sesuai KTP)</label>
                    <input
                        type="text"
                        {...register('pilgrim.name')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="Contoh: Ahmad Subagyo"
                    />
                    {errors.pilgrim && (errors.pilgrim as any).name && (
                        <p className="text-red-500 text-[10px] mt-1">{(errors.pilgrim as any).name.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor KTP (NIK)</label>
                    <input
                        type="text"
                        {...register('pilgrim.noKtp')}
                        maxLength={16}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="16 Digit NIK"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                    <div className="flex gap-4 h-[54px]">
                        <label className="flex-1 flex items-center justify-center border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="radio" value="L" {...register('pilgrim.sex')} className="mr-2 accent-brand-primary" />
                            <span className="text-sm font-bold">Laki-laki</span>
                        </label>
                        <label className="flex-1 flex items-center justify-center border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="radio" value="P" {...register('pilgrim.sex')} className="mr-2 accent-brand-primary" />
                            <span className="text-sm font-bold">Perempuan</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                    <input
                        type="date"
                        {...register('pilgrim.born')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary focus:border-brand-primary"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Ayah Kandung</label>
                    <input
                        type="text"
                        {...register('pilgrim.fatherName')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="Nama Bapak"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Alamat Lengkap</label>
                    <textarea
                        {...register('pilgrim.address')}
                        rows={3}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="Nama jalan, nomor rumah, RT/RW, Kec, Kota/Kab"
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepPersonal;
