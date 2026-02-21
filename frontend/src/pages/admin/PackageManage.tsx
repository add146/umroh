import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

export default function PackageManage() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus paket ini?')) return;
        try {
            await apiFetch(`/api/packages/${id}`, { method: 'DELETE' });
            toast.success('Paket berhasil dihapus');
            fetchPackages();
        } catch (error) {
            toast.error('Gagal menghapus paket');
        }
    };

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Paket Umroh</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola dan konfigurasi seluruh paket perjalanan umroh Anda.</p>
                </div>

                <Link
                    to="/admin/packages/create"
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-[#0a0907] rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none"
                    style={{ textDecoration: 'none' }}
                >
                    <Plus className="w-5 h-5" />
                    Tambah Paket
                </Link>
            </div>

            {/* Table */}
            <div style={{ background: 'rgb(19, 18, 16)', border: '1px solid var(--color-border)', borderRadius: '0.3rem', overflow: 'hidden', padding: '10px' }}>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210]/50 divide-x divide-white/10">
                            <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] w-24">ID</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Nama Paket</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Harga Base</th>
                            <th className="px-10 py-5 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-10 py-24 text-center">
                                    <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto" />
                                    <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-300">Memuat data paket...</p>
                                </td>
                            </tr>
                        ) : packages.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-10 py-24 text-center">
                                    <div className="bg-[#131210] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Package className="text-gray-200 w-10 h-10" />
                                    </div>
                                    <p className="text-gray-400 font-bold italic tracking-tight">Belum ada paket umroh yang tersedia.</p>
                                </td>
                            </tr>
                        ) : (
                            packages.map((pkg) => (
                                <tr key={pkg.id} className="hover:bg-primary/[0.01] transition-colors group">
                                    <td className="px-10 py-6">
                                        <span className="px-3 py-1 bg-white/5 rounded-md font-mono text-xs text-gray-400">
                                            {pkg.id.split('-')[0]}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="font-bold text-white text-lg tracking-tight">{pkg.name}</p>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-xl font-black text-primary tracking-tight">
                                            <span className="text-sm mr-1.5 text-secondary">Rp</span>
                                            {pkg.basePrice.toLocaleString('id-ID')}
                                        </p>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(pkg.id)}
                                                className="p-3 dark-card border border-red-900/50 text-red-400 rounded-xl hover:bg-red-950/50 hover:text-red-300 transition-all flex items-center gap-2"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <Link
                                                to={`/admin/packages/${pkg.id}`}
                                                className="p-3 dark-card border border-[var(--color-border)] shadow-sm text-secondary rounded-xl hover:shadow-md hover:border-secondary hover:text-white transition-all flex items-center gap-2"
                                                title="Detail & Master Data"
                                            >
                                                <Edit className="w-4 h-4" /> <span className="text-xs font-black uppercase tracking-widest hidden md:inline">Kelola Produk</span>
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
