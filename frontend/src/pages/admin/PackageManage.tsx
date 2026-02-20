import React, { useState, useEffect } from 'react';
import { Plus, Package, Edit, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

export default function PackageManage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({ id: '', name: '', basePrice: 0 });

    const fetchPackages = async () => {
        try {
            const data = await apiFetch<{ packages: any[] }>('/api/packages');
            setPackages(data.packages || []);
        } catch (error) {
            toast.error('Gagal memuat daftar paket');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (form.id) {
                toast.error('Opsi ubah paket sedang dikembangkan untuk rilis mendatang');
            } else {
                await apiFetch('/api/packages', {
                    method: 'POST',
                    body: JSON.stringify({ name: form.name, basePrice: form.basePrice, isActive: true })
                });
                toast.success('Paket berhasil ditambahkan');
            }
            setIsFormOpen(false);
            setForm({ id: '', name: '', basePrice: 0 });
            fetchPackages();
        } catch (error) {
            toast.error('Gagal menyimpan paket');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[var(--color-border)] pb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
                        Kelola Paket Umroh
                    </h1>
                    <p className="text-gray-500 font-medium">Atur daftar pilihan paket umroh dan harga pokok penjualannya.</p>
                </div>

                <button
                    onClick={() => {
                        setForm({ id: '', name: '', basePrice: 0 });
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-[#0a0907] rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Tambah Paket
                </button>
            </div>

            {/* Table */}
            <div className="dark-card rounded-[32px] border border-[var(--color-border)] shadow-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210]/50 divide-x divide-white/10">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] w-24">ID</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Nama Paket</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Harga Base</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-24 text-center">
                                    <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-300">Memuat data paket...</p>
                                </td>
                            </tr>
                        ) : packages.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-24 text-center">
                                    <div className="bg-[#131210] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="text-gray-200 w-10 h-10" />
                                    </div>
                                    <p className="text-gray-400 font-bold italic tracking-tight">Belum ada paket umroh yang tersedia.</p>
                                </td>
                            </tr>
                        ) : (
                            packages.map((pkg) => (
                                <tr key={pkg.id} className="hover:bg-primary/[0.01] transition-colors group">
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-white/5 rounded-md font-mono text-xs text-gray-400">
                                            {pkg.id.split('-')[0]}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-bold text-white text-lg tracking-tight">{pkg.name}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-xl font-black text-primary tracking-tight">
                                            <span className="text-sm mr-1.5 text-secondary">Rp</span>
                                            {pkg.basePrice.toLocaleString('id-ID')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setForm({ id: pkg.id, name: pkg.name, basePrice: pkg.basePrice });
                                                    setIsFormOpen(true);
                                                }}
                                                className="p-3 dark-card border border-[var(--color-border)] shadow-sm text-secondary rounded-xl hover:shadow-md hover:border-secondary hover:text-white transition-all"
                                                title="Edit Paket"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
                    <div className="max-w-md w-full dark-card rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--color-border)]">
                        <div className="bg-[#131210] px-8 py-6 flex items-center justify-between border-b border-[var(--color-border)]">
                            <h3 className="text-xl font-bold text-white tracking-wider">
                                {form.id ? 'Edit Paket Umroh' : 'Tambah Paket Baru'}
                            </h3>
                            <button
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 dark-card/10 text-gray-400 rounded-xl hover:text-white hover:bg-white/5 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Nama Paket</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                                        placeholder="Misal: Paket Umroh Plus Turki"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Harga Base (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-4 text-gray-500 font-bold">Rp</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={form.basePrice || ''}
                                            onChange={(e) => setForm({ ...form, basePrice: parseInt(e.target.value) || 0 })}
                                            className="w-full pl-12 pr-5 py-4 bg-[#131210] border border-[var(--color-border)] rounded-2xl text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-black text-lg"
                                            placeholder="35000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="flex-1 py-4 bg-white/5 text-gray-300 rounded-2xl font-bold hover:bg-white/10 transition-all font-black uppercase text-sm tracking-widest"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 bg-primary text-[#0a0907] rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 uppercase text-sm tracking-widest"
                                >
                                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Paket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
