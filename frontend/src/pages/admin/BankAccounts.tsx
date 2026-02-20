import React, { useState, useEffect } from 'react';
import { Landmark, Plus, Save, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../lib/api';

interface BankAccount {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isActive: boolean;
}

export default function BankAccountsPage() {
    const [banks, setBanks] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', accountHolder: '' });

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        try {
            const data = await apiFetch<BankAccount[]>('/api/payments/banks');
            setBanks(data);
        } catch (error) {
            toast.error('Gagal mengambil data rekening');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newBank.bankName || !newBank.accountNumber || !newBank.accountHolder) {
            return toast.error('Semua field harus diisi');
        }

        try {
            await apiFetch('/api/payments/banks', {
                method: 'POST',
                body: JSON.stringify(newBank)
            });

            toast.success('Rekening berhasil ditambahkan');
            setIsAdding(false);
            setNewBank({ bankName: '', accountNumber: '', accountHolder: '' });
            fetchBanks();
        } catch (error) {
            toast.error('Gagal menambah rekening');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await apiFetch(`/api/payments/banks/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !currentStatus })
            });
            toast.success('Status berhasil diperbarui');
            fetchBanks();
        } catch (error) {
            toast.error('Gagal memperbarui status');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-end border-b border-gray-100 pb-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Setelan Rekening</h1>
                    <p className="text-gray-500 font-medium">Kelola rekening bank untuk tujuan transfer manual jamaah.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${isAdding ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-primary text-white hover:bg-primary-light shadow-lg shadow-primary/20 hover:shadow-xl'
                        }`}
                >
                    {isAdding ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isAdding ? 'Batal' : 'Tambah Rekening'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-3xl border border-primary/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-primary/5 rounded-lg text-primary">
                            <Landmark className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900">Rekening Baru</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nama Bank</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                                value={newBank.bankName}
                                onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                                placeholder="Contoh: BANK BCA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nomor Rekening</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                                value={newBank.accountNumber}
                                onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                                placeholder="Contoh: 1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Atas Nama</label>
                            <input
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all outline-none"
                                value={newBank.accountHolder}
                                onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                                placeholder="Nama Pemilik Rekening"
                            />
                        </div>
                    </div>

                    <button onClick={handleAdd} className="mt-8 flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-secondary-light shadow-lg shadow-secondary/20 transition-all active:scale-95">
                        <Save className="w-5 h-5" /> Simpan Konfigurasi
                    </button>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Institusi Bank</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Informasi Akun</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Manajemen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-16 text-center">
                                    <Loader2 className="animate-spin text-primary w-10 h-10 mx-auto" />
                                </td>
                            </tr>
                        ) : banks.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-8 py-16 text-center text-gray-400 font-medium italic">
                                    Belum ada rekening aktif yang terdaftar.
                                </td>
                            </tr>
                        ) : (
                            banks.map((bank) => (
                                <tr key={bank.id} className="hover:bg-primary/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl transition-all duration-300 ${bank.isActive ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                                                <Landmark className="w-5 h-5" />
                                            </div>
                                            <span className="text-xl font-black text-gray-900 tracking-tight">{bank.bankName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-lg font-black font-mono tracking-wider text-gray-900">{bank.accountNumber}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A/N {bank.accountHolder}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${bank.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${bank.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            {bank.isActive ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(bank.id, bank.isActive)}
                                                className={`p-3 rounded-xl transition-all duration-300 ${bank.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                    }`}
                                                title={bank.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {bank.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                            <button
                                                className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all opacity-40 hover:opacity-100"
                                                title="Hapus Permanen"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
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
