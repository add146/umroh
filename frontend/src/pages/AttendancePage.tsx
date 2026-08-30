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
    radiusMeters: number;
    address?: string | null;
}

export const AttendancePage: React.FC = () => {
    const { user } = useAuthStore();
    const isSalesRole = ['agen', 'reseller', 'mitra'].includes(user?.role || '');

    const [, setTodayDate] = useState<string>('');
    const [currentTime, setCurrentTime] = useState<string>('');
    const [attendanceType, setAttendanceType] = useState<'office' | 'field'>(isSalesRole ? 'field' : 'office');
    
    // GPS State
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
    const [gpsLoading, setGpsLoading] = useState<boolean>(true);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [addressInput] = useState<string>('');

    // Attendance Data
    const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
    const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
    const [nearestOffice, setNearestOffice] = useState<{ loc: OfficeLocation; dist: number } | null>(null);
    const [, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);

    // Form inputs
    const [notes, setNotes] = useState<string>('');
    const [photoBase64, setPhotoBase64] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState<boolean>(false);

    // Field Visit Form
    const [showVisitModal, setShowVisitModal] = useState<boolean>(false);
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

    // Live Clock (WIB)
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
            setCurrentTime(timeStr);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Get live GPS on mount
    useEffect(() => {
        fetchLocation();
        loadTodayStatus();
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

    const fetchLocation = () => {
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

                // Find nearest office
                if (officeLocations.length > 0) {
                    let nearest: { loc: OfficeLocation; dist: number } | null = null;
                    officeLocations.forEach(loc => {
                        const d = getDistance(lat, lng, loc.latitude, loc.longitude);
                        if (!nearest || d < nearest.dist) {
                            nearest = { loc, dist: d };
                        }
                    });
                    setNearestOffice(nearest);
                }
            },
            (err) => {
                setGpsError(`Gagal mendapatkan lokasi GPS (${err.message}). Pastikan izin lokasi aktif.`);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const loadTodayStatus = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/api/attendance/today');
            setTodayDate(data.today || '');
            setTodayAttendance(data.attendance || null);
            setOfficeLocations(data.locations || []);

            if (coords && data.locations?.length > 0) {
                let nearest: { loc: OfficeLocation; dist: number } | null = null;
                data.locations.forEach((loc: OfficeLocation) => {
                    const d = getDistance(coords.lat, coords.lng, loc.latitude, loc.longitude);
                    if (!nearest || d < nearest.dist) nearest = { loc, dist: d };
                });
                setNearestOffice(nearest);
            }
        } catch (err: any) {
            console.error('Failed to load today attendance', err);
        } finally {
            setLoading(false);
        }
    };

    // Load monthly history
    useEffect(() => {
        loadHistory(selectedMonth);
    }, [selectedMonth]);

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

    // Start Webcam Stream
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
            console.warn('Webcam stream failed, fallback to file upload', err);
            fileInputRef.current?.click();
            setCameraActive(false);
        }
    };

    // Snap Selfie from Webcam
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
        // Stop stream
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
        }
        setCameraActive(false);
    };

    // Handle File Upload Selfie
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setPhotoBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Clock In Action
    const handleCheckIn = async () => {
        if (!coords) {
            alert('Lokasi GPS belum terdeteksi. Silakan segarkan GPS.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                latitude: coords.lat,
                longitude: coords.lng,
                photo_url: photoBase64,
                notes: notes.trim(),
                type: attendanceType,
                address: addressInput.trim() || (attendanceType === 'field' ? 'Kunjungan Lapangan / Sales' : nearestOffice?.loc.name || 'Kantor')
            };

            const res = await apiFetch<any>('/api/attendance/check-in', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert(res.message || 'Absen masuk berhasil!');
            setPhotoBase64(null);
            setNotes('');
            loadTodayStatus();
            loadHistory(selectedMonth);
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan absen masuk');
        } finally {
            setSubmitting(false);
        }
    };

    // Clock Out Action
    const handleCheckOut = async () => {
        if (!confirm('Apakah Anda yakin ingin melakukan absensi pulang sekarang?')) return;

        setSubmitting(true);
        try {
            const payload = {
                latitude: coords?.lat,
                longitude: coords?.lng,
                notes: notes.trim(),
                address: addressInput.trim()
            };

            const res = await apiFetch<any>('/api/attendance/check-out', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert(res.message || 'Absen pulang berhasil!');
            loadTodayStatus();
            loadHistory(selectedMonth);
        } catch (err: any) {
            alert(err.message || 'Gagal melakukan absen pulang');
        } finally {
            setSubmitting(false);
        }
    };

    // Submit Field Visit Log
    const handleSaveFieldVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitClientName.trim()) {
            alert('Nama Klien / Prospek wajib diisi');
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
                address: addressInput.trim() || 'Lokasi Klien Lapangan'
            };

            await apiFetch('/api/attendance/field-visit', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            alert('Kunjungan sales berhasil dicatat!');
            setShowVisitModal(false);
            setVisitClientName('');
            setVisitNotes('');
            loadTodayStatus();
        } catch (err: any) {
            alert(err.message || 'Gagal mencatat kunjungan sales');
        } finally {
            setVisitSubmitting(false);
        }
    };

    const isInsideOfficeRadius = nearestOffice && nearestOffice.dist <= (nearestOffice.loc.radiusMeters || 150);

    return (
        <div className="animate-in fade-in duration-500" style={{ paddingBottom: '4rem' }}>
            {/* Header with Digital Clock */}
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
                            how_to_reg
                        </span>
                        Absensi & Kunjungan Sales
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>
                        Presensi kehadiran GPS harian untuk staff kantor & tim sales di lapangan
                    </p>
                </div>

                {/* Digital Clock Badge */}
                <div style={{
                    background: '#141310',
                    border: '1px solid rgba(200,168,81,0.3)',
                    borderRadius: '0.75rem',
                    padding: '0.625rem 1.25rem',
                    textAlign: 'right',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                        {currentTime || '--:--:--'} <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#888' }}>WIB</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 600 }}>
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Main Grid: Clock-in Card & Daily Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* CARD 1: FORM ABSENSI MASUK / PULANG */}
                <div style={{
                    background: '#1a1917',
                    border: '1px solid var(--color-border)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>fingerprint</span>
                                Presensi Kehadiran
                            </h3>
                            <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                background: isSalesRole ? 'rgba(59,130,246,0.15)' : 'rgba(200,168,81,0.15)',
                                color: isSalesRole ? '#60a5fa' : 'var(--color-primary)'
                            }}>
                                Role: {user?.role || 'Staff'}
                            </span>
                        </div>

                        {/* Mode Selection Toggle */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.5rem',
                            background: '#0a0907',
                            padding: '0.375rem',
                            borderRadius: '0.625rem',
                            marginBottom: '1rem',
                            border: '1px solid #333'
                        }}>
                            <button
                                type="button"
                                onClick={() => setAttendanceType('office')}
                                disabled={!!todayAttendance}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    background: attendanceType === 'office' ? 'var(--color-primary)' : 'transparent',
                                    color: attendanceType === 'office' ? '#000' : '#888',
                                    cursor: todayAttendance ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.375rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>apartment</span>
                                Absen Kantor
                            </button>

                            <button
                                type="button"
                                onClick={() => setAttendanceType('field')}
                                disabled={!!todayAttendance}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem',
                                    border: 'none',
                                    fontSize: '0.8125rem',
                                    fontWeight: 700,
                                    background: attendanceType === 'field' ? '#3b82f6' : 'transparent',
                                    color: attendanceType === 'field' ? 'white' : '#888',
                                    cursor: todayAttendance ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.375rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>explore</span>
                                Lapangan / Sales
                            </button>
                        </div>

                        {/* GPS Location Status Box */}
                        <div style={{
                            background: '#141310',
                            border: '1px solid #333',
                            borderRadius: '0.625rem',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            fontSize: '0.8125rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                                <span style={{ fontWeight: 700, color: '#ccc', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: coords ? '#4ade80' : '#facc15' }}>
                                        {coords ? 'location_on' : 'location_searching'}
                                    </span>
                                    Status Lokasi GPS:
                                </span>
                                <button
                                    onClick={fetchLocation}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                                >
                                    🔄 Segarkan
                                </button>
                            </div>

                            {gpsLoading ? (
                                <p style={{ color: '#888', margin: 0, fontStyle: 'italic' }}>Mendeteksi koordinat GPS presisi...</p>
                            ) : gpsError ? (
                                <p style={{ color: '#f87171', margin: 0 }}>⚠️ {gpsError}</p>
                            ) : coords ? (
                                <div>
                                    <p style={{ margin: '0 0 0.25rem 0', fontFamily: 'monospace', color: 'white', fontSize: '0.75rem' }}>
                                        📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)} (Akurasi: ±{gpsAccuracy}m)
                                    </p>
                                    {attendanceType === 'office' && nearestOffice && (
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: isInsideOfficeRadius ? '#4ade80' : '#f87171'
                                        }}>
                                            {isInsideOfficeRadius
                                                ? `✅ Dalam radius ${nearestOffice.loc.name} (${nearestOffice.dist}m)`
                                                : `❌ Di luar radius ${nearestOffice.loc.name} (${nearestOffice.dist}m / Max ${nearestOffice.loc.radiusMeters}m)`}
                                        </p>
                                    )}
                                    {attendanceType === 'field' && (
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>
                                            🌐 Mode Lapangan / Sales: Lokasi absen bebas di mana saja
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Selfie Camera Section (Only before Check-In) */}
                        {!todayAttendance && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    📸 Foto Selfie Kehadiran (Opsional/Verifikasi):
                                </label>

                                {cameraActive ? (
                                    <div style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', background: '#000', marginBottom: '0.5rem' }}>
                                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                                        <button
                                            type="button"
                                            onClick={snapPhoto}
                                            style={{
                                                position: 'absolute',
                                                bottom: '10px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                padding: '0.5rem 1rem',
                                                background: 'var(--color-primary)',
                                                color: '#000',
                                                fontWeight: 800,
                                                borderRadius: '999px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem'
                                            }}
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>photo_camera</span>
                                            Ambil Foto
                                        </button>
                                    </div>
                                ) : photoBase64 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <img src={photoBase64} alt="Selfie" style={{ width: '60px', height: '60px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--color-primary)' }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>Foto selfie siap dikirim</p>
                                            <button
                                                type="button"
                                                onClick={() => setPhotoBase64(null)}
                                                style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.6875rem', cursor: 'pointer', padding: 0 }}
                                            >
                                                Hapus & Ulangi
                                            </button>
                                        </div>
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
                                            Buka Kamera Selfie
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
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                📝 Catatan / Lokasi Lapangan:
                            </label>
                            <input
                                type="text"
                                placeholder={attendanceType === 'field' ? 'Contoh: Kunjungan prospek di BSD / Kantor Kemenag' : 'Catatan harian (opsional)'}
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
                    </div>

                    {/* Submit Action Buttons */}
                    <div>
                        {!todayAttendance ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={submitting || gpsLoading || (attendanceType === 'office' && !isInsideOfficeRadius)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem',
                                    background: (attendanceType === 'office' && !isInsideOfficeRadius)
                                        ? '#333'
                                        : 'linear-gradient(135deg, #c8a851 0%, #a88934 100%)',
                                    color: (attendanceType === 'office' && !isInsideOfficeRadius) ? '#666' : '#000',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                    border: 'none',
                                    borderRadius: '0.75rem',
                                    cursor: (attendanceType === 'office' && !isInsideOfficeRadius) ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 15px rgba(200,168,81,0.3)'
                                }}
                            >
                                <span className="material-symbols-outlined">login</span>
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
                                <span className="material-symbols-outlined">logout</span>
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
                                ✅ Presensi hari ini telah lengkap (Masuk & Pulang)
                            </div>
                        )}
                    </div>
                </div>

                {/* CARD 2: STATUS KEHADIRAN HARI INI & KUNJUNGAN SALES */}
                <div style={{
                    background: '#1a1917',
                    border: '1px solid var(--color-border)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: '#60a5fa' }}>history_toggle_off</span>
                                Ringkasan Hari Ini
                            </h3>
                            {todayAttendance && (
                                <span style={{
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '999px',
                                    fontSize: '0.6875rem',
                                    fontWeight: 800,
                                    background: todayAttendance.isOnTime ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                    color: todayAttendance.isOnTime ? '#4ade80' : '#facc15'
                                }}>
                                    {todayAttendance.isOnTime ? '✓ Tepat Waktu' : '⚠️ Terlambat'}
                                </span>
                            )}
                        </div>

                        {/* Clock In / Out Time Highlights */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{ background: '#141310', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.875rem' }}>
                                <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0 0 0.25rem 0', fontWeight: 700 }}>JAM MASUK</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0, fontFamily: 'monospace' }}>
                                    {todayAttendance?.checkInAt
                                        ? new Date(todayAttendance.checkInAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
                                        : '--:--'}
                                </p>
                                <span style={{ fontSize: '0.6875rem', color: '#aaa' }}>
                                    {todayAttendance ? (todayAttendance.type === 'office' ? '🏢 Kantor' : '📍 Lapangan') : 'Belum absen'}
                                </span>
                            </div>

                            <div style={{ background: '#141310', border: '1px solid #333', borderRadius: '0.75rem', padding: '0.875rem' }}>
                                <p style={{ fontSize: '0.6875rem', color: '#888', margin: '0 0 0.25rem 0', fontWeight: 700 }}>JAM PULANG</p>
                                <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0, fontFamily: 'monospace' }}>
                                    {todayAttendance?.checkOutAt
                                        ? new Date(todayAttendance.checkOutAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })
                                        : '--:--'}
                                </p>
                                <span style={{ fontSize: '0.6875rem', color: '#aaa' }}>
                                    {todayAttendance?.durationMinutes ? `${(todayAttendance.durationMinutes / 60).toFixed(1)} Jam kerja` : 'Belum checkout'}
                                </span>
                            </div>
                        </div>

                        {/* Field Visits Activity for Sales */}
                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>handshake</span>
                                    Log Kunjungan Sales ({todayAttendance?.fieldVisits?.length || 0})
                                </h4>
                                <button
                                    onClick={() => setShowVisitModal(true)}
                                    style={{
                                        padding: '0.3rem 0.625rem',
                                        background: 'rgba(200,168,81,0.15)',
                                        border: '1px solid var(--color-primary)',
                                        borderRadius: '0.375rem',
                                        color: 'var(--color-primary)',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    + Tambah Kunjungan
                                </button>
                            </div>

                            {(!todayAttendance?.fieldVisits || todayAttendance.fieldVisits.length === 0) ? (
                                <p style={{ fontSize: '0.75rem', color: '#666', fontStyle: 'italic', margin: 0 }}>
                                    Belum ada catatan kunjungan klien / prospek hari ini.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                                    {todayAttendance.fieldVisits.map(visit => (
                                        <div key={visit.id} style={{
                                            background: '#141310',
                                            border: '1px solid #333',
                                            borderRadius: '0.5rem',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.75rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'white', marginBottom: '0.2rem' }}>
                                                <span>👤 {visit.clientName}</span>
                                                <span style={{ color: 'var(--color-primary)', fontSize: '0.6875rem' }}>
                                                    {new Date(visit.visitedAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB
                                                </span>
                                            </div>
                                            <p style={{ margin: '0 0 0.2rem 0', color: '#aaa' }}>🎯 {visit.purpose}</p>
                                            {visit.notes && <p style={{ margin: 0, color: '#888', fontStyle: 'italic' }}>💬 "{visit.notes}"</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: RIWAYAT BULANAN */}
            <div style={{
                background: '#1a1917',
                border: '1px solid var(--color-border)',
                borderRadius: '1rem',
                padding: '1.5rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>calendar_month</span>
                        Riwayat Absensi Bulanan
                    </h3>

                    {/* Month Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#888', fontWeight: 600 }}>Pilih Bulan:</span>
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
                </div>

                {loadingHistory ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
                        <p>Memuat riwayat kehadiran...</p>
                    </div>
                ) : historyLogs.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        Belum ada data absensi untuk bulan {selectedMonth}.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)', color: '#888' }}>
                                    <th style={{ padding: '0.75rem' }}>Tanggal</th>
                                    <th style={{ padding: '0.75rem' }}>Tipe</th>
                                    <th style={{ padding: '0.75rem' }}>Jam Masuk</th>
                                    <th style={{ padding: '0.75rem' }}>Jam Pulang</th>
                                    <th style={{ padding: '0.75rem' }}>Durasi</th>
                                    <th style={{ padding: '0.75rem' }}>Status</th>
                                    <th style={{ padding: '0.75rem' }}>Lokasi / Catatan</th>
                                    <th style={{ padding: '0.75rem' }}>GPS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'white' }}>{log.date}</td>
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
                                            {log.checkInAddress || log.checkInNotes || '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {log.checkInLat && log.checkInLng ? (
                                                <a
                                                    href={`https://www.google.com/maps?q=${log.checkInLat},${log.checkInLng}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
                                                    Maps
                                                </a>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL: TAMBAH KUNJUNGAN SALES */}
            {showVisitModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.75)',
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
                        width: '100%',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>
                                📍 Catat Kunjungan Sales / Prospek
                            </h3>
                            <button
                                onClick={() => setShowVisitModal(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '1.25rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveFieldVisit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Nama Calon Jamaah / Instansi *:
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Bapak H. Hendra / Majelis Taklim Al-Ikhlas"
                                    value={visitClientName}
                                    onChange={(e) => setVisitClientName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Keperluan Kunjungan *:
                                </label>
                                <select
                                    value={visitPurpose}
                                    onChange={(e) => setVisitPurpose(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="Presentasi Paket Umroh">Presentasi Paket Umroh</option>
                                    <option value="Follow Up & Pembayaran DP">Follow Up & Pembayaran DP</option>
                                    <option value="Closing Paket / Pendaftaran">Closing Paket / Pendaftaran</option>
                                    <option value="Pengambilan Paspor & Dokumen">Pengambilan Paspor & Dokumen</option>
                                    <option value="Silaturahmi & Edukasi">Silaturahmi & Edukasi</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#ccc', marginBottom: '0.375rem' }}>
                                    Catatan Hasil Pertemuan:
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Catatan hasil diskusi, potensi jumlah pax, tanggal target closing..."
                                    value={visitNotes}
                                    onChange={(e) => setVisitNotes(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem 0.75rem',
                                        background: '#0a0907',
                                        border: '1px solid #333',
                                        borderRadius: '0.5rem',
                                        color: 'white',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowVisitModal(false)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#333',
                                        color: '#ccc',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    disabled={visitSubmitting}
                                    style={{
                                        padding: '0.5rem 1.25rem',
                                        background: 'var(--color-primary)',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {visitSubmitting ? 'Menyimpan...' : 'Simpan Kunjungan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
