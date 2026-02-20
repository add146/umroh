import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';

const PackageManage: React.FC = () => {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPackages = async () => {
        try {
            const data = await apiFetch<{ packages: any[] }>('/api/packages');
            setPackages(data.packages || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchPackages();
    }, []);

    const handleCreate = async () => {
        const name = prompt('Nama Paket:');
        if (!name) return;
        const basePrice = parseInt(prompt('Harga Base (IDR):') || '0');

        try {
            await apiFetch('/api/packages', {
                method: 'POST',
                body: JSON.stringify({ name, basePrice, isActive: true })
            });
            fetchPackages();
        } catch (error) {
            alert('Gagal membuat paket');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Kelola Paket Umroh</h1>
                <button
                    onClick={handleCreate}
                    className="bg-brand-primary text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-brand-primary/20"
                >
                    + Tambah Paket
                </button>
            </div>

            <div className="dark-card rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-[#131210] border-b border-[var(--color-border)]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">ID</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Nama Paket</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Harga Base</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {loading ? (
                            <tr><td colSpan={4} className="p-10 text-center text-gray-400 animate-pulse">Memuat paket...</td></tr>
                        ) : packages.map(pkg => (
                            <tr key={pkg.id}>
                                <td className="px-6 py-4 text-xs font-mono text-gray-400">{pkg.id.split('-')[0]}</td>
                                <td className="px-6 py-4 font-bold text-white">{pkg.name}</td>
                                <td className="px-6 py-4 text-sm font-black text-brand-primary">
                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(pkg.basePrice)}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-xs font-bold text-gray-400 hover:text-brand-primary transition-colors">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PackageManage;
