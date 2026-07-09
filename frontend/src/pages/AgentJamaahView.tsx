import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export const AgentJamaahView: React.FC = () => {
    const { accessToken } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Document states
    const [selectedDocPilgrim, setSelectedDocPilgrim] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<'ktp' | 'passport' | 'visa' | 'other'>('ktp');

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/bookings');
            if (data && data.bookings) {
                setBookings(data.bookings);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleReadyReview = async (id: string) => {
        if (!window.confirm('Tandai jamaah ini sudah siap direview Cabang?')) return;
        try {
            const res = await apiFetch(`/api/bookings/${id}/ready-for-review`, { method: 'POST' });
            if (res && res.message) {
                alert('Berhasil ditandai siap direview');
                fetchBookings();
            } else {
                alert('Gagal menandai');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleWhatsApp = async (id: string, phone: string, name: string) => {
        const message = encodeURIComponent(`Assalamualaikum Bapak/Ibu ${name}, kami dari tim pendaftaran Al-Madinah ingin menginformasikan...`);
        // Log follow up
        await apiFetch(`/api/bookings/${id}/follow-up`, { method: 'POST' });
        window.open(`https://wa.me/${phone.replace(/^0/, '62')}?text=${message}`, '_blank');
    };

    useEffect(() => {
        if (selectedDocPilgrim) {
            fetchDocuments(selectedDocPilgrim.id);
        }
    }, [selectedDocPilgrim]);

    const fetchDocuments = async (pilgrimId: string) => {
        try {
            const data = await apiFetch(`/api/documents/pilgrim/${pilgrimId}`);
            if (Array.isArray(data)) {
                setDocuments(data);
            }
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
    };

    const handleUploadDoc = async () => {
        if (!docFile || !selectedDocPilgrim) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', docFile);
        formData.append('pilgrimId', selectedDocPilgrim.id);
        formData.append('docType', docType);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/documents/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert('Dokumen berhasil diunggah!');
                setDocFile(null);
                fetchDocuments(selectedDocPilgrim.id);
                fetchBookings();
            } else {
                alert('Gagal: ' + data.error);
            }
        } catch (error) {
            alert('Terjadi kesalahan saat upload');
        } finally {
            setIsUploading(false);
        }
    };

    const handleViewDoc = async (docId: string) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/documents/${docId}/view`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                alert('Gagal memuat dokumen');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Filter bookings based on search query and active status
    const filteredBookings = bookings.filter(b => {
        // Hide past bookings from Data Jamaahku
        if (b.departure?.departureDate) {
            const departureDate = new Date(b.departure.departureDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison
            if (departureDate < today) return false;
        }

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const name = (b.pilgrim?.name || '').toLowerCase();
        const nik = (b.pilgrim?.noKtp || '').toLowerCase();
        const phone = (b.pilgrim?.phone || '').toLowerCase();
        return name.includes(q) || nik.includes(q) || phone.includes(q);
    });

    const unpaidBookings = filteredBookings.filter(b => b.paymentStatus === 'unpaid' && b.bookingStatus !== 'cancelled');
    const partialBookings = filteredBookings.filter(b => b.paymentStatus === 'partial' && b.bookingStatus !== 'cancelled');
    const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'paid' && b.bookingStatus !== 'cancelled');

    const renderCard = (b: any) => {
        const isExpanded = expandedCards[b.id] || false;
        const packageName = b.departure?.package?.name || '';
        const tripName = b.departure?.tripName || '';
        const nameToCompare = (packageName + ' ' + tripName).toLowerCase();
        const packageLabel = nameToCompare.includes('haji') ? 'Haji' : 'Umroh';

        return (
            <div key={b.id} style={{
                backgroundColor: 'rgb(30, 29, 27)',
                border: '1px solid var(--color-border)',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isExpanded ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : 'none'
            }} onClick={() => toggleExpand(b.id)}>
                {/* Header (Always Visible) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>{b.pilgrim?.name || 'Anon'}</h4>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            NIK: {b.pilgrim?.noKtp || '-'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '0.25rem' }}>
                            {packageLabel}: {packageName || 'Tanpa Paket'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                        {!isExpanded && b.documentCount && (
                            <span style={{
                                padding: '0.125rem 0.375rem',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                background: b.documentCount.uploaded === b.documentCount.total ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                                color: b.documentCount.uploaded === b.documentCount.total ? '#22c55e' : '#eab308'
                            }}>
                                {b.documentCount.uploaded}/{b.documentCount.total}
                            </span>
                        )}
                        <button 
                            onClick={() => toggleExpand(b.id)}
                            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 0 }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                        {/* Document Checklist Info */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.375rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                                <span>Ceklist Dokumen</span>
                                <span>{b.documentCount?.uploaded || 0} / {b.documentCount?.total || 3}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.375rem', marginTop: '0.125rem' }}>
                                {['ktp', 'passport', 'visa', 'other'].map(t => {
                                    const status = b.documentStatus?.[t] || { uploaded: false, verified: false };
                                    const docLabels: Record<string, string> = {
                                        ktp: 'KTP',
                                        passport: 'Paspor',
                                        visa: 'Visa',
                                        other: 'Lainnya'
                                    };
                                    let textColor = 'var(--color-text-muted)';
                                    let icon = 'circle';
                                    let iconColor = 'rgba(255,255,255,0.1)';
                                    if (status.uploaded) {
                                        if (status.verified) {
                                            textColor = '#4ade80';
                                            icon = 'check_circle';
                                            iconColor = '#4ade80';
                                        } else {
                                            textColor = '#fbbf24';
                                            icon = 'info';
                                            iconColor = '#fbbf24';
                                        }
                                    } else {
                                        if (t === 'other') {
                                            textColor = '#888888';
                                            icon = 'circle';
                                            iconColor = '#888888';
                                        } else {
                                            textColor = '#f87171';
                                            icon = 'cancel';
                                            iconColor = '#f87171';
                                        }
                                    }
                                    return (
                                        <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '11px', color: iconColor }}>{icon}</span>
                                            <span style={{ color: textColor, fontWeight: 500 }}>
                                                {docLabels[t]}{t === 'other' && !status.uploaded ? ' (Opsional)' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{
                                padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                backgroundColor: b.paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : b.paymentStatus === 'partial' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#fbbf24' : '#f87171'
                            }}>
                                {b.paymentStatus.toUpperCase()}
                            </span>
                            <span style={{
                                padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', fontWeight: 700,
                                backgroundColor: 'rgba(12, 165, 233, 0.15)', color: '#38bdf8'
                            }}>
                                {b.bookingStatus.toUpperCase()}
                            </span>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', cursor: 'pointer' }}
                                onClick={() => setSelectedDocPilgrim(b.pilgrim)}
                                title="Dokumen Jamaah"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>folder_open</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Dokumen</span>
                            </button>
                            {b.pilgrim?.phone && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', border: 'none', cursor: 'pointer' }}
                                    onClick={() => handleWhatsApp(b.id, b.pilgrim.phone, b.pilgrim.name)}
                                    title="Hubungi WhatsApp"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>chat</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>WA</span>
                                </button>
                            )}
                            {b.bookingStatus === 'pending' && (
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '0.375rem', textTransform: 'uppercase', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                                    onClick={() => handleReadyReview(b.id)}
                                >
                                    Review
                                </button>
                            )}
                            {b.bookingStatus === 'ready_review' && (
                                <span style={{
                                    flex: 1,
                                    padding: '0.5rem',
                                    fontSize: '0.7rem',
                                    borderRadius: '0.375rem',
                                    textTransform: 'uppercase',
                                    fontWeight: 700,
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--color-text-muted)',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    Sedang Direview
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Data Jamaah (Follow-Up)</h1>
                    <p style={{ color: 'var(--color-text-light)' }}>Pantau dan verifikasi data jamaah Anda sebelum direview Cabang</p>
                </div>
            </div>

            {/* Search Bar */}
            <div style={{
                marginBottom: '2rem',
                position: 'relative',
                maxWidth: '400px'
            }}>
                <span className="material-symbols-outlined" style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888',
                    fontSize: '20px'
                }}>search</span>
                <input
                    type="text"
                    placeholder="Cari nama, NIK, atau nomor HP..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        backgroundColor: 'rgb(30, 29, 27)',
                        border: '1px solid var(--color-border)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        outline: 'none',
                        fontSize: '0.875rem'
                    }}
                />
            </div>

            {isLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat pipeline jamaah...</div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    {/* Column 1: Baru Terdaftar */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #ef4444' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Terdaftar Baru</h3>
                            <span style={{ background: '#ef4444', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{unpaidBookings.length}</span>
                        </div>
                        <div>
                            {unpaidBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                unpaidBookings.map(renderCard)
                            )}
                        </div>
                    </div>

                    {/* Column 2: DP / Cicilan */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #f59e0b' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>DP / Proses Cicilan</h3>
                            <span style={{ background: '#f59e0b', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{partialBookings.length}</span>
                        </div>
                        <div>
                            {partialBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                partialBookings.map(renderCard)
                            )}
                        </div>
                    </div>

                    {/* Column 3: Lunas */}
                    <div style={{
                        background: 'rgb(19, 18, 16)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        minHeight: '400px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid #22c55e' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Lunas</h3>
                            <span style={{ background: '#22c55e', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>{paidBookings.length}</span>
                        </div>
                        <div>
                            {paidBookings.length === 0 ? (
                                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '2rem 0' }}>Kosong</p>
                            ) : (
                                paidBookings.map(renderCard)
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Document Modal */}
            {selectedDocPilgrim && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ backgroundColor: '#1a1917', border: '1px solid #333', borderRadius: '1rem', width: '100%', maxWidth: '500px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Dokumen: {selectedDocPilgrim.name}</h2>
                            <button onClick={() => setSelectedDocPilgrim(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#aaa', marginBottom: '0.5rem' }}>Dokumen Terunggah</h3>
                            {documents.length === 0 ? (
                                <p style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>Belum ada dokumen yang diunggah.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {documents.map((doc: any) => (
                                        <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0907', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span className="material-symbols-outlined" style={{ color: doc.isVerified ? '#22c55e' : '#f59e0b', fontSize: '20px' }}>
                                                    {doc.isVerified ? 'verified' : 'pending_actions'}
                                                </span>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>{doc.docType}</p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{doc.isVerified ? 'Terverifikasi' : 'Menunggu Verifikasi'}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleViewDoc(doc.id)}
                                                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                Lihat
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#aaa', marginBottom: '0.75rem' }}>Unggah Dokumen Baru</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <select value={docType} onChange={(e: any) => setDocType(e.target.value)} style={{ flex: 1, padding: '0.75rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none' }}>
                                    <option value="ktp">KTP</option>
                                    <option value="passport">Paspor</option>
                                    <option value="visa">Visa</option>
                                    <option value="other">Lainnya</option>
                                </select>
                                <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} style={{ flex: 2, padding: '0.625rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem' }} />
                            </div>
                            <button
                                onClick={handleUploadDoc}
                                disabled={!docFile || isUploading}
                                style={{ width: '100%', padding: '0.75rem', background: (!docFile || isUploading) ? '#333' : 'var(--color-primary)', color: (!docFile || isUploading) ? '#888' : 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: (!docFile || isUploading) ? 'not-allowed' : 'pointer' }}
                            >
                                {isUploading ? 'Mengunggah...' : 'Unggah Dokumen'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

