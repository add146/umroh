import React, { useState } from 'react';
import { apiFetch } from '../lib/api';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedContacts: { id: string; name: string; phone: string }[];
    onSuccess?: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, selectedContacts, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);

    const validContacts = selectedContacts.filter(c => c.phone && c.phone.length > 5);

    if (!isOpen) return null;

    const handleBroadcast = async () => {
        if (!message.trim()) {
            alert('Pesan tidak boleh kosong');
            return;
        }

        if (validContacts.length === 0) {
            alert('Tidak ada kontak dengan nomor HP yang valid');
            return;
        }

        if (!confirm(`Kirim pesan Siaran (Broadcast) ke ${validContacts.length} kontak?`)) return;

        setLoading(true);
        setResult(null);

        try {
            const phones = validContacts.map(c => c.phone);
            const res = await apiFetch<{ total: number; success: number; failed: number }>('/api/comm/broadcast', {
                method: 'POST',
                body: JSON.stringify({ phones, message })
            });

            setResult(res);

            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 3000); // Close after showing success for 3s
            }
        } catch (error: any) {
            alert('Gagal mengirim broadcast: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                borderRadius: '1rem', width: '100%', maxWidth: '600px', padding: '2rem',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: '#25D366' }}>campaign</span>
                            Siaran WhatsApp
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Kirim pesan serentak ke jamaah yang dipilih.
                        </p>
                    </div>
                    {!loading && !result && (
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                {result ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>check</span>
                        </div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Broadcast Selesai</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                            Berhasil kirim: <strong>{result.success}</strong> | Gagal: <strong>{result.failed}</strong>
                        </p>
                        <button onClick={onClose} style={{ padding: '0.75rem 2rem', borderRadius: '0.5rem', background: 'var(--color-primary)', color: 'var(--color-bg)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                            Tutup
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Penerima ({selectedContacts.length} dipilih)</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                {validContacts.length} kontak memiliki nomor Handphone valid.
                                {selectedContacts.length > validContacts.length && (
                                    <span style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                                        ⚠️ {selectedContacts.length - validContacts.length} kontak akan dilewati karena tidak ada nomor HP.
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Pesan Broadcast</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text)', minHeight: '150px', fontFamily: 'inherit',
                                    lineHeight: '1.5'
                                }}
                                placeholder="Assalamualaikum, jamaah sekalian..."
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                Tip: Hindari mengirim spam agar nomor WhatsApp tidak terblokir (rate limit).
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Batal
                            </button>
                            <button type="button" onClick={handleBroadcast} disabled={loading || validContacts.length === 0} style={{
                                flex: 2, padding: '0.875rem', borderRadius: '0.5rem',
                                background: '#25D366', color: '#fff', border: 'none', cursor: loading || validContacts.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 700,
                                opacity: loading || validContacts.length === 0 ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}>
                                {loading ? (
                                    <>Mengirim Broadcast... <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span></>
                                ) : (
                                    <>Kirim Pesan <span className="material-symbols-outlined">send</span></>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
