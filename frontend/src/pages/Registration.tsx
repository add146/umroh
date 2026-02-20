import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiFetch } from '../lib/api';

// Steps components (we'll implement them next)
import StepProduct from '../components/registration/StepProduct';
import StepPersonal from '../components/registration/StepPersonal';
import StepPassport from '../components/registration/StepPassport';
import StepContact from '../components/registration/StepContact';
import StepFamily from '../components/registration/StepFamily';
import StepReview from '../components/registration/StepReview';

const registrationSchema = z.object({
    // Phase 2 Fields
    departureId: z.string().uuid(),
    roomTypeId: z.string().uuid(),

    pilgrim: z.object({
        name: z.string().min(3, "Nama minimal 3 karakter"),
        noKtp: z.string().length(16, "KTP harus 16 digit"),
        sex: z.enum(['L', 'P']),
        born: z.string().min(1, "Tanggal lahir wajib diisi"),
        address: z.string().min(10, "Alamat minimal 10 karakter"),
        fatherName: z.string().min(3),

        hasPassport: z.boolean().default(false),
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

const Registration: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [lockKey, setLockKey] = useState<string | null>(null);

    const methods = useForm<RegistrationData>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            pilgrim: {
                hasPassport: false,
                sex: 'L',
                maritalStatus: 'Belum Menikah'
            }
        }
    });

    const nextStep = async () => {
        // Basic step validation before moving
        const fields = getFieldsForStep(currentStep);
        const isValid = await methods.trigger(fields as any);
        if (isValid) setCurrentStep(prev => Math.min(prev + 1, 6));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const getFieldsForStep = (step: number) => {
        switch (step) {
            case 1: return ['departureId', 'roomTypeId'];
            case 2: return ['pilgrim.name', 'pilgrim.noKtp', 'pilgrim.sex', 'pilgrim.born', 'pilgrim.address', 'pilgrim.fatherName'];
            case 3: return ['pilgrim.hasPassport', 'pilgrim.noPassport', 'pilgrim.passportFrom', 'pilgrim.passportReleaseDate', 'pilgrim.passportExpiry'];
            case 4: return ['pilgrim.maritalStatus', 'pilgrim.phone', 'pilgrim.lastEducation', 'pilgrim.work'];
            case 5: return ['pilgrim.famContactName', 'pilgrim.famContact', 'pilgrim.sourceFrom'];
            default: return [];
        }
    };

    const onSubmit = async (data: RegistrationData) => {
        setLoading(true);
        try {
            const response = await apiFetch<{ bookingId: string }>('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({ ...data, lockKey }),
            });
            // Redirect to payment (Fase 3)
            navigate(`/payment/${response.bookingId}`);

        } catch (error: any) {
            alert('Pendaftaran gagal: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Stepper Header */}
                <div className="mb-12">
                    <div className="flex justify-between items-center relative">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col items-center z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${currentStep >= i ? 'bg-brand-primary text-white' : 'bg-white text-gray-300 border-2 border-gray-200'}`}>
                                    {i}
                                </div>
                                <span className="text-[10px] mt-2 font-bold uppercase text-gray-400 hidden md:block">
                                    {['Produk', 'Pribadi', 'Paspor', 'Kontak', 'Keluarga', 'Review'][i - 1]}
                                </span>
                            </div>
                        ))}
                        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 -z-0"></div>
                        <div
                            className="absolute top-5 left-0 h-0.5 bg-brand-primary transition-all duration-300 -z-0"
                            style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                        {currentStep === 1 && <StepProduct packageId={searchParams.get('package') || ''} />}
                        {currentStep === 2 && <StepPersonal />}
                        {currentStep === 3 && <StepPassport />}
                        {currentStep === 4 && <StepContact />}
                        {currentStep === 5 && <StepFamily />}
                        {currentStep === 6 && <StepReview isLoading={loading} />}

                        <div className="mt-12 flex justify-between border-t pt-8">
                            <button
                                type="button"
                                onClick={prevStep}
                                className={`px-8 py-3 rounded-xl font-bold transition-all ${currentStep === 1 ? 'invisible' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Kembali
                            </button>

                            {currentStep < 6 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-brand-primary text-white px-10 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                                >
                                    Lanjut Ke Step {currentStep + 1}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-brand-secondary text-brand-primary px-12 py-3 rounded-xl font-black hover:bg-opacity-90 shadow-lg shadow-brand-secondary/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? 'Memproses...' : 'Daftar Sekarang'}
                                </button>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
};

export default Registration;
