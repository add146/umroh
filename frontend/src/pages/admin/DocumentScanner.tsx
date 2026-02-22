import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem',
};
const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--color-text-light)', fontWeight: 600,
};

const DocumentScanner: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [docType, setDocType] = useState<'ktp' | 'passport' | 'visa' | 'other'>('ktp');
    const [uploading, setUploading] = useState(false);
    const [ocrResult, setOcrResult] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pilgrims, setPilgrims] = useState<any[]>([]);
    const [selectedPilgrim, setSelectedPilgrim] = useState<any>(null);

    const handleSearch = async () => {
        if (searchQuery.length < 3) return;
        try {
            const data = await apiFetch<{ bookings: any[] }>('/api/bookings');
            const found = data.bookings.filter(b =>
                b.pilgrim?.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.pilgrim?.noKtp.includes(searchQuery)
            );
            setPilgrims(found.map(b => b.pilgrim));
        } catch (error) { console.error(error); }
    };

    const handleUpload = async () => {
        if (!file || !selectedPilgrim) return;
        setUploading(true);
        setOcrResult(null);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('pilgrimId', selectedPilgrim.id);
        formData.append('docType', docType);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/documents/upload`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, body: formData
            });
            const data = await res.json();
            if (data.success) { setOcrResult(data.ocr); alert('Dokumen berhasil diunggah dan diproses OCR'); }
            else { alert('Gagal: ' + data.error); }
        } catch (error) { console.error(error); alert('Terjadi kesalahan saat upload'); }
        finally { setUploading(false); }
    };

    return (
        <div className="animate-in fade-in duration-700">
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>OCR Document Scanner</h1>
                <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.875rem' }}>Unggah KTP atau Paspor untuk ekstraksi data otomatis.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Side: Upload Form */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                    <label style={labelStyle}>1. Cari Jamaah</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        <input type="text" placeholder="Nama atau No. KTP..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={handleSearch} style={{ padding: '0.75rem 1.25rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>Cari</button>
                    </div>

                    {pilgrims.length > 0 && !selectedPilgrim && (
                        <div style={{ maxHeight: '160px', overflowY: 'auto', marginBottom: '1rem', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.375rem' }}>
                            {pilgrims.map(p => (
                                <div key={p.id} onClick={() => setSelectedPilgrim(p)} style={{ padding: '0.625rem', cursor: 'pointer', borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 700, color: '#ccc' }}>{p.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>{p.noKtp}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedPilgrim && (
                        <div style={{ background: 'var(--color-primary-bg)', padding: '0.875rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', margin: '0 0 0.125rem 0' }}>Jamaah Terpilih</p>
                                <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{selectedPilgrim.name}</p>
                            </div>
                            <button onClick={() => setSelectedPilgrim(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.8125rem' }}>Ganti</button>
                        </div>
                    )}

                    <label style={{ ...labelStyle, marginTop: '0.5rem' }}>2. Tipe Dokumen</label>
                    <select value={docType} onChange={(e: any) => setDocType(e.target.value)} style={{ ...inputStyle, marginBottom: '1rem', cursor: 'pointer' }}>
                        <option value="ktp">KTP (Kartu Tanda Penduduk)</option>
                        <option value="passport">Paspor</option>
                        <option value="visa">Visa</option>
                        <option value="other">Lainnya</option>
                    </select>

                    <label style={labelStyle}>3. Pilih File</label>
                    <div style={{ border: '2px dashed #333', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                        <input type="file" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                        {file ? (
                            <div style={{ color: 'var(--color-primary)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '0.5rem' }}>description</span>
                                <p style={{ fontWeight: 700, margin: '0 0 0.25rem 0' }}>{file.name}</p>
                                <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div style={{ color: '#888' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '40px', display: 'block', marginBottom: '0.5rem' }}>cloud_upload</span>
                                <p style={{ fontWeight: 600, margin: '0 0 0.25rem 0' }}>Klik atau drop file di sini</p>
                                <p style={{ fontSize: '0.75rem', margin: 0 }}>PNG, JPG, PDF</p>
                            </div>
                        )}
                    </div>

                    <button disabled={!file || !selectedPilgrim || uploading} onClick={handleUpload} style={{
                        width: '100%', marginTop: '1rem', padding: '1rem', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                        background: (!file || !selectedPilgrim || uploading) ? '#333' : 'var(--color-primary)',
                        color: (!file || !selectedPilgrim || uploading) ? '#888' : 'white',
                    }}>
                        {uploading ? 'Memproses OCR...' : 'Mulai Scan & Upload'}
                    </button>
                </div>

                {/* Right Side: OCR Result */}
                {ocrResult ? (
                    <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: '#22c55e' }}>check_circle</span>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Hasil Ekstraksi OCR</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {Object.entries(ocrResult).map(([key, value]) => (
                                <div key={key} style={{ background: '#0a0907', border: '1px solid #333', borderRadius: '0.5rem', padding: '0.875rem' }}>
                                    <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', margin: '0 0 0.25rem 0' }}>{key}</p>
                                    <p style={{ fontWeight: 700, color: 'white', margin: 0 }}>{value as string}</p>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '1.5rem', padding: '0.875rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '0.5rem' }}>
                            <p style={{ fontSize: '0.8125rem', color: '#eab308', margin: 0 }}>
                                <strong>PENTING:</strong> Data di atas diekstrak secara otomatis. Pastikan untuk memvalidasi dengan dokumen asli.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: '#1a1917', border: '2px dashed #333', borderRadius: '1rem', padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#555', marginBottom: '1rem' }}>document_scanner</span>
                        <p style={{ fontWeight: 700, color: '#666', fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>Menunggu Dokumen</p>
                        <p style={{ color: '#555', fontSize: '0.875rem', margin: 0 }}>Hasil ekstraksi OCR akan muncul di sini setelah upload selesai.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentScanner;
