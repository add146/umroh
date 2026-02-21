import { useState, useEffect } from 'react';
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
        <div className="animate-in fade-in duration-700">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Setelan Rekening</h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Kelola rekening bank untuk tujuan transfer manual jamaah.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${isAdding ? 'bg-[#ef4444]/10 text-red-500 hover:bg-[#ef4444]/20' : 'bg-primary text-white hover:bg-primary-light shadow-lg hover:shadow-xl'
                        }`}
                >
                    {isAdding ? <XCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {isAdding ? 'Batal' : 'Tambah Rekening'}
                </button>
            </div>

            {isAdding && (
                <div className="dark-card p-8 rounded-3xl border border-primary/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2 bg-[var(--color-primary-bg)] rounded-lg text-primary">
                            <Landmark className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-white">Rekening Baru</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nama Bank</label>
                            <input
                                className="w-full bg-[#131210] border border-[var(--color-border)] rounded-xl px-4 py-3 font-bold text-white focus:dark-card focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={newBank.bankName}
                                onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                                placeholder="Contoh: BANK BCA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Nomor Rekening</label>
                            <input
                                className="w-full bg-[#131210] border border-[var(--color-border)] rounded-xl px-4 py-3 font-mono font-bold text-white focus:dark-card focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={newBank.accountNumber}
                                onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                                placeholder="Contoh: 1234567890"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Atas Nama</label>
                            <input
                                className="w-full bg-[#131210] border border-[var(--color-border)] rounded-xl px-4 py-3 font-bold text-white focus:dark-card focus:ring-2 focus:ring-primary outline-none transition-all"
                                value={newBank.accountHolder}
                                onChange={(e) => setNewBank({ ...newBank, accountHolder: e.target.value })}
                                placeholder="Nama Pemilik Rekening"
                            />
                        </div>
                    </div>

                    <button onClick={handleAdd} className="mt-8 flex items-center gap-2 bg-secondary text-white px-8 py-3 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-secondary-light transition-all active:scale-95">
                        <Save className="w-5 h-5" /> Simpan Konfigurasi
                    </button>
                </div>
            )}

            <div className="dark-card rounded-3xl border border-[var(--color-border)] shadow-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-[#131210]/50">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Institusi Bank</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Informasi Akun</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Manajemen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
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
                                <tr key={bank.id} className="hover:bg-[var(--color-primary-bg)] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl transition-all duration-300 ${bank.isActive ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400'}`}>
                                                <Landmark className="w-5 h-5" />
                                            </div>
                                            <span className="text-xl font-black text-white tracking-tight">{bank.bankName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="text-lg font-black font-mono tracking-wider text-white">{bank.accountNumber}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">A/N {bank.accountHolder}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${bank.isActive ? 'bg-[#22c55e]/10 text-success' : 'bg-white/5 text-gray-400'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${bank.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            {bank.isActive ? 'Aktif' : 'Non-Aktif'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleStatus(bank.id, bank.isActive)}
                                                className={`p-3 rounded-xl transition-all duration-300 ${bank.isActive ? 'bg-[#f59e0b]/10 text-amber-500 hover:bg-[#f59e0b]/20' : 'bg-[#22c55e]/10 text-success hover:bg-[#22c55e]/20'
                                                    }`}
                                                title={bank.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                            >
                                                {bank.isActive ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                                            </button>
                                            <button
                                                className="p-3 bg-[#ef4444]/10 text-red-500 rounded-xl hover:bg-[#ef4444]/20 transition-all opacity-40 hover:opacity-100"
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
