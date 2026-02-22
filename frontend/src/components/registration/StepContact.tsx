import React from 'react';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' };

const StepContact: React.FC = () => {
    const { register } = useFormContext();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>Kontak & Status</h2>
                <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>Informasi untuk koordinasi keberangkatan.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label style={labelStyle}>Status Pernikahan</label>
                    <select {...register('pilgrim.maritalStatus')} style={inputStyle}>
                        <option value="Belum Menikah">Belum Menikah</option>
                        <option value="Menikah">Menikah</option>
                        <option value="Cerai">Cerai</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Nomor HP / WhatsApp</label>
                    <input type="tel" {...register('pilgrim.phone')} placeholder="0812xxxxxxxx" style={inputStyle} />
                </div>

                <div>
                    <label style={labelStyle}>Pendidikan Terakhir</label>
                    <select {...register('pilgrim.lastEducation')} style={inputStyle}>
                        <option value="">Pilih Pendidikan</option>
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA/SMK">SMA/SMK</option>
                        <option value="D3">D3</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Pekerjaan</label>
                    <input type="text" {...register('pilgrim.work')} placeholder="e.g. Pegawai Swasta, Guru, dsb" style={inputStyle} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Riwayat Penyakit (Jika Ada)</label>
                    <textarea {...register('pilgrim.diseaseHistory')} rows={2} placeholder="Sebutkan jika memiliki kondisi kesehatan khusus..." style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepContact;
