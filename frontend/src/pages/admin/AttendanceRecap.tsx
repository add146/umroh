import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://umroh-api.khibroh.workers.dev';

interface StaffRecapItem {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone: string;
    };
    attendance: {
        id: string;
        type: 'office' | 'field' | 'remote';
        date: string;
        checkInAt: string;
        checkInLat?: number | null;
        checkInLng?: number | null;
        checkInAddress?: string | null;
        checkInPhotoUrl?: string | null;
        checkInNotes?: string | null;
        isOnTime: boolean;
        checkOutAt?: string | null;
        checkOutLat?: number | null;
        checkOutLng?: number | null;
        durationMinutes?: number;
        status: string;
        location?: { id: string; name: string };
        fieldVisits?: any[];
    } | null;
}

interface OfficeLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    address?: string | null;
    isActive: boolean;
}

export const AttendanceRecap: React.FC = () => {
    const { user } = useAuthStore();
    const isPusat = user?.role === 'pusat';

    const [activeTab, setActiveTab] = useState<'today' | 'monthly' | 'locations'>('today');
    const [todayDate, setTodayDate] = useState<string>('');
    const [todayList, setTodayList] = useState<StaffRecapItem[]>([]);
    const [loadingToday, setLoadingToday] = useState<boolean>(true);

    // Monthly Tab State
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
    const [filterRole, setFilterRole] = useState<string>('all');
    const [monthlyLogs, setMonthlyLogs] = useState<any[]>([]);
    const [loadingMonthly, setLoadingMonthly] = useState<boolean>(false);
    const [exporting, setExporting] = useState<boolean>(false);

    // Locations Tab State
    const [locations, setLocations] = useState<OfficeLocation[]>([]);
    const [, setLoadingLocations] = useState<boolean>(false);
    const [showLocModal, setShowLocModal] = useState<boolean>(false);
    const [editingLoc, setEditingLoc] = useState<OfficeLocation | null>(null);
    const [locForm, setLocForm] = useState({
        name: '',
        latitude: -6.2088,
        longitude: 106.8456,
        radiusMeters: 150,
        address: ''
    });

    const [fetchingGps, setFetchingGps] = useState<boolean>(false);

    const handleGetCurrentLocationForForm = () => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung oleh browser Anda');
            return;
        }
        setFetchingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocForm(prev => ({
                    ...prev,
                    latitude: Number(pos.coords.latitude.toFixed(6)),
                    longitude: Number(pos.coords.longitude.toFixed(6))
                }));
                setFetchingGps(false);
                alert(`Titik GPS berhasil terdeteksi!\nLatitude: ${pos.coords.latitude.toFixed(6)}\nLongitude: ${pos.coords.longitude.toFixed(6)}`);
            },
            (err) => {
                setFetchingGps(false);
                alert('Gagal mendeteksi lokasi GPS: ' + err.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Modal Photo Preview
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

    useEffect(() => {
        loadTodayRecap();
    }, []);

    useEffect(() => {
        if (activeTab === 'monthly') loadMonthlyRecap();
        if (activeTab === 'locations') loadLocations();
    }, [activeTab, selectedMonth, filterRole]);

    const loadTodayRecap = async () => {
        setLoadingToday(true);
        try {
            const data = await apiFetch<any>('/api/attendance/admin/today-recap');
            setTodayDate(data.date || '');
            setTodayList(data.recap || []);
        } catch (err) {
            console.error('Failed to load today recap', err);
        } finally {
            setLoadingToday(false);
        }
    };

    const loadMonthlyRecap = async () => {
        setLoadingMonthly(true);
        try {
            const data = await apiFetch<any>(`/api/attendance/admin/monthly-recap?month=${selectedMonth}&role=${filterRole}`);
            setMonthlyLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to load monthly logs', err);
        } finally {
            setLoadingMonthly(false);
        }
    };

    const loadLocations = async () => {
        setLoadingLocations(true);
        try {
            const data = await apiFetch<OfficeLocation[]>('/api/attendance/locations');
            setLocations(data || []);
        } catch (err) {
            console.error('Failed to load locations', err);
        } finally {
            setLoadingLocations(false);
        }
    };

    // Download Excel Recap
    const handleExportExcel = async () => {
        setExporting(true);
        try {
            const { accessToken } = useAuthStore.getState();
            const res = await fetch(`${API_URL}/api/attendance/admin/export-excel?month=${selectedMonth}`, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            });
            if (!res.ok) throw new Error('Gagal mengunduh rekap');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rekap_Absensi_${selectedMonth}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.message || 'Gagal mengekspor data');
        } finally {
            setExporting(false);
        }
    };

    // Save Location Geofence
    const handleSaveLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiFetch('/api/attendance/locations', {
                method: 'POST',
                body: JSON.stringify({
                    id: editingLoc?.id,
                    ...locForm,
                    latitude: Number(locForm.latitude),
                    longitude: Number(locForm.longitude),
                    radiusMeters: Number(locForm.radiusMeters)
                })
            });
            alert('Lokasi berhasil disimpan!');
            setShowLocModal(false);
            setEditingLoc(null);
            loadLocations();
        } catch (err: any) {
            alert(err.message || 'Gagal menyimpan lokasi');
        }
    };

    // Delete Location
    const handleDeleteLocation = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus lokasi ini?')) return;
        try {
            await apiFetch(`/api/attendance/locations/${id}`, { method: 'DELETE' });
            loadLocations();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus lokasi');
        }
    };

    // Quick Stats Calculation for Today
    const totalStaff = todayList.length;
    const totalPresent = todayList.filter(item => !!item.attendance).length;
    const totalOnTime = todayList.filter(item => item.attendance?.isOnTime).length;
    const totalLate = todayList.filter(item => item.attendance && !item.attendance.isOnTime).length;
    const totalFieldSales = todayList.filter(item => item.attendance?.type === 'field').length;
    const totalAbsent = totalStaff - totalPresent;

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
                            badge
                        </span>
                        Monitoring & Rekap Absensi
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                        Pemantauan presensi kehadiran harian, koordinat GPS, kunjungan sales, dan master geofence kantor
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            boxShadow: '0 2px 8px rgba(16,185,129,0.3)'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                        {exporting ? 'Mengunduh...' : 'Export Rekap Excel'}
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0 0 0.25rem 0', fontWeight: 700 }}>TOTAL STAFF</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{totalStaff} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Orang</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#4ade80', margin: '0 0 0.25rem 0', fontWeight: 700 }}>TEPAT WAKTU</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#86efac', margin: 0 }}>{totalOnTime} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Orang</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#facc15', margin: '0 0 0.25rem 0', fontWeight: 700 }}>TERLAMBAT</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fde047', margin: 0 }}>{totalLate} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Orang</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#60a5fa', margin: '0 0 0.25rem 0', fontWeight: 700 }}>SALES DI LAPANGAN</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#93c5fd', margin: 0 }}>{totalFieldSales} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Pax</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#f87171', margin: '0 0 0.25rem 0', fontWeight: 700 }}>BELUM ABSEN</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fca5a5', margin: 0 }}>{totalAbsent} <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 500 }}>Orang</span></p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => setActiveTab('today')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'today' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        color: activeTab === 'today' ? 'var(--color-primary)' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>today</span>
                    Presensi Hari Ini ({todayDate})
                </button>

                <button
                    onClick={() => setActiveTab('monthly')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'monthly' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        color: activeTab === 'monthly' ? 'var(--color-primary)' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
                    Rekap Bulanan
                </button>

                {isPusat && (
                    <button
                        onClick={() => setActiveTab('locations')}
                        style={{
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            background: 'transparent',
                            border: 'none',
                            borderBottom: activeTab === 'locations' ? '3px solid var(--color-primary)' : '3px solid transparent',
                            color: activeTab === 'locations' ? 'var(--color-primary)' : '#888',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_city</span>
                        Master Lokasi Geofence ({locations.length})
                    </button>
                )}
            </div>

            {/* TAB 1: TODAY RECAP */}
            {activeTab === 'today' && (
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflowX: 'auto' }}>
                    {loadingToday ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                            <p>Memuat rekap kehadiran hari ini...</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', color: '#888' }}>
                                    <th style={{ padding: '0.75rem 1rem' }}>No</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Nama Staff / Sales</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Tipe</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Jam Masuk</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Jam Pulang</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Durasi</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Lokasi & GPS</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Kunjungan Sales</th>
                                    <th style={{ padding: '0.75rem 1rem' }}>Foto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todayList.map((item, idx) => {
                                    const att = item.attendance;
                                    return (
                                        <tr key={item.user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: '#666' }}>{idx + 1}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ fontWeight: 700, color: 'white' }}>{item.user.name}</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#888' }}>{item.user.phone || item.user.email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: '#ccc',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {item.user.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {att ? (
                                                    <span style={{
                                                        padding: '0.15rem 0.4rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        background: att.type === 'office' ? 'rgba(200,168,81,0.15)' : 'rgba(59,130,246,0.15)',
                                                        color: att.type === 'office' ? 'var(--color-primary)' : '#60a5fa'
                                                    }}>
                                                        {att.type === 'office' ? 'Kantor' : 'Lapangan'}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: att?.checkInAt ? 'white' : '#666' }}>
                                                {att?.checkInAt ? new Date(att.checkInAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: att?.checkOutAt ? 'white' : '#666' }}>
                                                {att?.checkOutAt ? new Date(att.checkOutAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#aaa' }}>
                                                {att?.durationMinutes ? `${(att.durationMinutes / 60).toFixed(1)} Jam` : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {att ? (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        background: att.isOnTime ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                                        color: att.isOnTime ? '#4ade80' : '#facc15'
                                                    }}>
                                                        {att.isOnTime ? 'Tepat Waktu' : 'Terlambat'}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '999px',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        background: 'rgba(239,68,68,0.15)',
                                                        color: '#f87171'
                                                    }}>
                                                        Belum Absen
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {att?.checkInAddress && <div style={{ color: '#ccc' }}>{att.checkInAddress}</div>}
                                                {att?.checkInLat && att?.checkInLng ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${att.checkInLat},${att.checkInLng}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6875rem', marginTop: '0.2rem' }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
                                                        Lihat di Maps
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {att?.fieldVisits && att.fieldVisits.length > 0 ? (
                                                    <span style={{
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        background: 'rgba(59,130,246,0.15)',
                                                        color: '#93c5fd',
                                                        fontWeight: 700,
                                                        fontSize: '0.6875rem'
                                                    }}>
                                                        📍 {att.fieldVisits.length} Kunjungan
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {att?.checkInPhotoUrl ? (
                                                    <img
                                                        src={att.checkInPhotoUrl}
                                                        alt="Selfie"
                                                        onClick={() => setPreviewPhoto(att.checkInPhotoUrl || null)}
                                                        style={{ width: '32px', height: '32px', borderRadius: '0.375rem', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--color-primary)' }}
                                                    />
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* TAB 2: MONTHLY RECAP */}
            {activeTab === 'monthly' && (
                <div>
                    {/* Filters Toolbar */}
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
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, marginRight: '0.5rem' }}>Bulan:</span>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.8125rem'
                                    }}
                                />
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, marginRight: '0.5rem' }}>Role:</span>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    style={{
                                        padding: '0.4rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.8125rem'
                                    }}
                                >
                                    <option value="all">Semua Role</option>
                                    <option value="pusat">Staff Pusat</option>
                                    <option value="cabang">Staff Cabang</option>
                                    <option value="agen">Sales / Agen</option>
                                    <option value="reseller">Reseller</option>
                                    <option value="mitra">Mitra</option>
                                    <option value="teknisi">Teknisi / Lapangan</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ fontSize: '0.8125rem', color: '#aaa' }}>
                            Total Record: <strong>{monthlyLogs.length}</strong> kehadiran
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflowX: 'auto' }}>
                        {loadingMonthly ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                                <p>Memuat rekap bulanan...</p>
                            </div>
                        ) : monthlyLogs.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                Tidak ada catatan kehadiran untuk filter bulan dan role ini.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', color: '#888' }}>
                                        <th style={{ padding: '0.75rem' }}>Tanggal</th>
                                        <th style={{ padding: '0.75rem' }}>Nama Staff</th>
                                        <th style={{ padding: '0.75rem' }}>Role</th>
                                        <th style={{ padding: '0.75rem' }}>Tipe</th>
                                        <th style={{ padding: '0.75rem' }}>Jam Masuk</th>
                                        <th style={{ padding: '0.75rem' }}>Jam Pulang</th>
                                        <th style={{ padding: '0.75rem' }}>Durasi</th>
                                        <th style={{ padding: '0.75rem' }}>Status</th>
                                        <th style={{ padding: '0.75rem' }}>Lokasi / Catatan</th>
                                        <th style={{ padding: '0.75rem' }}>Kunjungan Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyLogs.map(log => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem', fontWeight: 700, color: 'white' }}>{log.date}</td>
                                            <td style={{ padding: '0.75rem', color: 'white', fontWeight: 600 }}>{log.user?.name || '-'}</td>
                                            <td style={{ padding: '0.75rem', textTransform: 'uppercase', color: '#aaa', fontSize: '0.6875rem' }}>{log.user?.role || '-'}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: log.type === 'office' ? 'rgba(200,168,81,0.15)' : 'rgba(59,130,246,0.15)',
                                                    color: log.type === 'office' ? 'var(--color-primary)' : '#60a5fa'
                                                }}>
                                                    {log.type === 'office' ? 'Kantor' : 'Lapangan'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#ccc' }}>
                                                {log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem', fontFamily: 'monospace', color: '#ccc' }}>
                                                {log.checkOutAt ? new Date(log.checkOutAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#aaa' }}>
                                                {log.durationMinutes ? `${(log.durationMinutes / 60).toFixed(1)} Jam` : '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.15rem 0.4rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: log.isOnTime ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                                    color: log.isOnTime ? '#4ade80' : '#facc15'
                                                }}>
                                                    {log.isOnTime ? 'Tepat Waktu' : 'Terlambat'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: '#ccc' }}>
                                                {log.checkInAddress || log.location?.name || log.checkInNotes || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {log.fieldVisits && log.fieldVisits.length > 0 ? `${log.fieldVisits.length} Kunjungan` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: MASTER LOCATIONS GEOFENCE */}
            {activeTab === 'locations' && isPusat && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <p style={{ color: '#aaa', margin: 0, fontSize: '0.875rem' }}>
                            Daftar lokasi kantor resmi. Absensi tipe kantor mewajibkan staff berada di dalam radius geofence lokasi ini.
                        </p>
                        <button
                            onClick={() => {
                                setEditingLoc(null);
                                setLocForm({ name: '', latitude: -6.2088, longitude: 106.8456, radiusMeters: 150, address: '' });
                                setShowLocModal(true);
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--color-primary)',
                                color: '#000',
                                fontWeight: 800,
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_location_alt</span>
                            + Tambah Lokasi Kantor
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                        {locations.map(loc => (
                            <div key={loc.id} style={{
                                background: '#1a1917',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0.75rem',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>
                                            🏢 {loc.name}
                                        </h3>
                                        <span style={{
                                            padding: '0.15rem 0.4rem',
                                            borderRadius: '0.25rem',
                                            fontSize: '0.6875rem',
                                            fontWeight: 700,
                                            background: 'rgba(34,197,94,0.15)',
                                            color: '#4ade80'
                                        }}>
                                            Radius {loc.radiusMeters}m
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#aaa' }}>{loc.address || 'Alamat tidak dicantumkan'}</p>
                                    <p style={{ margin: 0, fontSize: '0.6875rem', fontFamily: 'monospace', color: '#888' }}>
                                        Lat: {loc.latitude} | Lng: {loc.longitude}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid #333', paddingTop: '0.75rem' }}>
                                    <a
                                        href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            padding: '0.3rem 0.625rem',
                                            background: '#333',
                                            color: '#ccc',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        Buka Maps
                                    </a>
                                    <button
                                        onClick={() => {
                                            setEditingLoc(loc);
                                            setLocForm({
                                                name: loc.name,
                                                latitude: loc.latitude,
                                                longitude: loc.longitude,
                                                radiusMeters: loc.radiusMeters,
                                                address: loc.address || ''
                                            });
                                            setShowLocModal(true);
                                        }}
                                        style={{
                                            padding: '0.3rem 0.625rem',
                                            background: 'rgba(200,168,81,0.15)',
                                            color: 'var(--color-primary)',
                                            border: '1px solid var(--color-primary)',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteLocation(loc.id)}
                                        style={{
                                            padding: '0.3rem 0.625rem',
                                            background: 'rgba(239,68,68,0.15)',
                                            color: '#f87171',
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            borderRadius: '0.375rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MODAL LOCATION FORM */}
            {showLocModal && (
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
                        maxWidth: '480px',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>
                                {editingLoc ? 'Edit Lokasi Kantor' : 'Tambah Lokasi Kantor Baru'}
                            </h3>
                            <button
                                onClick={() => setShowLocModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.25rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveLocation}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Nama Kantor / Cabang *:
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Kantor Cabang Bandung"
                                    value={locForm.name}
                                    onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ccc' }}>
                                        Koordinat GPS *:
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocationForForm}
                                        disabled={fetchingGps}
                                        style={{
                                            background: 'rgba(59,130,246,0.15)',
                                            border: '1px solid #3b82f6',
                                            color: '#60a5fa',
                                            borderRadius: '0.375rem',
                                            padding: '0.2rem 0.5rem',
                                            fontSize: '0.6875rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>my_location</span>
                                        {fetchingGps ? 'Mendeteksi...' : '📍 Ambil Titik GPS Saya Saat Ini'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.6875rem', color: '#888', marginBottom: '0.25rem' }}>
                                            Latitude (Garis Lintang):
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            value={locForm.latitude}
                                            onChange={(e) => setLocForm({ ...locForm, latitude: parseFloat(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.6875rem', color: '#888', marginBottom: '0.25rem' }}>
                                            Longitude (Garis Bujur):
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            value={locForm.longitude}
                                            onChange={(e) => setLocForm({ ...locForm, longitude: parseFloat(e.target.value) || 0 })}
                                            style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Radius Geofence (Meter) *:
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={locForm.radiusMeters}
                                    onChange={(e) => setLocForm({ ...locForm, radiusMeters: parseInt(e.target.value) || 150 })}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Alamat Lengkap:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Alamat kantor..."
                                    value={locForm.address}
                                    onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', color: 'white', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowLocModal(false)}
                                    style={{ padding: '0.5rem 1rem', background: '#333', color: '#ccc', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1.25rem', background: 'var(--color-primary)', color: '#000', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    Simpan Lokasi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PHOTO PREVIEW */}
            {previewPhoto && (
                <div
                    onClick={() => setPreviewPhoto(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99999,
                        padding: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <img src={previewPhoto} alt="Selfie Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: '1rem', border: '2px solid var(--color-primary)' }} />
                        <p style={{ color: '#ccc', marginTop: '0.5rem', fontSize: '0.8125rem' }}>Klik di mana saja untuk menutup</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceRecap;
