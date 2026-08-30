import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface AttendanceRecord {
    id: string;
    userId: string;
    locationId?: string | null;
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
    checkOutAddress?: string | null;
    checkOutNotes?: string | null;
    durationMinutes?: number;
    status: string;
    location?: { id: string; name: string } | null;
    fieldVisits?: FieldVisit[];
}

interface FieldVisit {
    id: string;
    clientName: string;
    purpose: string;
    notes?: string | null;
    photoUrl?: string | null;
    latitude: number;
    longitude: number;
    address?: string | null;
    visitedAt: string;
}

interface OfficeLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    radius_meters?: number;
    address?: string | null;
}

export const AttendancePage: React.FC = () => {
    const { user } = useAuthStore();
    const isSalesRoleDefault = ['agen', 'reseller', 'mitra'].includes(user?.role || '');

    const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
    const [now, setNow] = useState<Date>(new Date());

    // Permission from backend
    const [canFieldAttendance, setCanFieldAttendance] = useState<boolean>(isSalesRoleDefault);

    // GPS State
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [gpsLoading, setGpsLoading] = useState<boolean>(true);
    const [gpsError, setGpsError] = useState<string | null>(null);

    // Attendance Data
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
    const [nearestOffice, setNearestOffice] = useState<{ loc: OfficeLocation; dist: number; radius: number } | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Form inputs
    const [notes, setNotes] = useState<string>('');
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState<boolean>(false);

    // Field Visit Form (Sales / Field)
    const [showVisitForm, setShowVisitForm] = useState<boolean>(false);
    const [visitClientName, setVisitClientName] = useState<string>('');
    const [visitPurpose, setVisitPurpose] = useState<string>('Presentasi Paket Umroh');
    const [visitNotes, setVisitNotes] = useState<string>('');
    const [visitSubmitting, setVisitSubmitting] = useState<boolean>(false);

    // History Tab
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
    const [historyLogs, setHistoryLogs] = useState<AttendanceRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // Camera elements
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Live Clock Ticker
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Haversine formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const p1 = (lat1 * Math.PI) / 180;
        const p2 = (lat2 * Math.PI) / 180;
        const dp = ((lat2 - lat1) * Math.PI) / 180;
        const dl = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    const calculateNearest = (userLat: number, userLng: number, locs: OfficeLocation[]) => {
        if (!locs || locs.length === 0) {
            setNearestOffice(null);
            return;
        }
        let nearest: { loc: OfficeLocation; dist: number; radius: number } | null = null;
        locs.forEach(loc => {
            const d = getDistance(userLat, userLng, loc.latitude, loc.longitude);
            const r = loc.radiusMeters || loc.radius_meters || 150;
            if (!nearest || d < nearest.dist) {
                nearest = { loc, dist: d, radius: r };
            }
        });
        setNearestOffice(nearest);
    };

    const fetchLocation = (locs = officeLocations) => {
        setGpsLoading(true);
        setGpsError(null);
        if (!navigator.geolocation) {
            setGpsError('Browser tidak mendukung Geolocation.');
            setGpsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCoords({ lat, lng });
                setGpsAccuracy(Math.round(pos.coords.accuracy));
                setGpsLoading(false);

                calculateNearest(lat, lng, locs);
            },
            (err) => {
                setGpsError(`Gagal mendeteksi lokasi (${err.message}). Pastikan izin lokasi/GPS aktif.`);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const loadTodayStatus = async () => {
        try {
            const data = await apiFetch<any>('/api/attendance/today');
            setTodayAttendance(data.attendance || null);
            const locs: OfficeLocation[] = data.locations || [];
            setOfficeLocations(locs);

            if (data.user?.canFieldAttendance !== undefined) {
                setCanFieldAttendance(data.user.canFieldAttendance);
            }

            fetchLocation(locs);
        } catch (err: any) {
            console.error('Failed to load today attendance', err);
        }
    };

    useEffect(() => {
        loadTodayStatus();
    }, []);

    // Load monthly history
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory(selectedMonth);
        }
    }, [activeTab, selectedMonth]);

    const loadHistory = async (month: string) => {
        setLoadingHistory(true);
        try {
            const data = await apiFetch<any>(`/api/attendance/my-history?month=${month}`);
            setHistoryLogs(data.logs || []);
        } catch (err) {
            console.error('Failed to load history', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    // Camera Stream
    const startCamera = async () => {
        setCameraActive(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            fileInputRef.current?.click();
            setCameraActive(false);
        }
    };

    const snapPhoto = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotoBase64(dataUrl);
        }
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        setCameraActive(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPhotoBase64(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Actions
    const handleCheckIn = async () => {
        if (!coords) {
            alert('Lokasi GPS belum terdeteksi. Silakan segarkan GPS terlebih dahulu.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                latitude: coords.lat,
                longitude: coords.lng,
                photo_url: photoBase64,
                notes: notes.trim(),
                address: canFieldAttendance ? 'Tugas Lapangan / Sales' : nearestOffice?.loc.name || 'Kantor'
            };

            const res = await apiFetch<any>('/api/attendance/check-in', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert(res.message || 'Presensi masuk berhasil dicatat!');
            setPhotoBase64(null);
            setNotes('');
            loadTodayStatus();
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan presensi masuk');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckOut = async () => {
        if (!confirm('Apakah Anda yakin ingin melakukan check-out absensi pulang sekarang?')) return;

        setSubmitting(true);
        try {
            const payload = {
                latitude: coords?.lat,
                longitude: coords?.lng,
                notes: notes.trim(),
            };

            const res = await apiFetch<any>('/api/attendance/check-out', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert(res.message || 'Presensi pulang berhasil dicatat!');
            loadTodayStatus();
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan check-out');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveFieldVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitClientName.trim()) {
            alert('Nama Klien / Calon Jamaah wajib diisi');
            return;
        }

        setVisitSubmitting(true);
        try {
            const payload = {
                clientName: visitClientName.trim(),
                purpose: visitPurpose,
                notes: visitNotes.trim(),
                latitude: coords?.lat || 0,
                longitude: coords?.lng || 0,
                address: 'Lokasi Kunjungan Lapangan'
            };

            await apiFetch('/api/attendance/field-visit', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert('Log kunjungan lapangan berhasil dicatat!');
            setShowVisitForm(false);
            setVisitClientName('');
            setVisitNotes('');
            loadTodayStatus();
        } catch (err: any) {
            alert(err.message || 'Gagal mencatat kunjungan');
        } finally {
            setVisitSubmitting(false);
        }
    };

    const isInsideOfficeRadius = nearestOffice ? nearestOffice.dist <= nearestOffice.radius : false;
    const isWithinGeofence = canFieldAttendance || isInsideOfficeRadius;

    // Live Timer Calculation
    const getFormattedWorkingTimer = () => {
        if (!todayAttendance?.checkInAt) return { timer: '00:00:00', hours: 0, minutes: 0, seconds: 0, isFinished: false };
        const isFinished = !!todayAttendance.checkOutAt;
        const checkInTime = new Date(todayAttendance.checkInAt).getTime();
        const endTime = (isFinished && todayAttendance.checkOutAt) ? new Date(todayAttendance.checkOutAt).getTime() : now.getTime();
        const diffMs = Math.max(0, endTime - checkInTime);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, '0');
        return {
            timer: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
            hours,
            minutes,
            seconds,
            isFinished
        };
    };

    const liveWork = getFormattedWorkingTimer();

    return (
        <div style={{ maxWidth: '460px', margin: '0 auto', paddingBottom: '5.5rem' }}>
            {/* Header: Clock & Indonesian Date */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h1 style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    color: 'var(--color-primary)',
                    margin: 0,
                    letterSpacing: '0.05em',
                    lineHeight: 1.1
                }}>
                    {now.toLocaleTimeString('id-ID', { hour12: false })} <span style={{ fontSize: '1rem', color: '#888', fontWeight: 700 }}>WIB</span>
                </h1>
                <p style={{ color: 'var(--color-text-muted)', margin: '0.375rem 0 0 0', fontSize: '0.875rem', fontWeight: 600 }}>
                    {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Mode Banner: Otomatis berdasarkan izin user */}
            {canFieldAttendance ? (
                <div style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '24px' }}>travel_explore</span>
                    <div style={{ fontSize: '0.75rem', color: '#93c5fd' }}>
                        <strong>Mode Absen Bebas / Lapangan Aktif:</strong> Akun Anda diizinkan absen di mana saja tanpa batas radius kantor.
                    </div>
                </div>
            ) : (
                <div style={{
                    background: 'rgba(200,168,81,0.08)',
                    border: '1px solid rgba(200,168,81,0.25)',
                    borderRadius: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem'
                }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>business</span>
                    <div style={{ fontSize: '0.75rem', color: '#e5e7eb' }}>
                        <strong>Presensi Kantor:</strong> Pastikan Anda berada di dalam radius area kantor.
                    </div>
                </div>
            )}

            {/* Main Tabs (Hari Ini / Riwayat) */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.375rem',
                background: '#141310',
                padding: '0.25rem',
                borderRadius: '0.75rem',
                border: '1px solid #333',
                marginBottom: '1.25rem'
            }}>
                <button
                    type="button"
                    onClick={() => setActiveTab('today')}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        background: activeTab === 'today' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'today' ? '#000' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>today</span>
                    Presensi Hari Ini
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        fontSize: '0.8125rem',
                        fontWeight: 800,
                        background: activeTab === 'history' ? 'var(--color-primary)' : 'transparent',
                        color: activeTab === 'history' ? '#000' : '#888',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.375rem',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>calendar_month</span>
                    Riwayat Bulanan
                </button>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: PRESENSI HARI INI */}
            {/* ======================================================== */}
            {activeTab === 'today' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Main Check-In Card */}
                    <div style={{
                        background: '#1a1917',
                        border: '1px solid var(--color-border)',
                        borderRadius: '1.25rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        position: 'relative'
                    }}>
                        {/* Circular Central Avatar / Selfie Preview / Fingerprint */}
                        <div style={{
                            width: '96px',
                            height: '96px',
                            margin: '0 auto 1rem auto',
                            borderRadius: '9999px',
                            background: photoBase64 ? 'transparent' : todayAttendance ? 'rgba(34,197,94,0.15)' : 'rgba(200,168,81,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${photoBase64 ? 'var(--color-primary)' : todayAttendance ? '#4ade80' : 'var(--color-primary)'}`,
                            overflow: 'hidden',
                            boxShadow: '0 0 25px rgba(200,168,81,0.15)'
                        }}>
                            {photoBase64 ? (
                                <img src={photoBase64} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : todayAttendance?.checkInPhotoUrl ? (
                                <img src={todayAttendance.checkInPhotoUrl} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span className="material-symbols-outlined" style={{
                                    fontSize: '48px',
                                    color: todayAttendance ? (todayAttendance.checkOutAt ? '#4ade80' : 'var(--color-primary)') : 'var(--color-primary)'
                                }}>
                                    {todayAttendance ? (todayAttendance.checkOutAt ? 'task_alt' : 'timer') : 'fingerprint'}
                                </span>
                            )}
                        </div>

                        {/* Status Title */}
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', margin: '0 0 0.25rem 0' }}>
                            {todayAttendance
                                ? (todayAttendance.checkOutAt ? 'Selesai Bekerja' : 'Sedang Bekerja')
                                : 'Siap Bekerja Hari Ini?'}
                        </h2>
                        <p style={{ fontSize: '0.8125rem', color: '#888', margin: '0 0 1rem 0' }}>
                            {canFieldAttendance
                                ? 'Absen bebas di mana saja aktif.'
                                : (nearestOffice
                                    ? (isInsideOfficeRadius ? `Terdeteksi di ${nearestOffice.loc.name}` : `Lokasi: ${nearestOffice.loc.name}`)
                                    : 'Menghubungkan ke lokasi kantor...')}
                        </p>

                        {/* Check-In vs Check-Out Two-Column Times */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem',
                            padding: '0.875rem 0',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                            marginBottom: '1rem'
                        }}>
                            <div>
                                <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#888', fontWeight: 700, margin: '0 0 0.25rem 0' }}>JAM MASUK</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0, fontFamily: 'monospace' }}>
                                    {todayAttendance?.checkInAt
                                        ? new Date(todayAttendance.checkInAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
                                        : '--:--'}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: '#888', fontWeight: 700, margin: '0 0 0.25rem 0' }}>JAM PULANG</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0, fontFamily: 'monospace' }}>
                                    {todayAttendance?.checkOutAt
                                        ? new Date(todayAttendance.checkOutAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
                                        : '--:--'}
                                </p>
                            </div>
                        </div>

                        {/* Live Working Hours Counter */}
                        {todayAttendance?.checkInAt && (
                            <div style={{
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                background: liveWork.isFinished ? 'rgba(34,197,94,0.1)' : 'rgba(200,168,81,0.1)',
                                border: `1px solid ${liveWork.isFinished ? 'rgba(34,197,94,0.3)' : 'rgba(200,168,81,0.3)'}`,
                                marginBottom: '1.25rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: liveWork.isFinished ? '#4ade80' : 'var(--color-primary)', marginBottom: '0.25rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{liveWork.isFinished ? 'task_alt' : 'timer'}</span>
                                    {liveWork.isFinished ? 'Total Jam Kerja Selesai' : 'Jam Kerja Berjalan (Live Counter)'}
                                </div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: liveWork.isFinished ? '#86efac' : '#facc15' }}>
                                    {liveWork.timer}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>
                                    {liveWork.hours > 0 ? `${liveWork.hours} Jam ` : ''}{liveWork.minutes} Menit {liveWork.seconds} Detik
                                </div>
                            </div>
                        )}

                        {/* Geofence & GPS Radar status */}
                        <div style={{
                            background: '#141310',
                            border: '1px solid #333',
                            borderRadius: '0.625rem',
                            padding: '0.625rem 0.75rem',
                            marginBottom: '1rem',
                            textAlign: 'left',
                            fontSize: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, color: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: coords ? '#4ade80' : '#facc15' }}>
                                        {coords ? 'location_on' : 'location_searching'}
                                    </span>
                                    {coords ? `GPS: ±${gpsAccuracy}m` : (gpsLoading ? 'Mendeteksi GPS...' : 'GPS Belum Aktif')}
                                </span>
                                <button
                                    onClick={() => fetchLocation()}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.6875rem', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    🔄 Refresh GPS
                                </button>
                            </div>

                            {coords ? (
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: isWithinGeofence ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                                    {canFieldAttendance
                                        ? '🌐 Mode Absen Bebas: Koordinat GPS aktif tercatat'
                                        : (nearestOffice
                                            ? (isInsideOfficeRadius
                                                ? `✅ Dalam radius ${nearestOffice.loc.name} (${nearestOffice.dist}m / Max ${nearestOffice.radius}m)`
                                                : `❌ Di luar radius ${nearestOffice.loc.name} (${nearestOffice.dist}m / Max ${nearestOffice.radius}m)`)
                                            : 'ℹ️ Belum ada master lokasi kantor yang terdaftar')}
                                </p>
                            ) : gpsError ? (
                                <p style={{ margin: 0, fontSize: '0.6875rem', color: '#f87171', fontWeight: 600 }}>
                                    ⚠️ {gpsError}
                                </p>
                            ) : null}
                        </div>

                        {/* Selfie Camera Capture Area */}
                        {!todayAttendance && (
                            <div style={{ marginBottom: '1rem' }}>
                                {cameraActive ? (
                                    <div style={{ position: 'relative', borderRadius: '0.75rem', overflow: 'hidden', background: '#000', marginBottom: '0.5rem' }}>
                                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={snapPhoto}
                                            style={{
                                                position: 'absolute',
                                                bottom: '10px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                padding: '0.4rem 1rem',
                                                background: 'var(--color-primary)',
                                                color: '#000',
                                                fontWeight: 800,
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Ambil Foto
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            style={{
                                                flex: 1,
                                                padding: '0.5rem',
                                                background: '#141310',
                                                border: '1px dashed #444',
                                                borderRadius: '0.5rem',
                                                color: '#ccc',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.375rem'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>photo_camera</span>
                                            {photoBase64 ? 'Ganti Foto Selfie' : 'Ambil Foto Selfie'}
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="user"
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes Input */}
                        {!todayAttendance && (
                            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                <input
                                    type="text"
                                    placeholder={canFieldAttendance ? 'Catatan lokasi / rencana kunjungan lapangan...' : 'Catatan harian (opsional)...'}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        fontSize: '0.8125rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        )}

                        {/* Main Large Action Buttons */}
                        {!todayAttendance ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={submitting || gpsLoading || !isWithinGeofence}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: !isWithinGeofence ? '#333' : 'linear-gradient(135deg, #c8a851 0%, #a88934 100%)',
                                    color: !isWithinGeofence ? '#666' : '#000',
                                    fontWeight: 900,
                                    fontSize: '1.125rem',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    cursor: !isWithinGeofence ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(200,168,81,0.3)'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>login</span>
                                {submitting ? 'Memproses...' : 'CHECK IN MASUK'}
                            </button>
                        ) : !todayAttendance.checkOutAt ? (
                            <button
                                onClick={handleCheckOut}
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(239,68,68,0.3)'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>logout</span>
                                {submitting ? 'Memproses...' : 'CHECK OUT PULANG'}
                            </button>
                        ) : (
                            <div style={{
                                padding: '0.75rem',
                                background: 'rgba(34,197,94,0.1)',
                                border: '1px solid #22c55e',
                                borderRadius: '0.75rem',
                                textAlign: 'center',
                                color: '#4ade80',
                                fontWeight: 700,
                                fontSize: '0.875rem'
                            }}>
                                ✅ Presensi Hari Ini Telah Lengkap
                            </div>
                        )}
                    </div>

                    {/* Field Visit Module for Authorized Field Staff */}
                    {todayAttendance && canFieldAttendance && (
                        <div style={{
                            background: '#1a1917',
                            border: '1px solid var(--color-border)',
                            borderRadius: '1rem',
                            padding: '1.25rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>pin_drop</span>
                                    Log Kunjungan Sales ({todayAttendance?.fieldVisits?.length || 0})
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowVisitForm(!showVisitForm)}
                                    style={{
                                        padding: '0.35rem 0.75rem',
                                        background: showVisitForm ? '#333' : 'rgba(200,168,81,0.15)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '0.5rem',
                                        color: showVisitForm ? '#ccc' : 'var(--color-primary)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showVisitForm ? 'Tutup' : '+ Catat Kunjungan'}
                                </button>
                            </div>

                            {/* Form Tambah Kunjungan */}
                            {showVisitForm && (
                                <form onSubmit={handleSaveFieldVisit} style={{ background: '#141310', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #333', marginBottom: '0.75rem' }}>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#ccc', marginBottom: '0.25rem' }}>Nama Calon Jamaah / Instansi *:</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Contoh: H. Hendra / Majelis Taklim Al-Ikhlas"
                                            value={visitClientName}
                                            onChange={e => setVisitClientName(e.target.value)}
                                            style={{ width: '100%', padding: '0.4rem 0.6rem', background: '#0a0907', border: '1px solid #444', borderRadius: '0.375rem', color: 'white', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#ccc', marginBottom: '0.25rem' }}>Keperluan Kunjungan *:</label>
                                        <select
                                            value={visitPurpose}
                                            onChange={e => setVisitPurpose(e.target.value)}
                                            style={{ width: '100%', padding: '0.4rem 0.6rem', background: '#0a0907', border: '1px solid #444', borderRadius: '0.375rem', color: 'white', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                                        >
                                            <option value="Presentasi Paket Umroh">Presentasi Paket Umroh</option>
                                            <option value="Follow Up & Pembayaran DP">Follow Up & Pembayaran DP</option>
                                            <option value="Closing / Pendaftaran">Closing / Pendaftaran</option>
                                            <option value="Pengambilan Paspor">Pengambilan Paspor</option>
                                            <option value="Silaturahmi & Edukasi">Silaturahmi & Edukasi</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: '#ccc', marginBottom: '0.25rem' }}>Catatan Pertemuan:</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Hasil pertemuan, target closing, estimasi pax..."
                                            value={visitNotes}
                                            onChange={e => setVisitNotes(e.target.value)}
                                            style={{ width: '100%', padding: '0.4rem 0.6rem', background: '#0a0907', border: '1px solid #444', borderRadius: '0.375rem', color: 'white', fontSize: '0.8125rem', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={visitSubmitting}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem',
                                            background: 'var(--color-primary)',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontWeight: 800,
                                            fontSize: '0.8125rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {visitSubmitting ? 'Menyimpan...' : 'Simpan Kunjungan'}
                                    </button>
                                </form>
                            )}

                            {/* Timeline list of visits */}
                            {(!todayAttendance.fieldVisits || todayAttendance.fieldVisits.length === 0) ? (
                                <p style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                                    Belum ada log kunjungan sales hari ini.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {todayAttendance.fieldVisits.map(v => (
                                        <div key={v.id} style={{ background: '#141310', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.625rem 0.75rem', fontSize: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'white' }}>
                                                <span>👤 {v.clientName}</span>
                                                <span style={{ color: 'var(--color-primary)', fontSize: '0.6875rem' }}>
                                                    {new Date(v.visitedAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB
                                                </span>
                                            </div>
                                            <p style={{ margin: '0.2rem 0', color: '#aaa' }}>🎯 {v.purpose}</p>
                                            {v.notes && <p style={{ margin: 0, color: '#888', fontStyle: 'italic' }}>💬 "{v.notes}"</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: RIWAYAT BULANAN */}
            {/* ======================================================== */}
            {activeTab === 'history' && (
                <div style={{
                    background: '#1a1917',
                    border: '1px solid var(--color-border)',
                    borderRadius: '1rem',
                    padding: '1.25rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'white' }}>
                            Riwayat Kehadiran
                        </h3>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            style={{
                                padding: '0.3rem 0.5rem',
                                background: '#0a0907',
                                border: '1px solid #333',
                                borderRadius: '0.375rem',
                                color: 'white',
                                fontSize: '0.75rem'
                            }}
                        />
                    </div>

                    {loadingHistory ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#888', fontSize: '0.8125rem' }}>
                            Memuat riwayat...
                        </div>
                    ) : historyLogs.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#666', fontStyle: 'italic', fontSize: '0.8125rem' }}>
                            Tidak ada catatan absensi pada bulan ini.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {historyLogs.map(log => (
                                <div key={log.id} style={{
                                    background: '#141310',
                                    border: '1px solid #333',
                                    borderRadius: '0.625rem',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'white', fontSize: '0.8125rem' }}>{log.date}</div>
                                        <div style={{ fontSize: '0.6875rem', color: '#888', marginTop: '0.125rem' }}>
                                            Masuk: <span style={{ color: '#ccc', fontFamily: 'monospace' }}>{log.checkInAt ? new Date(log.checkInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span> | Pulang: <span style={{ color: '#ccc', fontFamily: 'monospace' }}>{log.checkOutAt ? new Date(log.checkOutAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
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
                                        <div style={{ fontSize: '0.6875rem', color: '#aaa', marginTop: '0.2rem' }}>
                                            {log.durationMinutes ? `${(log.durationMinutes / 60).toFixed(1)} Jam` : '-'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
