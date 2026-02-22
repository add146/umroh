import { useFormContext } from 'react-hook-form';
import OCRUpload from './OCRUpload';

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' };

const StepPersonal: React.FC = () => {
    const { register, setValue, formState: { errors } } = useFormContext();

    const handleOCRSuccess = (data: any) => {
        if (data.name) setValue('pilgrim.name', data.name);
        if (data.nik) setValue('pilgrim.noKtp', data.nik);
        if (data.born) setValue('pilgrim.born', data.born);
        if (data.address) setValue('pilgrim.address', data.address);
        if (data.sex) setValue('pilgrim.sex', data.sex === 'L' ? 'L' : 'P');
        // KTP also has maritalStatus and work — set them in contact step
        if (data.maritalStatus) setValue('pilgrim.maritalStatus', data.maritalStatus);
        if (data.work) setValue('pilgrim.work', data.work);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>Data Pribadi</h2>
                    <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>Pastikan data sesuai dengan KTP Anda.</p>
                </div>
                <div style={{ width: '200px' }}>
                    <OCRUpload docType="ktp" onSuccess={handleOCRSuccess} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Nama Lengkap (Sesuai KTP)</label>
                    <input type="text" {...register('pilgrim.name')} placeholder="Contoh: Ahmad Subagyo" style={inputStyle} />
                    {errors.pilgrim && (errors.pilgrim as any).name && (
                        <p style={{ color: '#ef4444', fontSize: '0.6875rem', margin: '0.25rem 0 0 0' }}>{(errors.pilgrim as any).name.message}</p>
                    )}
                </div>

                <div>
                    <label style={labelStyle}>Nomor KTP (NIK)</label>
                    <input type="text" {...register('pilgrim.noKtp')} maxLength={16} placeholder="16 Digit NIK" style={{ ...inputStyle, fontFamily: 'monospace' }} />
                </div>

                <div>
                    <label style={labelStyle}>Jenis Kelamin</label>
                    <div style={{ display: 'flex', gap: '0.75rem', height: '48px' }}>
                        <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333', borderRadius: '0.5rem', cursor: 'pointer', background: '#0a0907', gap: '0.375rem' }}>
                            <input type="radio" value="L" {...register('pilgrim.sex')} style={{ accentColor: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>Laki-laki</span>
                        </label>
                        <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #333', borderRadius: '0.5rem', cursor: 'pointer', background: '#0a0907', gap: '0.375rem' }}>
                            <input type="radio" value="P" {...register('pilgrim.sex')} style={{ accentColor: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'white' }}>Perempuan</span>
                        </label>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Tanggal Lahir</label>
                    <input type="date" {...register('pilgrim.born')} style={inputStyle} />
                </div>

                <div>
                    <label style={labelStyle}>Nama Ayah Kandung</label>
                    <input type="text" {...register('pilgrim.fatherName')} placeholder="Nama Bapak" style={inputStyle} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Alamat Lengkap</label>
                    <textarea {...register('pilgrim.address')} rows={3} placeholder="Nama jalan, nomor rumah, RT/RW, Kec, Kota/Kab" style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepPersonal;
