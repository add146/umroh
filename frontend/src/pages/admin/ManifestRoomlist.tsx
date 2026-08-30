import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface Departure {
    id: string;
    departureDate: string;
    packageId: string;
    package?: { name: string };
    roomTypes?: { id: string; name: string; capacity: number; priceAdjustment: number }[];
}

interface Pilgrim {
    id: string;
    name: string;
    noKtp: string;
    sex: 'L' | 'P';
    born: string;
    address: string;
    phone: string;
    fatherName: string;
    noPassport?: string | null;
    passportFrom?: string | null;
    passportExpiry?: string | null;
    maritalStatus: string;
    work: string;
    lastEducation: string;
}

interface Booking {
    id: string;
    departureId: string;
    pilgrimId: string;
    totalPrice: number;
    paymentStatus: string;
    bookingStatus: string;
    pilgrim: Pilgrim;
    roomType?: { id: string; name: string; capacity: number };
    roomAssignment?: { id: string; roomNumber: string; notes?: string };
}

const API_URL = import.meta.env.VITE_API_URL || 'https://umroh-api.khibroh.workers.dev';

export const ManifestRoomlist: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'manifest';
    const initialDepId = searchParams.get('departureId') || '';

    const [activeTab, setActiveTab] = useState<'manifest' | 'roomlist' | 'import'>(
        (initialTab as any) || 'manifest'
    );
    const [departures, setDepartures] = useState<Departure[]>([]);
    const [selectedDepartureId, setSelectedDepartureId] = useState<string>(initialDepId);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    // Filters for Manifest Tab
    const [search, setSearch] = useState('');
    const [filterGender, setFilterGender] = useState<'all' | 'L' | 'P'>('all');
    const [filterRoomType, setFilterRoomType] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');

    // Drag and Drop state for Roomlist Tab
    const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
    const [, setSavingRoom] = useState<string | null>(null);
    const [autoGrouping, setAutoGrouping] = useState(false);
    const [newRoomNumberInput, setNewRoomNumberInput] = useState<{ [key: string]: string }>({});

    // Import Tab State
    const [importFile, setImportFile] = useState<File | null>(null);
    const [parsedPreview, setParsedPreview] = useState<any[]>([]);
    const [importValidationErrors, setImportValidationErrors] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<any | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load departures list on mount
    useEffect(() => {
        fetchDepartures();
    }, []);

    const fetchDepartures = async () => {
        try {
            const data = await apiFetch<{ departures: Departure[] }>('/api/departures');
            setDepartures(data.departures || []);
            if (data.departures?.length > 0 && !selectedDepartureId) {
                const targetId = initialDepId || data.departures[0].id;
                setSelectedDepartureId(targetId);
            }
        } catch (error) {
            console.error('Failed to load departures', error);
        }
    };

    // Load bookings whenever selected departure changes
    useEffect(() => {
        if (selectedDepartureId) {
            fetchBookings(selectedDepartureId);
            setSearchParams({ departureId: selectedDepartureId, tab: activeTab });
        }
    }, [selectedDepartureId, activeTab]);

    const fetchBookings = async (departureId: string) => {
        setLoading(true);
        try {
            const data = await apiFetch<Booking[]>(`/api/operations/rooming/${departureId}`);
            setBookings(data || []);
        } catch (error) {
            console.error('Failed to fetch bookings for departure', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Download file with Auth token
    const handleDownload = async (endpoint: string, fallbackFilename: string, key: string) => {
        setDownloading(key);
        try {
            const { accessToken } = useAuthStore.getState();
            const res = await fetch(`${API_URL}${endpoint}`, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({ error: 'Gagal mengunduh file' }));
                throw new Error(err.error || 'Gagal mengunduh file');
            }
            const blob = await res.blob();
            const disposition = res.headers.get('content-disposition');
            let filename = fallbackFilename;
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/["']/g, '');
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Download error:', err);
            alert(err.message || 'Gagal mengunduh file');
        } finally {
            setDownloading(null);
        }
    };

    // Assign room for a booking
    const handleAssignRoom = async (bookingId: string, roomNumber: string, notes?: string) => {
        setSavingRoom(bookingId);
        try {
            await apiFetch('/api/operations/rooming/assign', {
                method: 'POST',
                body: JSON.stringify({ bookingId, roomNumber, notes })
            });
            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? { ...b, roomAssignment: { ...(b.roomAssignment || { id: '', notes: '' }), roomNumber: roomNumber.trim(), notes: notes || b.roomAssignment?.notes } }
                    : b
            ));
        } catch (error) {
            console.error('Failed to assign room', error);
            alert('Gagal menyimpan penempatan kamar');
        } finally {
            setSavingRoom(null);
        }
    };

    // Smart Auto-Group Algorithm
    const handleAutoGroup = async () => {
        if (!selectedDepartureId || bookings.length === 0) return;
        if (!confirm('Auto-Group akan menyusun kamar otomatis berdasarkan jenis kelamin dan kapasitas tipe room untuk semua jamaah yang belum ditempatkan. Lanjutkan?')) return;

        setAutoGrouping(true);
        try {
            const updates: { bookingId: string; roomNumber: string }[] = [];

            // Helper to auto group an array of bookings
            const processGenderGroup = (genderBookings: Booking[], startRoomNum: number) => {
                let currentRoomNum = startRoomNum;
                // Subgroup by Room Type
                const byRoomType: Record<string, Booking[]> = {};
                genderBookings.forEach(b => {
                    const rtName = b.roomType?.name || 'Quad';
                    if (!byRoomType[rtName]) byRoomType[rtName] = [];
                    byRoomType[rtName].push(b);
                });

                Object.entries(byRoomType).forEach(([_, group]) => {
                    const capacity = group[0]?.roomType?.capacity || 4;
                    // Chunk group by capacity
                    for (let i = 0; i < group.length; i += capacity) {
                        const chunk = group.slice(i, i + capacity);
                        const assignedRoomNumber = String(currentRoomNum);
                        chunk.forEach(b => {
                            updates.push({ bookingId: b.id, roomNumber: assignedRoomNumber });
                        });
                        currentRoomNum++;
                    }
                });
            };

            const maleBookings = bookings.filter(b => b.pilgrim?.sex === 'L');
            const femaleBookings = bookings.filter(b => b.pilgrim?.sex === 'P');

            // Males start from room 101, Females from room 201
            processGenderGroup(maleBookings, 101);
            processGenderGroup(femaleBookings, 201);

            // Execute batch assignments sequentially
            for (const item of updates) {
                await apiFetch('/api/operations/rooming/assign', {
                    method: 'POST',
                    body: JSON.stringify({ bookingId: item.bookingId, roomNumber: item.roomNumber })
                });
            }

            // Refresh bookings
            await fetchBookings(selectedDepartureId);
            alert('Auto-Group kamar berhasil diselesaikan!');
        } catch (err: any) {
            console.error('Auto-group error:', err);
            alert('Terjadi kesalahan saat melakukan auto-grouping kamar.');
        } finally {
            setAutoGrouping(false);
        }
    };

    // Filtered Manifest Bookings
    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const p = b.pilgrim;
            const matchesSearch = !search ||
                p?.name?.toLowerCase().includes(search.toLowerCase()) ||
                p?.noKtp?.includes(search) ||
                p?.noPassport?.toLowerCase().includes(search.toLowerCase()) ||
                p?.phone?.includes(search);
            const matchesGender = filterGender === 'all' || p?.sex === filterGender;
            const matchesRoomType = filterRoomType === 'all' || (b.roomType?.name?.toLowerCase() === filterRoomType.toLowerCase());
            const matchesPayment = filterPayment === 'all' || b.paymentStatus === filterPayment;
            return matchesSearch && matchesGender && matchesRoomType && matchesPayment;
        });
    }, [bookings, search, filterGender, filterRoomType, filterPayment]);

    // Roomlist Grouping Structures
    const roomlistData = useMemo(() => {
        const buildSection = (gender: 'L' | 'P') => {
            const genderPax = bookings.filter(b => b.pilgrim?.sex === gender);
            // Group by Room Type
            const roomTypesMap: Record<string, {
                capacity: number;
                rooms: Record<string, Booking[]>;
                unassigned: Booking[];
            }> = {};

            genderPax.forEach(b => {
                const rtName = b.roomType?.name || 'Quad';
                const cap = b.roomType?.capacity || 4;
                if (!roomTypesMap[rtName]) {
                    roomTypesMap[rtName] = { capacity: cap, rooms: {}, unassigned: [] };
                }
                const roomNum = b.roomAssignment?.roomNumber?.trim();
                if (roomNum && roomNum !== '-' && roomNum !== '') {
                    if (!roomTypesMap[rtName].rooms[roomNum]) {
                        roomTypesMap[rtName].rooms[roomNum] = [];
                    }
                    roomTypesMap[rtName].rooms[roomNum].push(b);
                } else {
                    roomTypesMap[rtName].unassigned.push(b);
                }
            });

            return {
                totalPax: genderPax.length,
                roomTypesMap
            };
        };

        return {
            male: buildSection('L'),
            female: buildSection('P')
        };
    }, [bookings]);

    // Handle Drop onto a Room Number
    const handleDropOnRoom = (targetRoomNumber: string, targetGender: 'L' | 'P') => {
        if (!draggedBookingId) return;
        const dragged = bookings.find(b => b.id === draggedBookingId);
        if (!dragged) return;

        if (dragged.pilgrim?.sex !== targetGender) {
            alert(`Tidak dapat memindahkan jamaah ${dragged.pilgrim?.sex === 'L' ? 'Laki-laki' : 'Perempuan'} ke zona kamar ${targetGender === 'L' ? 'Laki-laki' : 'Perempuan'}.`);
            setDraggedBookingId(null);
            return;
        }

        handleAssignRoom(draggedBookingId, targetRoomNumber);
        setDraggedBookingId(null);
    };

    // Handle File Selection in Import Tab
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processLocalFile(file);
    };

    const processLocalFile = async (file: File) => {
        setImportFile(file);
        setImportResult(null);
        try {
            const arrayBuffer = await file.arrayBuffer();
            const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array', cellDates: true });
            const firstSheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: '' });
            setParsedPreview(json.slice(0, 15)); // First 15 preview rows

            // Simple validation check
            const errors: any[] = [];
            json.forEach((row, idx) => {
                const name = row['Nama Lengkap*'] || row['Nama Lengkap'] || row['Nama'] || row['Pax Name'];
                const nik = String(row['NIK (16 Digit)*'] || row['NIK'] || '').replace(/[^0-9]/g, '');
                const sex = String(row['Jenis Kelamin (L/P)*'] || row['Jenis Kelamin'] || row['Sex'] || '').toUpperCase();
                if (!name) errors.push({ row: idx + 2, msg: 'Nama lengkap kosong' });
                if (!nik || (nik.length !== 16 && nik.length !== 15)) errors.push({ row: idx + 2, msg: `NIK tidak 16 digit (${nik})` });
                if (!sex.startsWith('L') && !sex.startsWith('P') && !sex.includes('LAKI') && !sex.includes('PEREMPUAN')) {
                    errors.push({ row: idx + 2, msg: 'Jenis kelamin tidak valid' });
                }
            });
            setImportValidationErrors(errors);
        } catch (err: any) {
            console.error('Error previewing file', err);
            alert('File tidak valid atau format Excel rusak.');
        }
    };

    // Execute Import to Departure
    const handleExecuteImport = async () => {
        if (!importFile || !selectedDepartureId) return;
        setImporting(true);
        setImportResult(null);

        const formData = new FormData();
        formData.append('file', importFile);

        try {
            const { accessToken } = useAuthStore.getState();
            const res = await fetch(`${API_URL}/api/export/import-manifest/${selectedDepartureId}`, {
                method: 'POST',
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
                body: formData
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Gagal memproses import');
            }
            setImportResult(data);
            fetchBookings(selectedDepartureId);
        } catch (err: any) {
            console.error('Import execution error', err);
            alert(err.message || 'Gagal memproses import data');
        } finally {
            setImporting(false);
        }
    };

    const selectedDeparture = departures.find(d => d.id === selectedDepartureId);

    // Summary calculations
    const totalJamaah = bookings.length;
    const totalMale = bookings.filter(b => b.pilgrim?.sex === 'L').length;
    const totalFemale = bookings.filter(b => b.pilgrim?.sex === 'P').length;
    const totalAssigned = bookings.filter(b => b.roomAssignment?.roomNumber && b.roomAssignment.roomNumber !== '-').length;

    return (
        <div className="animate-in fade-in duration-500" style={{ paddingBottom: '4rem' }}>
            {/* Top Header & Departure Selector */}
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
                            assignment
                        </span>
                        Manifest & Roomlist Hotel
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                        Export/import data manifest jamaah per keberangkatan dan pengelompokan kamar hotel berdasarkan gender & tipe kamar
                    </p>
                </div>

                {/* Departure Picker */}
                <div style={{
                    background: '#1a1917',
                    border: '1px solid rgba(200,168,81,0.3)',
                    borderRadius: '0.75rem',
                    padding: '0.5rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>
                        calendar_month
                    </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Keberangkatan:</span>
                    <select
                        value={selectedDepartureId}
                        onChange={(e) => setSelectedDepartureId(e.target.value)}
                        style={{
                            background: '#0a0907',
                            border: '1px solid #333',
                            color: 'var(--color-primary)',
                            padding: '0.4rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        {departures.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.departureDate} — {d.package?.name || 'Paket Umroh'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 0.25rem 0', fontWeight: 600 }}>TOTAL JAMAAH</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0 }}>{totalJamaah} <span style={{ fontSize: '0.875rem', color: '#888', fontWeight: 500 }}>Pax</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#60a5fa', margin: '0 0 0.25rem 0', fontWeight: 600 }}>LAKI-LAKI</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#93c5fd', margin: 0 }}>{totalMale} <span style={{ fontSize: '0.875rem', color: '#888', fontWeight: 500 }}>Pax</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(236,72,153,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#f472b6', margin: '0 0 0.25rem 0', fontWeight: 600 }}>PEREMPUAN</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbcfe8', margin: 0 }}>{totalFemale} <span style={{ fontSize: '0.875rem', color: '#888', fontWeight: 500 }}>Pax</span></p>
                </div>
                <div style={{ background: '#1a1917', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#4ade80', margin: '0 0 0.25rem 0', fontWeight: 600 }}>STATUS KAMAR</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac', margin: 0 }}>
                        {totalAssigned}/{totalJamaah} <span style={{ fontSize: '0.875rem', color: '#888', fontWeight: 500 }}>Ditempatkan</span>
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid var(--color-border)',
                marginBottom: '1.5rem'
            }}>
                <button
                    onClick={() => setActiveTab('manifest')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'manifest' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        color: activeTab === 'manifest' ? 'var(--color-primary)' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list_alt</span>
                    Manifest Jamaah ({bookings.length})
                </button>
                <button
                    onClick={() => setActiveTab('roomlist')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'roomlist' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        color: activeTab === 'roomlist' ? 'var(--color-primary)' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hotel</span>
                    Roomlist Hotel (Drag & Drop)
                </button>
                <button
                    onClick={() => setActiveTab('import')}
                    style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'import' ? '3px solid var(--color-primary)' : '3px solid transparent',
                        color: activeTab === 'import' ? 'var(--color-primary)' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                    Import Data Manifest
                </button>
            </div>

            {/* TAB 1: MANIFEST DATA */}
            {activeTab === 'manifest' && (
                <div>
                    {/* Action & Filter Toolbar */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1rem',
                        background: '#141310',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        {/* Search & Filters */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="Cari Nama, NIK, Paspor, HP..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{
                                        padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.8125rem',
                                        width: '220px',
                                        outline: 'none'
                                    }}
                                />
                                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#666' }}>
                                    search
                                </span>
                            </div>

                            <select
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value as any)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: '#0a0907',
                                    border: '1px solid #333',
                                    borderRadius: '0.5rem',
                                    color: '#ccc',
                                    fontSize: '0.8125rem'
                                }}
                            >
                                <option value="all">Semua Gender</option>
                                <option value="L">Laki-laki (L)</option>
                                <option value="P">Perempuan (P)</option>
                            </select>

                            <select
                                value={filterRoomType}
                                onChange={(e) => setFilterRoomType(e.target.value)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: '#0a0907',
                                    border: '1px solid #333',
                                    borderRadius: '0.5rem',
                                    color: '#ccc',
                                    fontSize: '0.8125rem'
                                }}
                            >
                                <option value="all">Semua Tipe Kamar</option>
                                <option value="Quad">Quad (4 Pax)</option>
                                <option value="Triple">Triple (3 Pax)</option>
                                <option value="Double">Double (2 Pax)</option>
                            </select>

                            <select
                                value={filterPayment}
                                onChange={(e) => setFilterPayment(e.target.value)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    background: '#0a0907',
                                    border: '1px solid #333',
                                    borderRadius: '0.5rem',
                                    color: '#ccc',
                                    fontSize: '0.8125rem'
                                }}
                            >
                                <option value="all">Semua Pembayaran</option>
                                <option value="paid">Lunas (Paid)</option>
                                <option value="partial">Cicilan (Partial)</option>
                                <option value="unpaid">Belum Bayar (Unpaid)</option>
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => handleDownload(`/api/export/manifest-excel/${selectedDepartureId}`, `Manifest_${selectedDeparture?.departureDate || 'umroh'}.xlsx`, 'manifest-excel')}
                                disabled={downloading === 'manifest-excel' || bookings.length === 0}
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
                                {downloading === 'manifest-excel' ? 'Mengunduh...' : 'Export Excel (4 Sheet)'}
                            </button>

                            <button
                                onClick={() => handleDownload(`/api/export/manifest/${selectedDepartureId}`, `Manifest_${selectedDeparture?.departureDate || 'umroh'}.csv`, 'manifest-csv')}
                                disabled={downloading === 'manifest-csv' || bookings.length === 0}
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    background: '#1a1917',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '0.5rem',
                                    color: '#60a5fa',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>table_view</span>
                                CSV Manifest
                            </button>

                            <button
                                onClick={() => handleDownload(`/api/export/siskopatuh/${selectedDepartureId}`, `Siskopatuh_${selectedDeparture?.departureDate || 'umroh'}.csv`, 'siskopatuh')}
                                disabled={downloading === 'siskopatuh' || bookings.length === 0}
                                style={{
                                    padding: '0.5rem 0.875rem',
                                    background: '#1a1917',
                                    border: '1px solid #eab308',
                                    borderRadius: '0.5rem',
                                    color: '#facc15',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bar_chart</span>
                                SISKOPATUH
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: '#888' }}>
                            <div className="animate-spin" style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '1rem' }} />
                            <p>Memuat data manifest...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: '#1a1917', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#555', marginBottom: '0.5rem' }}>group_off</span>
                            <p style={{ color: '#aaa', margin: '0 0 1rem 0' }}>Belum ada data jamaah yang terdaftar atau cocok dengan filter pencarian.</p>
                            <button
                                onClick={() => setActiveTab('import')}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--color-primary)',
                                    color: '#000',
                                    fontWeight: 700,
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Import Jamaah dari Excel
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>No</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Jamaah</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>NIK</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Paspor</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Gender</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Tgl Lahir</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Kontak / HP</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Tipe Kamar</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>No Kamar</th>
                                        <th style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>Status Bayar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((b, idx) => (
                                        <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '0.75rem 1rem', color: '#666', fontWeight: 600 }}>{idx + 1}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: b.pilgrim?.sex === 'L' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
                                                        color: b.pilgrim?.sex === 'L' ? '#60a5fa' : '#f472b6',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 800,
                                                        fontSize: '0.75rem'
                                                    }}>
                                                        {b.pilgrim?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 700, color: 'white' }}>{b.pilgrim?.name}</p>
                                                        <span style={{ fontSize: '0.6875rem', color: '#666' }}>ID: {b.id.substring(0, 8).toUpperCase()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#ccc' }}>
                                                {b.pilgrim?.noKtp || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {b.pilgrim?.noPassport ? (
                                                    <div>
                                                        <span style={{ fontWeight: 700, color: '#facc15', fontFamily: 'monospace' }}>{b.pilgrim.noPassport}</span>
                                                        <p style={{ margin: 0, fontSize: '0.6875rem', color: '#888' }}>Exp: {b.pilgrim.passportExpiry || '-'}</p>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#666', fontStyle: 'italic', fontSize: '0.75rem' }}>Belum Terbit</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: b.pilgrim?.sex === 'L' ? 'rgba(59,130,246,0.15)' : 'rgba(236,72,153,0.15)',
                                                    color: b.pilgrim?.sex === 'L' ? '#93c5fd' : '#fbcfe8'
                                                }}>
                                                    {b.pilgrim?.sex === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#aaa' }}>
                                                {b.pilgrim?.born || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#ccc' }}>
                                                {b.pilgrim?.phone || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: 'rgba(139,92,246,0.15)',
                                                    color: '#c4b5fd'
                                                }}>
                                                    {b.roomType?.name || 'Double'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                {b.roomAssignment?.roomNumber ? (
                                                    <span style={{
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: '0.375rem',
                                                        background: '#0a0907',
                                                        border: '1px solid rgba(34,197,94,0.4)',
                                                        color: '#4ade80',
                                                        fontWeight: 700,
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        #{b.roomAssignment.roomNumber}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#666', fontSize: '0.75rem', fontStyle: 'italic' }}>Belum Diatur</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    background: b.paymentStatus === 'paid' ? 'rgba(34,197,94,0.15)' : b.paymentStatus === 'partial' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                                    color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#facc15' : '#f87171',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {b.paymentStatus || 'unpaid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: ROOMLIST HOTEL (DRAG & DROP) */}
            {activeTab === 'roomlist' && (
                <div>
                    {/* Roomlist Header & Actions */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                        background: '#141310',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid var(--color-border)'
                    }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                                🏨 Board Penempatan Kamar Hotel
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                                Drag & drop kartu jamaah ke kamar tujuan. Gender dikelompokkan secara otomatis & terkunci.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={handleAutoGroup}
                                disabled={autoGrouping || bookings.length === 0}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--color-primary)',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                    boxShadow: '0 2px 10px rgba(200,168,81,0.3)'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {autoGrouping ? 'sync' : 'auto_fix_high'}
                                </span>
                                {autoGrouping ? 'Menyusun Kamar...' : '🔄 Auto-Group Kamar'}
                            </button>

                            <button
                                onClick={() => handleDownload(`/api/export/roomlist-excel/${selectedDepartureId}`, `Roomlist_${selectedDeparture?.departureDate || 'umroh'}.xlsx`, 'roomlist-excel')}
                                disabled={downloading === 'roomlist-excel' || bookings.length === 0}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#1a1917',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                {downloading === 'roomlist-excel' ? 'Mengunduh...' : 'Export Roomlist Excel'}
                            </button>
                        </div>
                    </div>

                    {/* TWO BIG SECTIONS: MALE & FEMALE */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '1.5rem' }}>

                        {/* SECTION 1: LAKI-LAKI */}
                        <div style={{
                            background: '#161513',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: '1rem',
                            padding: '1.25rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(59,130,246,0.2)',
                                paddingBottom: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'rgba(59,130,246,0.2)',
                                        color: '#60a5fa',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800
                                    }}>♂</span>
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#93c5fd' }}>
                                        Kamar Jamaah Laki-laki ({roomlistData.male.totalPax} Pax)
                                    </h3>
                                </div>
                            </div>

                            {/* Render Room Types for Males */}
                            {Object.entries(roomlistData.male.roomTypesMap).length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', padding: '1rem 0' }}>Belum ada jamaah laki-laki terdaftar.</p>
                            ) : (
                                Object.entries(roomlistData.male.roomTypesMap).map(([rtName, rtData]) => (
                                    <div key={rtName} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#c8a851'
                                            }}>
                                                ── Tipe {rtName} ({rtData.capacity} Pax / Kamar) ──
                                            </span>
                                            {/* Add Room Quick Button */}
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="No Kamar"
                                                    value={newRoomNumberInput[`L_${rtName}`] || ''}
                                                    onChange={(e) => setNewRoomNumberInput(prev => ({ ...prev, [`L_${rtName}`]: e.target.value }))}
                                                    style={{
                                                        width: '70px',
                                                        padding: '0.2rem 0.4rem',
                                                        fontSize: '0.6875rem',
                                                        background: '#0a0907',
                                                        border: '1px solid #333',
                                                        color: 'white',
                                                        borderRadius: '0.25rem'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const val = (newRoomNumberInput[`L_${rtName}`] || '').trim();
                                                        if (!val) return;
                                                        if (rtData.unassigned.length > 0) {
                                                            handleAssignRoom(rtData.unassigned[0].id, val);
                                                            setNewRoomNumberInput(prev => ({ ...prev, [`L_${rtName}`]: '' }));
                                                        } else {
                                                            alert('Pilih/drag jamaah ke kamar ini atau tambahkan jamaah terlebih dahulu');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.2rem 0.5rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        background: '#333',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.25rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    + Buka Kamar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Room Cards Grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                                            gap: '0.75rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {Object.entries(rtData.rooms).map(([roomNum, occupants]) => {
                                                const isFull = occupants.length >= rtData.capacity;
                                                return (
                                                    <div
                                                        key={roomNum}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={() => handleDropOnRoom(roomNum, 'L')}
                                                        style={{
                                                            background: '#0a0907',
                                                            border: isFull ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(234,179,8,0.4)',
                                                            borderRadius: '0.625rem',
                                                            padding: '0.75rem',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        {/* Room Card Header */}
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '0.5rem',
                                                            paddingBottom: '0.375rem',
                                                            borderBottom: '1px solid #222'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>door_front</span>
                                                                <span style={{ fontWeight: 800, color: 'white', fontSize: '0.875rem' }}>Kamar #{roomNum}</span>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 700,
                                                                padding: '0.125rem 0.375rem',
                                                                borderRadius: '0.25rem',
                                                                background: isFull ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                                                color: isFull ? '#4ade80' : '#facc15'
                                                            }}>
                                                                {occupants.length}/{rtData.capacity} {isFull ? 'Penuh' : 'Terisi'}
                                                            </span>
                                                        </div>

                                                        {/* Occupant Slots */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                            {occupants.map(pax => (
                                                                <div
                                                                    key={pax.id}
                                                                    draggable
                                                                    onDragStart={() => setDraggedBookingId(pax.id)}
                                                                    style={{
                                                                        padding: '0.375rem 0.5rem',
                                                                        background: '#1a1917',
                                                                        border: '1px solid #333',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.75rem',
                                                                        cursor: 'grab',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <div style={{ overflow: 'hidden' }}>
                                                                        <p style={{ margin: 0, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                            👤 {pax.pilgrim?.name}
                                                                        </p>
                                                                        <span style={{ fontSize: '0.625rem', color: '#888' }}>
                                                                            {pax.pilgrim?.noPassport || pax.pilgrim?.phone || '-'}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleAssignRoom(pax.id, '')}
                                                                        title="Keluarkan dari kamar"
                                                                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '0 0.25rem' }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Empty Slots */}
                                                            {Array.from({ length: Math.max(0, rtData.capacity - occupants.length) }).map((_, slotIdx) => (
                                                                <div
                                                                    key={slotIdx}
                                                                    style={{
                                                                        padding: '0.375rem 0.5rem',
                                                                        border: '1px dashed #333',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.6875rem',
                                                                        color: '#555',
                                                                        textAlign: 'center',
                                                                        fontStyle: 'italic'
                                                                    }}
                                                                >
                                                                    + Slot Kosong (Drop di sini)
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Unassigned Pool for this Room Type */}
                                        {rtData.unassigned.length > 0 && (
                                            <div style={{
                                                background: 'rgba(239,68,68,0.05)',
                                                border: '1px dashed rgba(239,68,68,0.3)',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <p style={{ margin: '0 0 0.375rem 0', fontSize: '0.6875rem', fontWeight: 700, color: '#f87171' }}>
                                                    ⚠️ Belum Masuk Kamar ({rtData.unassigned.length} Pax):
                                                </p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                                    {rtData.unassigned.map(pax => (
                                                        <div
                                                            key={pax.id}
                                                            draggable
                                                            onDragStart={() => setDraggedBookingId(pax.id)}
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                background: '#1a1917',
                                                                border: '1px solid rgba(239,68,68,0.4)',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                color: 'white',
                                                                cursor: 'grab',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem'
                                                            }}
                                                        >
                                                            <span>👤 {pax.pilgrim?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* SECTION 2: PEREMPUAN */}
                        <div style={{
                            background: '#161513',
                            border: '1px solid rgba(236,72,153,0.3)',
                            borderRadius: '1rem',
                            padding: '1.25rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(236,72,153,0.2)',
                                paddingBottom: '0.75rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: 'rgba(236,72,153,0.2)',
                                        color: '#f472b6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800
                                    }}>♀</span>
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#fbcfe8' }}>
                                        Kamar Jamaah Perempuan ({roomlistData.female.totalPax} Pax)
                                    </h3>
                                </div>
                            </div>

                            {/* Render Room Types for Females */}
                            {Object.entries(roomlistData.female.roomTypesMap).length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic', padding: '1rem 0' }}>Belum ada jamaah perempuan terdaftar.</p>
                            ) : (
                                Object.entries(roomlistData.female.roomTypesMap).map(([rtName, rtData]) => (
                                    <div key={rtName} style={{ marginBottom: '1.5rem' }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '0.75rem'
                                        }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                letterSpacing: '0.05em',
                                                textTransform: 'uppercase',
                                                color: '#c8a851'
                                            }}>
                                                ── Tipe {rtName} ({rtData.capacity} Pax / Kamar) ──
                                            </span>
                                            {/* Add Room Quick Button */}
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <input
                                                    type="text"
                                                    placeholder="No Kamar"
                                                    value={newRoomNumberInput[`P_${rtName}`] || ''}
                                                    onChange={(e) => setNewRoomNumberInput(prev => ({ ...prev, [`P_${rtName}`]: e.target.value }))}
                                                    style={{
                                                        width: '70px',
                                                        padding: '0.2rem 0.4rem',
                                                        fontSize: '0.6875rem',
                                                        background: '#0a0907',
                                                        border: '1px solid #333',
                                                        color: 'white',
                                                        borderRadius: '0.25rem'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => {
                                                        const val = (newRoomNumberInput[`P_${rtName}`] || '').trim();
                                                        if (!val) return;
                                                        if (rtData.unassigned.length > 0) {
                                                            handleAssignRoom(rtData.unassigned[0].id, val);
                                                            setNewRoomNumberInput(prev => ({ ...prev, [`P_${rtName}`]: '' }));
                                                        } else {
                                                            alert('Pilih/drag jamaah ke kamar ini atau tambahkan jamaah terlebih dahulu');
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '0.2rem 0.5rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        background: '#333',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.25rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    + Buka Kamar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Room Cards Grid */}
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                                            gap: '0.75rem',
                                            marginBottom: '0.75rem'
                                        }}>
                                            {Object.entries(rtData.rooms).map(([roomNum, occupants]) => {
                                                const isFull = occupants.length >= rtData.capacity;
                                                return (
                                                    <div
                                                        key={roomNum}
                                                        onDragOver={(e) => e.preventDefault()}
                                                        onDrop={() => handleDropOnRoom(roomNum, 'P')}
                                                        style={{
                                                            background: '#0a0907',
                                                            border: isFull ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(234,179,8,0.4)',
                                                            borderRadius: '0.625rem',
                                                            padding: '0.75rem',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                                                        }}
                                                    >
                                                        {/* Room Card Header */}
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginBottom: '0.5rem',
                                                            paddingBottom: '0.375rem',
                                                            borderBottom: '1px solid #222'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--color-primary)' }}>door_front</span>
                                                                <span style={{ fontWeight: 800, color: 'white', fontSize: '0.875rem' }}>Kamar #{roomNum}</span>
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 700,
                                                                padding: '0.125rem 0.375rem',
                                                                borderRadius: '0.25rem',
                                                                background: isFull ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                                                color: isFull ? '#4ade80' : '#facc15'
                                                            }}>
                                                                {occupants.length}/{rtData.capacity} {isFull ? 'Penuh' : 'Terisi'}
                                                            </span>
                                                        </div>

                                                        {/* Occupant Slots */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                            {occupants.map(pax => (
                                                                <div
                                                                    key={pax.id}
                                                                    draggable
                                                                    onDragStart={() => setDraggedBookingId(pax.id)}
                                                                    style={{
                                                                        padding: '0.375rem 0.5rem',
                                                                        background: '#1a1917',
                                                                        border: '1px solid #333',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.75rem',
                                                                        cursor: 'grab',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center'
                                                                    }}
                                                                >
                                                                    <div style={{ overflow: 'hidden' }}>
                                                                        <p style={{ margin: 0, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                            👤 {pax.pilgrim?.name}
                                                                        </p>
                                                                        <span style={{ fontSize: '0.625rem', color: '#888' }}>
                                                                            {pax.pilgrim?.noPassport || pax.pilgrim?.phone || '-'}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleAssignRoom(pax.id, '')}
                                                                        title="Keluarkan dari kamar"
                                                                        style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '0 0.25rem' }}
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}

                                                            {/* Empty Slots */}
                                                            {Array.from({ length: Math.max(0, rtData.capacity - occupants.length) }).map((_, slotIdx) => (
                                                                <div
                                                                    key={slotIdx}
                                                                    style={{
                                                                        padding: '0.375rem 0.5rem',
                                                                        border: '1px dashed #333',
                                                                        borderRadius: '0.375rem',
                                                                        fontSize: '0.6875rem',
                                                                        color: '#555',
                                                                        textAlign: 'center',
                                                                        fontStyle: 'italic'
                                                                    }}
                                                                >
                                                                    + Slot Kosong (Drop di sini)
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Unassigned Pool for this Room Type */}
                                        {rtData.unassigned.length > 0 && (
                                            <div style={{
                                                background: 'rgba(239,68,68,0.05)',
                                                border: '1px dashed rgba(239,68,68,0.3)',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem',
                                                marginBottom: '0.75rem'
                                            }}>
                                                <p style={{ margin: '0 0 0.375rem 0', fontSize: '0.6875rem', fontWeight: 700, color: '#f87171' }}>
                                                    ⚠️ Belum Masuk Kamar ({rtData.unassigned.length} Pax):
                                                </p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                                    {rtData.unassigned.map(pax => (
                                                        <div
                                                            key={pax.id}
                                                            draggable
                                                            onDragStart={() => setDraggedBookingId(pax.id)}
                                                            style={{
                                                                padding: '0.25rem 0.5rem',
                                                                background: '#1a1917',
                                                                border: '1px solid rgba(239,68,68,0.4)',
                                                                borderRadius: '0.25rem',
                                                                fontSize: '0.6875rem',
                                                                fontWeight: 600,
                                                                color: 'white',
                                                                cursor: 'grab',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.25rem'
                                                            }}
                                                        >
                                                            <span>👤 {pax.pilgrim?.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: IMPORT DATA MANIFEST */}
            {activeTab === 'import' && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{
                        background: '#1a1917',
                        border: '1px solid var(--color-border)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                                    📥 Import Data Manifest dari File Excel
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#888' }}>
                                    Unggah file Excel manifest untuk menambahkan jamaah baru atau memperbarui data jamaah keberangkatan ini.
                                </p>
                            </div>
                            <button
                                onClick={() => handleDownload('/api/export/manifest-template', 'Template_Import_Manifest_Umroh.xlsx', 'template')}
                                disabled={downloading === 'template'}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'rgba(200,168,81,0.1)',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    borderRadius: '0.5rem',
                                    fontWeight: 700,
                                    fontSize: '0.8125rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                Download Template Excel
                            </button>
                        </div>

                        {/* File Dropzone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) processLocalFile(file);
                            }}
                            style={{
                                border: '2px dashed rgba(200,168,81,0.4)',
                                borderRadius: '1rem',
                                padding: '3rem 2rem',
                                textAlign: 'center',
                                background: '#141310',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                marginBottom: '1.5rem'
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
                                cloud_upload
                            </span>
                            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>
                                {importFile ? importFile.name : 'Klik atau Drag & Drop file Excel (.xlsx) di sini'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#888', margin: 0 }}>
                                {importFile ? `${(importFile.size / 1024).toFixed(1)} KB — Siap diproses` : 'Format file: .xlsx (Sesuai format template)'}
                            </p>
                        </div>

                        {/* Validation & Preview Summary */}
                        {parsedPreview.length > 0 && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '0.75rem'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#ccc' }}>
                                        Preview Data Excel ({parsedPreview.length} Baris Pertama)
                                    </h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: importValidationErrors.length > 0 ? '#f87171' : '#4ade80'
                                    }}>
                                        {importValidationErrors.length > 0
                                            ? `⚠️ Terdapat ${importValidationErrors.length} catatan/peringatan validasi`
                                            : '✅ Semua baris data tampak valid'}
                                    </span>
                                </div>

                                <div style={{ overflowX: 'auto', maxHeight: '250px', border: '1px solid #333', borderRadius: '0.5rem' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                                        <thead>
                                            <tr style={{ background: '#222', color: '#888' }}>
                                                {Object.keys(parsedPreview[0] || {}).slice(0, 7).map(col => (
                                                    <th key={col} style={{ padding: '0.5rem', borderBottom: '1px solid #333' }}>{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedPreview.map((row, rIdx) => (
                                                <tr key={rIdx} style={{ borderBottom: '1px solid #222' }}>
                                                    {Object.values(row).slice(0, 7).map((val: any, cIdx) => (
                                                        <td key={cIdx} style={{ padding: '0.5rem', color: '#ccc' }}>{String(val)}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Import Result Notification */}
                        {importResult && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: importResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                border: importResult.success ? '1px solid #22c55e' : '1px solid #ef4444',
                                marginBottom: '1.5rem'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: importResult.success ? '#4ade80' : '#f87171', fontWeight: 800 }}>
                                    {importResult.message || 'Hasil Import Data'}
                                </h4>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: '#ccc' }}>
                                    <span>➕ Baru: <strong>{importResult.imported || 0}</strong></span>
                                    <span>🔄 Update: <strong>{importResult.updated || 0}</strong></span>
                                    {importResult.skipped > 0 && <span>⏭️ Dilewati: <strong>{importResult.skipped}</strong></span>}
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={handleExecuteImport}
                                disabled={!importFile || importing}
                                style={{
                                    padding: '0.75rem 2rem',
                                    background: !importFile || importing ? '#333' : 'linear-gradient(135deg, #c8a851 0%, #a88934 100%)',
                                    color: !importFile || importing ? '#666' : '#000',
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: !importFile || importing ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 15px rgba(200,168,81,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                    {importing ? 'sync' : 'upload'}
                                </span>
                                {importing ? 'Memproses Import...' : `Proses Import ke ${selectedDeparture?.departureDate || 'Keberangkatan Ini'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManifestRoomlist;
