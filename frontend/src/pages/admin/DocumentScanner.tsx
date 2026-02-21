import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

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
            // Reusing bookings endpoint or creating search pilgrim endpoint
            // For now, let's fetch bookings and filter client-side for POC
            const data = await apiFetch<{ bookings: any[] }>('/api/bookings');
            const found = data.bookings.filter(b =>
                b.pilgrim?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.pilgrim?.noKtp.includes(searchQuery)
            );
            setPilgrims(found.map(b => b.pilgrim));
        } catch (error) {
            console.error(error);
        }
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
            // Using direct fetch for multipart
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setOcrResult(data.ocr);
                alert('Dokumen berhasil diunggah dan diproses OCR');
            } else {
                alert('Gagal: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-3xl font-extrabold text-white mb-2">📸 OCR Document Scanner</h1>
            <p className="text-gray-500 mb-8">Unggah KTP atau Paspor untuk ekstraksi data otomatis</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Upload Form */}
                <div className="space-y-6">
                    <div className="dark-card p-6 rounded-2xl shadow-sm border border-[var(--color-border)]">
                        <label className="block text-sm font-bold text-gray-300 mb-2">1. Cari Jamaah</label>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                className="flex-1 p-3 bg-[#131210] border border-[var(--color-border)] rounded-xl text-white focus:ring-2 focus:ring-primary outline-none"
                                placeholder="Nama atau No. KTP..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <button
                                onClick={handleSearch}
                                className="px-4 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
                            >
                                Cari
                            </button>
                        </div>

                        {pilgrims.length > 0 && !selectedPilgrim && (
                            <div className="space-y-2 max-h-40 overflow-y-auto mb-4 border border-[var(--color-border)] rounded-xl p-2">
                                {pilgrims.map(p => (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedPilgrim(p)}
                                        className="p-3 hover:bg-[var(--color-primary-bg)] rounded-lg cursor-pointer flex justify-between items-center"
                                    >
                                        <span className="font-bold text-gray-200">{p.name}</span>
                                        <span className="text-xs text-gray-400 font-mono">{p.noKtp}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {selectedPilgrim && (
                            <div className="bg-[var(--color-primary-bg)] p-4 rounded-xl border border-[var(--color-border-gold)] flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase">Jamaah Terpilih</p>
                                    <p className="font-bold text-white">{selectedPilgrim.name}</p>
                                </div>
                                <button onClick={() => setSelectedPilgrim(null)} className="text-xs text-red-500 font-bold hover:underline">Ganti</button>
                            </div>
                        )}

                        <label className="block text-sm font-bold text-gray-300 mb-2">2. Tipe Dokumen</label>
                        <select
                            className="w-full p-3 bg-[#131210] text-white border border-[var(--color-border)] rounded-xl mb-4 focus:ring-2 focus:ring-primary outline-none"
                            value={docType}
                            onChange={(e: any) => setDocType(e.target.value)}
                        >
                            <option value="ktp">KTP (Kartu Tanda Penduduk)</option>
                            <option value="passport">Paspor</option>
                            <option value="visa">Visa</option>
                            <option value="other">Lainnya</option>
                        </select>

                        <label className="block text-sm font-bold text-gray-300 mb-2">3. Pilih File</label>
                        <div className="border-2 border-dashed border-[var(--color-border)] rounded-2xl p-8 text-center hover:border-primary transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div className="text-primary">
                                    <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9zM11 3a1 1 0 110 2 1 1 0 010-2z" />
                                    </svg>
                                    <p className="font-bold">{file.name}</p>
                                    <p className="text-xs opacity-70">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-gray-400">
                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <p className="font-medium">Klik atau drop file di sini</p>
                                    <p className="text-xs uppercase font-bold tracking-wider mt-1">PNG, JPG, PDF</p>
                                </div>
                            )}
                        </div>

                        <button
                            disabled={!file || !selectedPilgrim || uploading}
                            onClick={handleUpload}
                            className={`w-full mt-6 py-4 rounded-xl font-black uppercase tracking-widest text-white transition-all ${!file || !selectedPilgrim || uploading ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark shadow-lg'
                                }`}
                        >
                            {uploading ? 'Memproses OCR...' : 'Mulai Scan & Upload'}
                        </button>
                    </div>
                </div>

                {/* Right Side: OCR Result View */}
                <div className="space-y-6">
                    {ocrResult ? (
                        <div className="dark-card p-6 rounded-2xl shadow-xl border-2 border-[var(--color-border-gold)] animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-black text-white">Hasil Ekstraksi OCR</h2>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(ocrResult).map(([key, value]) => (
                                    <div key={key} className="p-4 bg-[#131210] rounded-xl border border-[var(--color-border)]">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{key}</p>
                                        <p className="font-bold text-white">{value as string}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                                <p className="text-xs text-yellow-700 font-medium leading-relaxed">
                                    <span className="font-black">PENTING:</span> Data di atas telah diekstrak secara otomatis. Pastikan untuk memvalidasi dengan dokumen asli sebelum melakukan verifikasi final.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#131210] border-2 border-dashed border-[var(--color-border)] rounded-2xl p-12 text-center h-full flex flex-col justify-center">
                            <div className="opacity-30">
                                <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-xl font-bold">Menunggu Dokumen</p>
                                <p className="mt-2">Hasil ekstraksi OCR akan muncul di sini setelah upload selesai.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentScanner;
