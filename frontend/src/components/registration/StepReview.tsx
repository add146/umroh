import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { apiFetch } from '../../lib/api';

interface StepReviewProps {
    isLoading: boolean;
    getMissingFields: () => { step: number; label: string; fields: { field: string; label: string }[] }[];
    goToStep: (step: number) => void;
}

const StepReview: React.FC<StepReviewProps> = ({ isLoading, getMissingFields, goToStep }) => {
    const { watch } = useFormContext();
    const data = watch();
    const [priceDetails, setPriceDetails] = useState<{ basePrice: number, roomAdjustment: number, total: number, packageName: string, roomName: string } | null>(null);

    const missingFields = getMissingFields();
    const hasErrors = missingFields.length > 0;

    useEffect(() => {
        const fetchDetails = async () => {
            if (!data.departureId || !data.roomTypeId) return;
            try {
                const response = await apiFetch(`/api/departures/${data.departureId}`);
                if (response.departure && response.departure.package) {
                    const room = (response.departure.roomTypes || response.roomTypes || []).find((r: any) => r.id === data.roomTypeId);
                    if (room) {
                        const basePrice = response.departure.package.basePrice || 0;
                        const adjustment = room.priceAdjustment || 0;
                        setPriceDetails({ basePrice, roomAdjustment: adjustment, total: basePrice + adjustment, packageName: response.departure.package.name, roomName: room.name });
                    }
                }
            } catch (error) { console.error("Failed to fetch price details:", error); }
        };
        fetchDetails();
    }, [data.departureId, data.roomTypeId]);

    const SummaryItem = ({ label, value }: { label: string; value: string | boolean | undefined }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white', textAlign: 'right' }}>{value?.toString() || '-'}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0 0 0.375rem 0' }}>Review Pendaftaran</h2>
                <p style={{ fontSize: '0.875rem', color: '#888', margin: 0 }}>Silakan periksa kembali seluruh data sebelum menekan tombol Daftar.</p>
            </div>

            {/* ===== MISSING FIELD WARNINGS ===== */}
            {hasErrors && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#ef4444' }}>error</span>
                        <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#ef4444' }}>Data Belum Lengkap</h3>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#888', margin: '0 0 0.75rem 0' }}>
                        Beberapa field wajib belum diisi. Klik pada langkah untuk melengkapi:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {missingFields.map((group) => (
                            <div
                                key={group.step}
                                onClick={() => goToStep(group.step)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem',
                                    cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s',
                                }}
                            >
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 800, flexShrink: 0,
                                }}>{group.step}</div>
                                <div style={{ flex: 1 }}>
                                    <span style={{ fontWeight: 700, color: 'white', fontSize: '0.8125rem' }}>Langkah {group.step}: {group.label}</span>
                                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#ef4444', marginTop: '0.125rem' }}>
                                        {group.fields.map(f => f.label).join(', ')}
                                    </span>
                                </div>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#888' }}>chevron_right</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ===== DATA SUMMARY ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#0a0907', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333' }}>Identitas Utama</h3>
                        <SummaryItem label="Nama Lengkap" value={data.pilgrim?.name} />
                        <SummaryItem label="No. KTP" value={data.pilgrim?.noKtp} />
                        <SummaryItem label="Tgl Lahir" value={data.pilgrim?.born} />
                        <SummaryItem label="Pekerjaan" value={data.pilgrim?.work} />
                    </div>

                    <div style={{ background: '#0a0907', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #333' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333' }}>Kontak & Darurat</h3>
                        <SummaryItem label="No. WhatsApp" value={data.pilgrim?.phone} />
                        <SummaryItem label="Darurat" value={data.pilgrim?.famContactName} />
                        <SummaryItem label="HP Darurat" value={data.pilgrim?.famContact} />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#0a0907', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--color-primary)' }}>
                        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #333' }}>Rincian Paket</h3>
                        <SummaryItem label="Paket" value={priceDetails?.packageName || 'Memuat...'} />
                        <SummaryItem label="Pilihan Kamar" value={priceDetails?.roomName || 'Memuat...'} />
                        <SummaryItem label="Status Paspor" value={data.pilgrim?.hasPassport ? 'Sudah Ada' : 'Belum Ada'} />
                    </div>

                    {/* Price Summary */}
                    <div style={{ padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--color-primary)', color: 'white' }}>
                        {priceDetails ? (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                                    <span>Harga Dasar</span>
                                    <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceDetails.basePrice)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                    <span>Penyesuaian Kamar</span>
                                    <span>{priceDetails.roomAdjustment >= 0 ? '+' : '-'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(priceDetails.roomAdjustment))}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontWeight: 700, fontSize: '1.125rem' }}>
                                    <span>Total Tagihan</span>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(priceDetails.total)}</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase', margin: '0 0 1rem 0' }}>Memuat rincian harga...</p>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600, opacity: 0.9, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.75rem' }}>
                            <span>Lanjutkan Pembayaran di Tahap Berikutnya</span>
                            <span>➔</span>
                        </div>
                    </div>

                    <div style={{ padding: '0.875rem', background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#eab308', margin: 0, fontStyle: 'italic' }}>
                            * Dengan menekan tombol daftar, Anda menyetujui seluruh syarat dan ketentuan perjalanan yang berlaku di Al Madinah Umroh.
                        </p>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}>progress_activity</span>
                    <p style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Sedang Memproses Booking...</p>
                </div>
            )}
        </div>
    );
};

export default StepReview;
