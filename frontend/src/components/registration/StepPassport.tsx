import { useFormContext } from 'react-hook-form';
import OCRUpload from './OCRUpload';

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' };

const StepPassport: React.FC = () => {
    const { register, watch, setValue } = useFormContext();
    const hasPassport = watch('pilgrim.hasPassport');

    const handleOCRSuccess = (data: any) => {
        if (data.passportNo) setValue('pilgrim.noPassport', data.passportNo);
        if (data.issuingOffice) setValue('pilgrim.passportFrom', data.issuingOffice);
        if (data.expiryDate) setValue('pilgrim.passportExpiry', data.expiryDate);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>Data Paspor</h2>
                    <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>Kosongkan jika Anda belum memiliki paspor.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {hasPassport && <OCRUpload docType="passport" onSuccess={handleOCRSuccess} />}
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0a0907', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', border: '1px solid #333' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#888', marginRight: '0.75rem' }}>SUDAH PUNYA PASPOR?</span>
                        <input type="checkbox" {...register('pilgrim.hasPassport')} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
                    </div>
                </div>
            </div>

            {hasPassport && (
                <div className="animate-in fade-in duration-300" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={labelStyle}>Nomor Paspor</label>
                        <input type="text" {...register('pilgrim.noPassport')} placeholder="e.g. A 1234567" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                    </div>
                    <div>
                        <label style={labelStyle}>Kantor Imigrasi (Dikeluarkan di)</label>
                        <input type="text" {...register('pilgrim.passportFrom')} placeholder="Jakarta Selatan, Surabaya, dsb" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Tanggal Pengeluaran</label>
                        <input type="date" {...register('pilgrim.passportReleaseDate')} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}>Tanggal Habis Berlaku</label>
                        <input type="date" {...register('pilgrim.passportExpiry')} style={inputStyle} />
                    </div>
                </div>
            )}

            {!hasPassport && (
                <div style={{ padding: '2rem', border: '2px dashed #333', borderRadius: '0.75rem', textAlign: 'center', background: '#0a0907' }}>
                    <p style={{ fontSize: '0.875rem', color: '#888', margin: '0 0 0.375rem 0' }}>Anda memilih opsi <strong style={{ color: 'white' }}>Belum Memiliki Paspor</strong>.</p>
                    <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>Anda tetap dapat melanjutkan pendaftaran. Pengurusan paspor dapat dibantu oleh tim kami setelah booking selesai.</p>
                </div>
            )}
        </div>
    );
};

export default StepPassport;
