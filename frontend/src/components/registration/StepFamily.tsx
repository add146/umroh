import React from 'react';
import { useFormContext } from 'react-hook-form';

const StepFamily: React.FC = () => {
    const { register } = useFormContext();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Keluarga & Sumber Informasi</h2>
                <p className="text-sm text-gray-500">Kontak darurat dan referensi pendaftaran.</p>
            </div>

            <div className="space-y-6">
                <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <h3 className="text-sm font-bold text-brand-primary mb-4 flex items-center">
                        <span className="mr-2">🚨</span> Kontak Darurat (Keluarga)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nama Kontak</label>
                            <input
                                type="text"
                                {...register('pilgrim.famContactName')}
                                className="w-full bg-white border-gray-100 rounded-xl p-3 text-sm focus:ring-brand-primary"
                                placeholder="Nama anggota keluarga"
                            />
                        </div>
                        <div>
                            <label className="block text text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nomor HP</label>
                            <input
                                type="tel"
                                {...register('pilgrim.famContact')}
                                className="w-full bg-white border-gray-100 rounded-xl p-3 text-sm focus:ring-brand-primary"
                                placeholder="08xxxxxxxx"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dari Mana Anda Mengetahui Kami?</label>
                    <select
                        {...register('pilgrim.sourceFrom')}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                    >
                        <option value="">Pilih Sumber Informasi</option>
                        <option value="Media Sosial">Media Sosial (IG/FB/TikTok)</option>
                        <option value="Rekomendasi Teman">Rekomendasi Teman/Keluarga</option>
                        <option value="Website">Website</option>
                        <option value="Brosur">Brosur / Spanduk</option>
                        <option value="Agen">Agen Umroh</option>
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Anggota Keluarga Yang Ikut (Opsional)</label>
                    <textarea
                        {...register('pilgrim.famMember')}
                        rows={2}
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-4 text-sm focus:ring-brand-primary"
                        placeholder="Sebutkan nama keluarga lain jika mendaftar bersamaan (misal: Istri, Anak)..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepFamily;
