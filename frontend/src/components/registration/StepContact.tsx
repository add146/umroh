import React from 'react';
import { useFormContext } from 'react-hook-form';

const StepContact: React.FC = () => {
    const { register } = useFormContext();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Kontak & Status</h2>
                <p className="text-sm text-gray-500">Informasi untuk koordinasi keberangkatan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Status Pernikahan</label>
                    <select
                        {...register('pilgrim.maritalStatus')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                    >
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Menikah">Menikah</option>
                        <option value="Cerai">Cerai</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor HP / WhatsApp</label>
                    <input
                        type="tel"
                        {...register('pilgrim.phone')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        placeholder="0812xxxxxxxx"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pendidikan Terakhir</label>
                    <select
                        {...register('pilgrim.lastEducation')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                    >
                        <option value="">Pilih Pendidikan</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA/SMK">SMA/SMK</option>
                        <option value="D3">D3</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pekerjaan</label>
                    <input
                        type="text"
                        {...register('pilgrim.work')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        placeholder="e.g. Pegawai Swasta, Guru, dsb"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Riwayat Penyakit (Jika Ada)</label>
                    <textarea
                        {...register('pilgrim.diseaseHistory')}
                        rows={2}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        placeholder="Sebutkan jika memiliki kondisi kesehatan khusus..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepContact;
