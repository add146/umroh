import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../lib/api';

import StepProduct from '../components/registration/StepProduct';
import StepPersonal from '../components/registration/StepPersonal';
import StepPassport from '../components/registration/StepPassport';
import StepContact from '../components/registration/StepContact';
import StepFamily from '../components/registration/StepFamily';
import StepReview from '../components/registration/StepReview';

const registrationSchema = z.object({
    departureId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    pilgrim: z.object({
        name: z.string().min(3, "Nama minimal 3 karakter"),
        noKtp: z.string().length(16, "KTP harus 16 digit"),
        sex: z.enum(['L', 'P']),
        born: z.string().min(1, "Tanggal lahir wajib diisi"),
        address: z.string().min(10, "Alamat minimal 10 karakter"),
        fatherName: z.string().min(3),
        hasPassport: z.boolean(),
        noPassport: z.string().optional(),
        passportFrom: z.string().optional(),
        passportReleaseDate: z.string().optional(),
        passportExpiry: z.string().optional(),
        maritalStatus: z.enum(['Belum Menikah', 'Menikah', 'Cerai']),
        phone: z.string().min(10),
        homePhone: z.string().optional(),
        lastEducation: z.string().min(1),
        work: z.string().min(1),
        diseaseHistory: z.string().optional(),
        famMember: z.string().optional(),
        famContactName: z.string().min(3),
        famContact: z.string().min(10),
        sourceFrom: z.string().min(1),
    })
});

type RegistrationData = z.infer<typeof registrationSchema>;

const STEPS = [
    { label: 'Paket', icon: 'package_2' },
    { label: 'Data Pribadi', icon: 'person' },
    { label: 'Paspor', icon: 'badge' },
    { label: 'Kontak', icon: 'phone' },
    { label: 'Keluarga', icon: 'family_restroom' },
    { label: 'Review', icon: 'fact_check' },
];

// Maps step number -> form field names for that step
const STEP_FIELDS: Record<number, { field: string; label: string }[]> = {
    1: [
        { field: 'departureId', label: 'Keberangkatan' },
        { field: 'roomTypeId', label: 'Tipe Kamar' },
    ],
    2: [
        { field: 'pilgrim.name', label: 'Nama Lengkap' },
        { field: 'pilgrim.noKtp', label: 'No. KTP (NIK)' },
        { field: 'pilgrim.sex', label: 'Jenis Kelamin' },
        { field: 'pilgrim.born', label: 'Tanggal Lahir' },
        { field: 'pilgrim.address', label: 'Alamat Lengkap' },
        { field: 'pilgrim.fatherName', label: 'Nama Ayah Kandung' },
    ],
    3: [],
    4: [
        { field: 'pilgrim.maritalStatus', label: 'Status Pernikahan' },
        { field: 'pilgrim.phone', label: 'No. HP / WhatsApp' },
        { field: 'pilgrim.lastEducation', label: 'Pendidikan Terakhir' },
        { field: 'pilgrim.work', label: 'Pekerjaan' },
    ],
    5: [
        { field: 'pilgrim.famContactName', label: 'Nama Kontak Darurat' },
        { field: 'pilgrim.famContact', label: 'No. HP Darurat' },
        { field: 'pilgrim.sourceFrom', label: 'Sumber Informasi' },
    ],
};

const Registration = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lockKey] = useState<string | null>(null);
    const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

    const methods = useForm<RegistrationData>({
        resolver: zodResolver(registrationSchema),
        mode: 'onTouched', // validate on blur so fields show errors as user fills
        defaultValues: {
            pilgrim: { hasPassport: false, sex: 'L', maritalStatus: 'Belum Menikah' }
        }
    });

    // Navigate to any step freely
    const goToStep = (step: number) => {
        setVisitedSteps(prev => new Set([...prev, step]));
        setCurrentStep(step);
    };

    const nextStep = () => {
        const next = Math.min(currentStep + 1, 6);
        goToStep(next);
    };

    const prevStep = () => {
        const prev = Math.max(currentStep - 1, 1);
        goToStep(prev);
    };

    // Collect all missing required fields across all steps
    const getMissingFields = (): { step: number; label: string; fields: { field: string; label: string }[] }[] => {
        const values = methods.getValues();
        const missing: { step: number; label: string; fields: { field: string; label: string }[] }[] = [];

        for (const [stepStr, fieldDefs] of Object.entries(STEP_FIELDS)) {
            const stepNum = parseInt(stepStr);
            const missingInStep: { field: string; label: string }[] = [];

            for (const fd of fieldDefs) {
                const parts = fd.field.split('.');
                let val: any = values;
                for (const p of parts) { val = val?.[p]; }

                if (!val || (typeof val === 'string' && val.trim() === '')) {
                    missingInStep.push(fd);
                }
            }

            if (missingInStep.length > 0) {
                missing.push({ step: stepNum, label: STEPS[stepNum - 1].label, fields: missingInStep });
            }
        }
        return missing;
    };

    const onSubmit = async (data: RegistrationData) => {
        setLoading(true);
        try {
            const response = await apiFetch<{ bookingId: string }>('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({ ...data, lockKey }),
            });
            navigate(`/payment/${response.bookingId}`);
        } catch (error: any) {
            alert('Pendaftaran gagal: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'Inter, sans-serif' }}>

            {/* Top bar */}
            <div style={{
                background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
                padding: '0.5rem 1rem', textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#fca5a5' }}>timer</span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'white' }}>
                    Segera selesaikan pendaftaran sebelum slot habis
                </span>
            </div>

            {/* Header */}
            <nav style={{ background: '#131210', borderBottom: '1px solid var(--color-border)', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', background: 'var(--color-primary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#0a0907', fontVariationSettings: "'FILL' 1" }}>mosque</span>
                    </div>
                    <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
                        AL<span style={{ color: 'var(--color-primary)' }}>MADINAH</span>
                    </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                    Pendaftaran Jamaah
                </span>
            </nav>

            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

                {/* ===== STEPPER (clickable) ===== */}
                <div style={{ marginBottom: '3rem' }}>
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* Background line */}
                        <div style={{ position: 'absolute', top: '19px', left: '19px', right: '19px', height: '2px', background: 'var(--color-border)', zIndex: 0 }} />
                        {/* Active line */}
                        <div style={{ position: 'absolute', top: '19px', left: '19px', height: '2px', background: 'var(--color-primary)', zIndex: 1, width: `calc(${progress}% * (100% - 38px) / 100)`, transition: 'width 0.4s ease' }} />

                        {STEPS.map((step, idx) => {
                            const stepNum = idx + 1;
                            const isDone = currentStep > stepNum;
                            const isActive = currentStep === stepNum;
                            return (
                                <div
                                    key={step.label}
                                    onClick={() => goToStep(stepNum)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 2, cursor: 'pointer' }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '9999px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.8125rem', transition: 'all 0.3s',
                                        background: isDone ? 'var(--color-primary)' : isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.07)',
                                        border: isActive ? '2px solid var(--color-primary)' : isDone ? 'none' : '2px solid var(--color-border)',
                                        color: isDone || isActive ? 'var(--color-bg)' : 'var(--color-text-muted)',
                                        boxShadow: isActive ? 'var(--shadow-gold)' : 'none'
                                    }}>
                                        {isDone
                                            ? <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check</span>
                                            : <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{step.icon}</span>
                                        }
                                    </div>
                                    <span style={{
                                        fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: isActive ? 'var(--color-primary)' : isDone ? 'var(--color-text-muted)' : 'var(--color-text-light)'
                                    }}>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ===== FORM CARD ===== */}
                <div style={{ background: '#1a1917', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.375rem' }}>
                            Langkah {currentStep}: {STEPS[currentStep - 1].label}
                        </h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                            {currentStep === 1 && 'Pilih paket umroh dan jadwal keberangkatan.'}
                            {currentStep === 2 && 'Lengkapi data diri sesuai dengan KTP yang berlaku.'}
                            {currentStep === 3 && 'Informasi dokumen paspor Anda.'}
                            {currentStep === 4 && 'Data kontak dan informasi personal.'}
                            {currentStep === 5 && 'Kontak darurat dan sumber informasi.'}
                            {currentStep === 6 && 'Periksa kembali data Anda sebelum mendaftar.'}
                        </p>
                    </div>

                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(onSubmit)}>
                            {currentStep === 1 && <StepProduct packageId={searchParams.get('package') || ''} />}
                            {currentStep === 2 && <StepPersonal />}
                            {currentStep === 3 && <StepPassport />}
                            {currentStep === 4 && <StepContact />}
                            {currentStep === 5 && <StepFamily />}
                            {currentStep === 6 && <StepReview isLoading={loading} getMissingFields={getMissingFields} goToStep={goToStep} />}

                            {/* Navigation */}
                            <div style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)'
                            }}>
                                <button type="button" onClick={prevStep} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700,
                                    fontSize: '0.875rem', background: 'rgba(255,255,255,0.06)',
                                    color: 'var(--color-text-muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                                    visibility: currentStep === 1 ? 'hidden' : 'visible'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                                    Kembali
                                </button>

                                {currentStep < 6 ? (
                                    <button type="button" onClick={nextStep} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.75rem 2rem', borderRadius: '0.75rem', fontWeight: 800,
                                        fontSize: '0.875rem', background: 'var(--color-primary)',
                                        color: 'var(--color-bg)', transition: 'all 0.2s', boxShadow: 'var(--shadow-gold)', border: 'none', cursor: 'pointer',
                                    }}>
                                        Langkah {currentStep + 1}: {STEPS[currentStep].label}
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                                    </button>
                                ) : (
                                    <button type="submit" disabled={loading} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.875rem 2.5rem', borderRadius: '0.75rem', fontWeight: 900,
                                        fontSize: '0.9375rem', background: 'var(--color-primary)',
                                        color: 'var(--color-bg)', transition: 'all 0.2s', boxShadow: 'var(--shadow-gold)',
                                        opacity: loading ? 0.7 : 1, border: 'none', cursor: 'pointer',
                                    }}>
                                        {loading ? (
                                            <><span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'spin 1s linear infinite' }}>progress_activity</span> Memproses...</>
                                        ) : (
                                            <><span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>check_circle</span> Daftar Sekarang</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Registration;
