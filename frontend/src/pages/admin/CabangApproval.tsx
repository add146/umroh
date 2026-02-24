import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export const CabangApproval: React.FC = () => {
    const { accessToken } = useAuthStore();
    const [bookings, setBookings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedDocPilgrim, setSelectedDocPilgrim] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/bookings');
            if (data && data.bookings) {
                // Filter only 'ready_review' status bookings (marked ready for review by agent)
                setBookings(data.bookings.filter((b: any) => b.bookingStatus === 'ready_review'));
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

    const handleApprove = async (id: string) => {
        if (!window.confirm('Verifikasi data jamaah ini sudah lengkap dan valid?')) return;
        try {
            const res = await apiFetch(`/api/bookings/${id}/approve`, { method: 'POST' });
            if (res && res.message) {
                alert('Jamaah berhasil di-approve!');
                fetchBookings();
            } else {
                alert('Gagal memproses approval.');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt('Masukkan alasan penolakan (opsional):');
        if (reason === null) return; // User cancelled
        try {
            const res = await apiFetch(`/api/bookings/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            if (res && res.message) {
                alert('Jamaah dikembalikan ke Agen untuk direvisi!');
                fetchBookings();
            } else {
                alert('Gagal memproses penolakan.');
            }
        } catch (err) {
            console.error(err);
        }
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

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>Antrian Approval Jamaah</h1>
                <p style={{ color: 'var(--color-text-light)' }}>Daftar jamaah yang datanya telah diverifikasi (Siap Review) oleh Agen di jaringan Anda.</p>
            </div>

            <div style={{ backgroundColor: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <tr>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jamaah</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paket (Keberangkatan)</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pembayaran</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi Review</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Memuat antrian approval...</td></tr>
                        ) : bookings.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Mantaap! Tidak ada antrian approval.</td></tr>
                        ) : bookings.map((b) => (
                            <tr key={b.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                                <td style={{ padding: '1.25rem 1.5rem' }}>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.pilgrim?.name || 'Anon'}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{b.pilgrim?.noKtp || '-'}</p>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                                    {b.departureId /* We should expand this data using relations but ID serves as placeholder */}
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
                                        backgroundColor: b.paymentStatus === 'paid' ? 'rgba(22, 163, 74, 0.15)' : b.paymentStatus === 'partial' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                        color: b.paymentStatus === 'paid' ? '#4ade80' : b.paymentStatus === 'partial' ? '#fbbf24' : '#f87171'
                                    }}>
                                        {b.paymentStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 700, backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: 'none', cursor: 'pointer' }}
                                            onClick={() => setSelectedDocPilgrim(b.pilgrim)}
                                            title="Dokumen Jamaah"
                                        >
                                            Dokumen
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 700, backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#f87171', border: '1px solid #f87171' }}
                                            onClick={() => handleReject(b.id)}
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '0.5rem', textTransform: 'uppercase', fontWeight: 700 }}
                                            onClick={() => handleApprove(b.id)}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Document Verification Modal */}
            {selectedDocPilgrim && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                    <div style={{ backgroundColor: '#1a1917', border: '1px solid #333', borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Review Dokumen: {selectedDocPilgrim.name}</h2>
                            <button onClick={() => setSelectedDocPilgrim(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            {documents.length === 0 ? (
                                <p style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>Agen belum mengunggah dokumen apapun.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {documents.map((doc: any) => {
                                        const ocrData = doc.ocrResult ? JSON.parse(doc.ocrResult) : null;
                                        return (
                                            <div key={doc.id} style={{ backgroundColor: '#0a0907', border: '1px solid #333', borderRadius: '0.75rem', overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: ocrData ? '1px solid #333' : 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <span className="material-symbols-outlined" style={{ color: doc.isVerified ? '#22c55e' : '#f59e0b', fontSize: '24px' }}>
                                                            {doc.isVerified ? 'verified' : 'pending_actions'}
                                                        </span>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase' }}>{doc.docType}</p>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{new Date(doc.createdAt).toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewDoc(doc.id)}
                                                        style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', color: 'white', fontSize: '0.75rem', fontWeight: 700, borderRadius: '0.375rem', cursor: 'pointer' }}
                                                    >
                                                        Lihat File Asli
                                                    </button>
                                                </div>

                                                {ocrData && (
                                                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                                                        <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Hasil Pembacaan OCR:</h4>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                            {Object.entries(ocrData).map(([key, val]) => (
                                                                <div key={key}>
                                                                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', textTransform: 'uppercase' }}>{key}</p>
                                                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{val as string}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
