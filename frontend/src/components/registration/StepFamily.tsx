import React, { useEffect, useState } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { apiFetch } from '../../lib/api';

const inputStyle: React.CSSProperties = { width: '100%', padding: '0.875rem', background: '#0a0907', border: '1px solid #333', color: 'white', borderRadius: '0.5rem', outline: 'none', fontSize: '0.875rem' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '0.5rem' };

const StepFamily: React.FC = () => {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'companions'
    });

    const [roomType, setRoomType] = useState<any>(null);
    const [initializedRoomType, setInitializedRoomType] = useState<string>('');
    const departureId = watch('departureId');
    const roomTypeId = watch('roomTypeId');

    useEffect(() => {
        if (!departureId || !roomTypeId) return;
        apiFetch(`/api/departures/${departureId}`)
            .then(data => {
                const rtList = data.departure?.roomTypes || data.roomTypes || [];
                const matched = rtList.find((r: any) => r.id === roomTypeId);
                if (matched) {
                    setRoomType(matched);
                    
                    if (initializedRoomType !== roomTypeId) {
                        setInitializedRoomType(roomTypeId);
                        const requiredCount = Math.max(0, (matched.capacity || 1) - 1);
                        
                        // Set exactly requiredCount empty objects
                        const initialCompanions = [];
                        for (let i = 0; i < requiredCount; i++) {
                            initialCompanions.push({ name: '', noKtp: '', sex: 'L', born: '', noPassport: '' });
                        }
                        setValue('companions', initialCompanions);
                    }
                }
            })
            .catch(console.error);
    }, [departureId, roomTypeId, initializedRoomType, setValue]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>Keluarga & Anggota Keluarga</h2>
                <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>Kontak darurat dan data jamaah yang ikut dalam kamar Anda.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

                {/* Companions Section */}
                {fields.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'white', margin: '0 0 0.25rem 0' }}>
                                Data Anggota Keluarga / Jamaah Tambahan ({roomType?.name || 'Kamar'})
                            </h3>
                            <p style={{ fontSize: '0.8125rem', color: '#888', margin: 0 }}>
                                Mohon lengkapi identitas jamaah lain yang akan menempati kamar yang sama dengan Anda.
                            </p>
                        </div>

                        {fields.map((field, index) => {
                            const companionError = (errors?.companions as any)?.[index];
                            return (
                                <div key={field.id} style={{
                                    padding: '1.5rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.25rem',
                                    position: 'relative'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                                            Jamaah Tambahan #{index + 1}
                                        </span>
                                        {index >= ((roomType?.capacity || 1) - 1) && (
                                            <button 
                                                type="button" 
                                                onClick={() => remove(index)} 
                                                style={{
                                                    background: 'rgba(239,68,68,0.1)',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    padding: '0.375rem 0.75rem',
                                                    borderRadius: '0.375rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <label style={labelStyle}>Nama Lengkap (Sesuai KTP)</label>
                                            <input 
                                                type="text" 
                                                {...register(`companions.${index}.name`)} 
                                                placeholder="Nama Lengkap" 
                                                style={inputStyle} 
                                            />
                                            {companionError?.name && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{companionError.name.message}</p>}
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Nomor KTP (NIK)</label>
                                            <input 
                                                type="text" 
                                                maxLength={16} 
                                                {...register(`companions.${index}.noKtp`)} 
                                                placeholder="16 Digit NIK" 
                                                style={inputStyle} 
                                            />
                                            {companionError?.noKtp && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{companionError.noKtp.message}</p>}
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Jenis Kelamin</label>
                                            <select {...register(`companions.${index}.sex`)} style={inputStyle}>
                                                <option value="L">Laki-laki</option>
                                                <option value="P">Perempuan</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={labelStyle}>Tanggal Lahir</label>
                                            <input 
                                                type="date" 
                                                {...register(`companions.${index}.born`)} 
                                                style={inputStyle} 
                                            />
                                            {companionError?.born && <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>{companionError.born.message}</p>}
                                        </div>

                                        <div>
                                            <label style={labelStyle}>No. Paspor (Opsional)</label>
                                            <input 
                                                type="text" 
                                                {...register(`companions.${index}.noPassport`)} 
                                                placeholder="e.g. A 1234567" 
                                                style={inputStyle} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {roomType?.capacity && (
                    <button
                        type="button"
                        onClick={() => append({ name: '', noKtp: '', sex: 'L', born: '', noPassport: '' })}
                        style={{
                            padding: '0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px dashed #444',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            width: '100%'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Tambah Anggota Keluarga / Jamaah Lain
                    </button>
                )}
            </div>
        </div>
    );
};

export default StepFamily;
