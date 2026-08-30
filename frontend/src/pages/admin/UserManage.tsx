import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../../lib/api';

interface UserItem {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    nik?: string | null;
    role: 'pusat' | 'cabang' | 'mitra' | 'agen' | 'reseller' | 'teknisi' | 'pic_produk' | 'pic_logistik' | 'pic_jamaah' | 'finance';
    affiliateCode?: string | null;
    isActive: boolean;
    canFieldAttendance?: boolean;
    createdAt?: string | null;
}

export const UserManage: React.FC = () => {
    const [usersList, setUsersList] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [roleFilter, setRoleFilter] = useState<string>('all');

    // Create / Edit Modal State
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingUser, setEditingUser] = useState<UserItem | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'pusat' as UserItem['role'],
        nik: '',
        affiliateCode: '',
        isActive: true,
        canFieldAttendance: false
    });

    // Password Reset Modal State
    const [showResetModal, setShowResetModal] = useState<boolean>(false);
    const [resetTargetUser, setResetTargetUser] = useState<UserItem | null>(null);
    const [newPassword, setNewPassword] = useState<string>('');
    const [resetSubmitting, setResetSubmitting] = useState<boolean>(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<{ users: UserItem[] }>('/api/users/all');
            setUsersList(data.users || []);
        } catch (err: any) {
            console.error('Failed to load users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: 'password123',
            role: 'pusat',
            nik: '',
            affiliateCode: '',
            isActive: true,
            canFieldAttendance: false
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (user: UserItem) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            role: user.role,
            nik: user.nik || '',
            affiliateCode: user.affiliateCode || '',
            isActive: user.isActive,
            canFieldAttendance: user.canFieldAttendance || ['agen', 'reseller', 'mitra'].includes(user.role)
        });
        setShowModal(true);
    };

    const handleToggleFieldAttendance = async (user: UserItem) => {
        const nextValue = !user.canFieldAttendance;
        try {
            await apiFetch(`/api/users/admin-update/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify({ canFieldAttendance: nextValue })
            });
            setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, canFieldAttendance: nextValue } : u));
        } catch (err: any) {
            alert(err.message || 'Gagal mengubah izin absen lapangan');
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUser) {
                // Update
                const payload: any = {
                    name: formData.name,
                    email: formData.email || null,
                    phone: formData.phone,
                    role: formData.role,
                    nik: formData.nik || null,
                    affiliateCode: formData.affiliateCode || null,
                    isActive: formData.isActive,
                    canFieldAttendance: formData.canFieldAttendance
                };
                if (formData.password) payload.password = formData.password;

                await apiFetch(`/api/users/admin-update/${editingUser.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload)
                });
                alert('Data pengguna berhasil diperbarui');
            } else {
                // Create
                await apiFetch('/api/users/admin-create', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                alert('Pengguna baru berhasil ditambahkan');
            }
            setShowModal(false);
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan pengguna');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetTargetUser || !newPassword) return;
        setResetSubmitting(true);
        try {
            await apiFetch(`/api/users/admin-update/${resetTargetUser.id}`, {
                method: 'PUT',
                body: JSON.stringify({ password: newPassword })
            });
            alert(`Password untuk ${resetTargetUser.name} berhasil diubah!`);
            setShowResetModal(false);
            setNewPassword('');
            setResetTargetUser(null);
        } catch (err: any) {
            alert(err.message || 'Gagal mengubah password');
        } finally {
            setResetSubmitting(false);
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus akun "${name}"?`)) return;
        try {
            await apiFetch(`/api/users/admin-delete/${id}`, { method: 'DELETE' });
            alert('Pengguna berhasil dihapus');
            fetchUsers();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus pengguna');
        }
    };

    const filteredUsers = useMemo(() => {
        return usersList.filter(u => {
            const matchesSearch = !search ||
                u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.phone?.includes(search) ||
                u.email?.toLowerCase().includes(search.toLowerCase()) ||
                u.nik?.includes(search) ||
                u.affiliateCode?.toLowerCase().includes(search.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [usersList, search, roleFilter]);

    // Statistics
    const totalUsers = usersList.length;
    const totalPic = usersList.filter(u => ['pusat', 'pic_produk', 'pic_logistik', 'pic_jamaah'].includes(u.role)).length;
    const totalFinance = usersList.filter(u => u.role === 'finance').length;
    const totalCabang = usersList.filter(u => u.role === 'cabang').length;
    const totalSales = usersList.filter(u => ['agen', 'reseller', 'mitra'].includes(u.role)).length;
    const totalTeknisi = usersList.filter(u => u.role === 'teknisi').length;

    // Helper for PIC Badge
    const isPicUser = (role: string, name: string, id: string) => {
        if (['pic_produk', 'pic_logistik', 'pic_jamaah'].includes(role)) return true;
        const lower = name.toLowerCase();
        return id.includes('pic') || lower.includes('laras') || lower.includes('ega') || lower.includes('adin') || lower.includes('edrea');
    };

    // Helper for Role Badges
    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'pusat':
                return { bg: 'rgba(200,168,81,0.18)', border: 'rgba(200,168,81,0.4)', text: 'var(--color-primary)', label: 'Admin Pusat' };
            case 'pic_produk':
                return { bg: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24', label: 'PIC Paket & Jadwal' };
            case 'pic_logistik':
                return { bg: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.4)', text: '#34d399', label: 'PIC Logistik' };
            case 'pic_jamaah':
                return { bg: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.4)', text: '#818cf8', label: 'PIC Data Jamaah' };
            case 'finance':
                return { bg: 'rgba(6,182,212,0.18)', border: 'rgba(6,182,212,0.4)', text: '#22d3ee', label: 'Finance' };
            case 'cabang':
                return { bg: 'rgba(139,92,246,0.18)', border: 'rgba(139,92,246,0.4)', text: '#c4b5fd', label: 'Cabang' };
            case 'teknisi':
                return { bg: 'rgba(34,197,94,0.18)', border: 'rgba(34,197,94,0.4)', text: '#86efac', label: 'Teknisi' };
            case 'mitra':
                return { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd', label: 'Mitra' };
            case 'agen':
                return { bg: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.4)', text: '#93c5fd', label: 'Agen' };
            case 'reseller':
                return { bg: 'rgba(14,165,233,0.18)', border: 'rgba(14,165,233,0.4)', text: '#7dd3fc', label: 'Reseller' };
            default:
                return { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', text: '#ccc', label: role };
        }
    };

    return (
        <div className="animate-in fade-in duration-500" style={{ paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '2rem' }}>
                            manage_accounts
                        </span>
                        Kelola Akun & Staff PIC
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                        Manajemen pengguna sistem, role akses spesifik PIC & Finance, serta izin absensi lapangan
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    style={{
                        padding: '0.625rem 1.25rem',
                        background: 'linear-gradient(135deg, #c8a851 0%, #a88934 100%)',
                        color: '#000',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(200,168,81,0.3)'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
                    + Tambah Akun Pengguna
                </button>
            </div>

            {/* Quick Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0 0 0.25rem 0', fontWeight: 700 }}>TOTAL AKUN</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{totalUsers} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>User</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(200,168,81,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', margin: '0 0 0.25rem 0', fontWeight: 700 }}>STAFF PUSAT & PIC</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#facc15', margin: 0 }}>{totalPic} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Akun</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#22d3ee', margin: '0 0 0.25rem 0', fontWeight: 700 }}>FINANCE</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#67e8f9', margin: 0 }}>{totalFinance} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Akun</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#c4b5fd', margin: '0 0 0.25rem 0', fontWeight: 700 }}>CABANG</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ddd6fe', margin: 0 }}>{totalCabang} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Akun</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#60a5fa', margin: '0 0 0.25rem 0', fontWeight: 700 }}>SALES & AGEN</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#93c5fd', margin: 0 }}>{totalSales} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Akun</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#4ade80', margin: '0 0 0.25rem 0', fontWeight: 700 }}>TEKNISI</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#86efac', margin: 0 }}>{totalTeknisi} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Akun</span></p>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                background: '#141310',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Cari Nama, HP, Email, NIK..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                background: '#0a0907',
                                border: '1px solid #333',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontSize: '0.8125rem',
                                width: '240px',
                                outline: 'none'
                            }}
                        />
                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#666' }}>
                            search
                        </span>
                    </div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 0.75rem',
                            background: '#0a0907',
                            border: '1px solid #333',
                            borderRadius: '0.5rem',
                            color: '#ccc',
                            fontSize: '0.8125rem'
                        }}
                    >
                        <option value="all">Semua Role</option>
                        <option value="pusat">Admin Pusat (Owner)</option>
                        <option value="pic_produk">PIC Paket & Jadwal (Mbak Laras)</option>
                        <option value="pic_logistik">PIC Logistik (Mas Ega)</option>
                        <option value="pic_jamaah">PIC Data Jamaah (Mbak Adin & Mas Edrea)</option>
                        <option value="finance">Finance & Keuangan</option>
                        <option value="cabang">Cabang</option>
                        <option value="teknisi">Teknisi</option>
                        <option value="mitra">Mitra</option>
                        <option value="agen">Agen</option>
                        <option value="reseller">Reseller</option>
                    </select>
                </div>

                <div style={{ fontSize: '0.8125rem', color: '#aaa' }}>
                    Menampilkan <strong>{filteredUsers.length}</strong> pengguna
                </div>
            </div>

            {/* Table */}
            <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                        <p>Memuat daftar pengguna...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        Tidak ada pengguna yang cocok dengan pencarian.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', color: '#888' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>No</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Nama & Akun</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Role Sistem</th>
                                <th style={{ padding: '0.75rem 1rem' }}>WhatsApp / HP</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Absen Bebas (Lapangan)</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((item, idx) => {
                                const isPic = isPicUser(item.role, item.name, item.id);
                                const isSales = ['agen', 'reseller', 'mitra'].includes(item.role);
                                const hasFieldAccess = isSales || !!item.canFieldAttendance;
                                const badge = getRoleBadgeStyle(item.role);

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{idx + 1}</td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ fontWeight: 800, color: 'white', fontSize: '0.875rem' }}>
                                                    {item.name}
                                                </div>
                                                {isPic && (
                                                    <span style={{
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.625rem',
                                                        fontWeight: 800,
                                                        background: 'rgba(200,168,81,0.2)',
                                                        color: 'var(--color-primary)',
                                                        border: '1px solid rgba(200,168,81,0.4)'
                                                    }}>
                                                        ★ PIC 2026
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.6875rem', color: '#888' }}>{item.email || 'Tanpa Email'}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '0.375rem',
                                                fontSize: '0.6875rem',
                                                fontWeight: 800,
                                                background: badge.bg,
                                                color: badge.text,
                                                border: `1px solid ${badge.border}`,
                                                display: 'inline-block',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#ccc' }}>
                                            {item.phone || '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFieldAttendance(item)}
                                                style={{
                                                    background: hasFieldAccess ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${hasFieldAccess ? '#3b82f6' : '#444'}`,
                                                    color: hasFieldAccess ? '#60a5fa' : '#888',
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem'
                                                }}
                                                title="Klik untuk mengubah izin absen lapangan"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                    {hasFieldAccess ? 'check_circle' : 'cancel'}
                                                </span>
                                                {hasFieldAccess ? 'Bisa Di Mana Saja' : 'Wajib Kantor'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.15rem 0.4rem',
                                                borderRadius: '999px',
                                                fontSize: '0.6875rem',
                                                fontWeight: 700,
                                                background: item.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                                color: item.isActive ? '#4ade80' : '#f87171'
                                            }}>
                                                {item.isActive ? 'Aktif' : 'Non-Aktif'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleOpenEditModal(item)}
                                                    title="Edit Akun"
                                                    style={{
                                                        padding: '0.3rem 0.5rem',
                                                        background: 'rgba(200,168,81,0.15)',
                                                        border: '1px solid var(--color-primary)',
                                                        color: 'var(--color-primary)',
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setResetTargetUser(item);
                                                        setNewPassword('');
                                                        setShowResetModal(true);
                                                    }}
                                                    title="Reset Password"
                                                    style={{
                                                        padding: '0.3rem 0.5rem',
                                                        background: '#333',
                                                        border: '1px solid #555',
                                                        color: '#ccc',
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Kunci
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(item.id, item.name)}
                                                    title="Hapus Akun"
                                                    style={{
                                                        padding: '0.3rem 0.5rem',
                                                        background: 'rgba(239,68,68,0.15)',
                                                        border: '1px solid rgba(239,68,68,0.3)',
                                                        color: '#f87171',
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* MODAL CREATE / EDIT USER */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#1a1917',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        maxWidth: '520px',
                        width: '100%',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>
                                {editingUser ? `Edit Akun: ${editingUser.name}` : '+ Tambah Akun Pengguna Baru'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.25rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Nama Lengkap *:
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Laras / Ahmad Syafii"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                        Role Sistem *:
                                    </label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                    >
                                        <option value="pusat">Admin Pusat (Owner / Superadmin)</option>
                                        <option value="pic_produk">PIC Paket & Jadwal (Mbak Laras)</option>
                                        <option value="pic_logistik">PIC Logistik & Inventory (Mas Ega)</option>
                                        <option value="pic_jamaah">PIC Data Jamaah & Manifest (Mbak Adin & Mas Edrea)</option>
                                        <option value="finance">Finance & Keuangan</option>
                                        <option value="cabang">Kantor Cabang</option>
                                        <option value="teknisi">Teknisi Lapangan</option>
                                        <option value="mitra">Mitra</option>
                                        <option value="agen">Agen</option>
                                        <option value="reseller">Reseller</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                        Nomor WhatsApp / HP *:
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="08123456789"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                        Email (Opsional):
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="user@almadinahms.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                        {editingUser ? 'Password Baru (Kosongkan jika tdk diubah):' : 'Password *: '}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        placeholder="Min 6 karakter"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            {/* Checkbox: Izin Absen Lapangan / Bebas Lokasi */}
                            <div style={{
                                background: 'rgba(59,130,246,0.08)',
                                border: '1px solid rgba(59,130,246,0.25)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem',
                                marginBottom: '1.25rem'
                            }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#93c5fd', fontWeight: 700 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.canFieldAttendance}
                                        onChange={(e) => setFormData({ ...formData, canFieldAttendance: e.target.checked })}
                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                                    />
                                    Izinkan Absen Lapangan / Bebas Lokasi di Mana Saja
                                </label>
                                <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.6875rem', color: '#888' }}>
                                    Jika dicentang, pengguna dapat absen masuk & pulang dari mana saja tanpa dibatasi geofence kantor (koordinat GPS tetap dicatat).
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ padding: '0.5rem 1rem', background: '#333', color: '#ccc', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{ padding: '0.5rem 1.5rem', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Akun'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL RESET PASSWORD */}
            {showResetModal && resetTargetUser && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#1a1917',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        maxWidth: '420px',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                                🔑 Reset Password: {resetTargetUser.name}
                            </h3>
                            <button
                                onClick={() => setShowResetModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.25rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleResetPassword}>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Masukkan Password Baru *:
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: password123"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    style={{ padding: '0.5rem 1rem', background: '#333', color: '#ccc', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={resetSubmitting}
                                    style={{ padding: '0.5rem 1.25rem', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    {resetSubmitting ? 'Menyimpan...' : 'Perbarui Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManage;
