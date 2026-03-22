import React, { useState, useRef } from 'react';
import { apiFetch } from '../lib/api';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedContacts: { id: string; name: string; phone: string }[];
    onSuccess?: () => void;
}

interface SendProgress {
    current: number;
    total: number;
    currentName: string;
    status: 'typing' | 'sending' | 'waiting' | 'done' | 'error';
    successCount: number;
    failedCount: number;
    failedNames: string[];
    delaySeconds: number;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, selectedContacts, onSuccess }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState<SendProgress | null>(null);
    const [isDone, setIsDone] = useState(false);
    const abortRef = useRef(false);

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
        if (!confirm(`Kirim pesan ke ${validContacts.length} jamaah?\n\n⚠️ Jangan tutup halaman ini selama proses berlangsung.\nEstimasi waktu: ${validContacts.length * 6}–${validContacts.length * 11} detik.`)) return;

        setIsSending(true);
        setIsDone(false);
        abortRef.current = false;

        const prog: SendProgress = {
            current: 0, total: validContacts.length,
            currentName: '', status: 'typing',
            successCount: 0, failedCount: 0, failedNames: [],
            delaySeconds: 0
        };
        setProgress({ ...prog });

        for (let i = 0; i < validContacts.length; i++) {
            if (abortRef.current) break;

            const contact = validContacts[i];
            prog.current = i + 1;
            prog.currentName = contact.name;

            // Phase 1: Show "typing" status
            prog.status = 'typing';
            setProgress({ ...prog });

            try {
                // Phase 2: Send — the backend handles typing + delay
                prog.status = 'sending';
                setProgress({ ...prog });

                await apiFetch('/api/communication/send-single', {
                    method: 'POST',
                    body: JSON.stringify({ phone: contact.phone, message })
                });

                prog.successCount++;
            } catch (err: any) {
                prog.failedCount++;
                prog.failedNames.push(contact.name);
                console.error(`Failed to send to ${contact.name}:`, err);
            }

            // Phase 3: If not last, show a brief "waiting" between calls
            if (i < validContacts.length - 1 && !abortRef.current) {
                const waitSec = Math.floor(Math.random() * 3) + 1; // 1-3 extra sec between API calls
                prog.status = 'waiting';
                prog.delaySeconds = waitSec;
                setProgress({ ...prog });
                await new Promise(r => setTimeout(r, waitSec * 1000));
            }
        }

        prog.status = 'done';
        setProgress({ ...prog });
        setIsDone(true);
        setIsSending(false);

        if (prog.failedCount === 0 && onSuccess) {
            setTimeout(() => {
                onSuccess();
                handleClose();
            }, 3000);
        }
    };

    const handleClose = () => {
        if (isSending) {
            if (!confirm('Apakah Anda yakin ingin membatalkan proses broadcast yang sedang berjalan?')) return;
            abortRef.current = true;
        }
        setIsSending(false);
        setProgress(null);
        setIsDone(false);
        setMessage('');
        onClose();
    };

    const progressPercent = progress ? Math.round((progress.current / progress.total) * 100) : 0;

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
                {/* Header */}
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
                    {!isSending && !isDone && (
                        <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    )}
                </div>

                {/* === SENDING PROGRESS VIEW === */}
                {progress && (isSending || isDone) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Warning banner */}
                        {isSending && (
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-symbols-outlined" style={{ color: '#eab308', fontSize: '18px' }}>warning</span>
                                <span style={{ fontSize: '0.8125rem', color: '#eab308', fontWeight: 600 }}>Jangan tutup halaman ini selama proses broadcast berlangsung!</span>
                            </div>
                        )}

                        {/* Progress bar */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                    {isDone ? '✅ Broadcast Selesai' : `Mengirim ${progress.current}/${progress.total}...`}
                                </span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{progressPercent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${progressPercent}%`,
                                    height: '100%',
                                    background: isDone ? '#22c55e' : 'linear-gradient(90deg, #25D366, #128C7E)',
                                    borderRadius: '4px',
                                    transition: 'width 0.5s ease'
                                }} />
                            </div>
                        </div>

                        {/* Current status */}
                        {isSending && (
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    {progress.status === 'typing' && (
                                        <>
                                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366', animation: 'bounce 1.2s infinite 0s' }} />
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366', animation: 'bounce 1.2s infinite 0.2s' }} />
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25D366', animation: 'bounce 1.2s infinite 0.4s' }} />
                                            </div>
                                            <span style={{ fontSize: '0.875rem', color: '#25D366' }}>Mengetik ke <strong>{progress.currentName}</strong>...</span>
                                        </>
                                    )}
                                    {progress.status === 'sending' && (
                                        <>
                                            <span className="material-symbols-outlined" style={{ color: '#25D366', fontSize: '20px', animation: 'spin 1s linear infinite' }}>sync</span>
                                            <span style={{ fontSize: '0.875rem' }}>Mengirim pesan ke <strong>{progress.currentName}</strong>...</span>
                                        </>
                                    )}
                                    {progress.status === 'waiting' && (
                                        <>
                                            <span className="material-symbols-outlined" style={{ color: '#888', fontSize: '20px' }}>hourglass_empty</span>
                                            <span style={{ fontSize: '0.875rem', color: '#888' }}>Menunggu {progress.delaySeconds} detik sebelum pengiriman berikutnya...</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Results summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(34,197,94,0.06)', borderRadius: '0.75rem', border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{progress.successCount}</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#888' }}>Berhasil</p>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.06)', borderRadius: '0.75rem', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>{progress.failedCount}</p>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#888' }}>Gagal</p>
                            </div>
                        </div>

                        {/* Failed names */}
                        {progress.failedNames.length > 0 && (
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }}>Gagal kirim ke:</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>{progress.failedNames.join(', ')}</p>
                            </div>
                        )}

                        {/* Close button (only when done) */}
                        {isDone && (
                            <button onClick={handleClose} style={{
                                padding: '0.875rem', borderRadius: '0.5rem', fontWeight: 700,
                                background: 'var(--color-primary)', color: '#000', border: 'none', cursor: 'pointer',
                                width: '100%', marginTop: '0.5rem'
                            }}>
                                Tutup
                            </button>
                        )}
                    </div>
                ) : (
                    /* === COMPOSE VIEW === */
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

                        {/* Estimated time */}
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(37, 211, 102, 0.05)', border: '1px solid rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ color: '#25D366', fontSize: '18px' }}>schedule</span>
                            <span style={{ fontSize: '0.8125rem', color: '#ccc' }}>
                                Estimasi waktu: <strong style={{ color: '#25D366' }}>{Math.ceil(validContacts.length * 7 / 60)} – {Math.ceil(validContacts.length * 12 / 60)} menit</strong>
                                <span style={{ color: '#888' }}> (delay 3-8 detik per pesan untuk menghindari blokir)</span>
                            </span>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Pesan Broadcast</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={isSending}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                    border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--color-text)', minHeight: '150px', fontFamily: 'inherit',
                                    lineHeight: '1.5'
                                }}
                                placeholder="Assalamualaikum, jamaah sekalian..."
                            />
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                Tip: Setiap pesan akan dikirim satu per satu dengan delay acak dan indikator "sedang mengetik" agar terlihat natural.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button type="button" onClick={handleClose} disabled={isSending} style={{ flex: 1, padding: '0.875rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--color-text)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Batal
                            </button>
                            <button type="button" onClick={handleBroadcast} disabled={isSending || validContacts.length === 0} style={{
                                flex: 2, padding: '0.875rem', borderRadius: '0.5rem',
                                background: '#25D366', color: '#fff', border: 'none',
                                cursor: isSending || validContacts.length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 700,
                                opacity: isSending || validContacts.length === 0 ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                            }}>
                                <span className="material-symbols-outlined">send</span>
                                Mulai Broadcast
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
};
