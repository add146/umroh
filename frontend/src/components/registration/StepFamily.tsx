import React from 'react';
import { useFormContext } from 'react-hook-form';

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' };

const StepFamily: React.FC = () => {
    const { register } = useFormContext();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>Keluarga & Sumber Informasi</h2>
                <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>Kontak darurat dan referensi pendaftaran.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Emergency Contact Card */}
                <div style={{ padding: '1.25rem', background: 'var(--color-primary-bg)', borderRadius: '0.75rem', border: '1px solid rgba(var(--color-primary-rgb, 200,170,100), 0.2)' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span>
                        Kontak Darurat (Keluarga)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>Nama Kontak</label>
                            <input type="text" {...register('pilgrim.famContactName')} placeholder="Nama anggota keluarga" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Nomor HP</label>
                            <input type="tel" {...register('pilgrim.famContact')} placeholder="08xxxxxxxx" style={inputStyle} />
                        </div>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Dari Mana Anda Mengetahui Kami?</label>
                    <select {...register('pilgrim.sourceFrom')} style={inputStyle}>
                        <option value="">Pilih Sumber Informasi</option>
                        <option value="Media Sosial">Media Sosial (IG/FB/TikTok)</option>
                        <option value="Rekomendasi Teman">Rekomendasi Teman/Keluarga</option>
                        <option value="Website">Website</option>
                        <option value="Brosur">Brosur / Spanduk</option>
                        <option value="Agen">Agen Umroh</option>
                    </select>
                </div>

                <div>
                    <label style={labelStyle}>Anggota Keluarga Yang Ikut (Opsional)</label>
                    <textarea {...register('pilgrim.famMember')} rows={2} placeholder="Sebutkan nama keluarga lain jika mendaftar bersamaan (misal: Istri, Anak)..." style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>
            </div>
        </div>
    );
};

export default StepFamily;
