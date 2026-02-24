import React, { useState } from 'react';

const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

export const CommissionCalculator: React.FC = () => {
    const [pax, setPax] = useState<number>(5);
    const [packagePrice, setPackagePrice] = useState<number>(35000000); // 35 JT base
    const [commissionRate, setCommissionRate] = useState<number>(1500000); // 1.5 JT flat

    const estimatedCommission = pax * commissionRate;
    const totalOmset = pax * packagePrice;

    return (
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calculate</span> Kalkulator Komisi
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Simulasikan potensi pendapatan Anda</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Target Jamaah (Pax)</label>
                        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{pax} Orang</span>
                    </div>
                    <input
                        type="range" min="1" max="100" value={pax}
                        onChange={(e) => setPax(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Harga Paket Rata-rata</label>
                        <select
                            value={packagePrice}
                            onChange={(e) => setPackagePrice(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
                        >
                            <option value={28000000}>Rp 28.000.000 (Reguler)</option>
                            <option value={35000000}>Rp 35.000.000 (VIP)</option>
                            <option value={45000000}>Rp 45.000.000 (Plus/Bintang 5)</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '140px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Komisi Per Pax</label>
                        <select
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', outline: 'none' }}
                        >
                            <option value={1000000}>Rp 1.000.000</option>
                            <option value={1500000}>Rp 1.500.000</option>
                            <option value={2000000}>Rp 2.000.000</option>
                            <option value={2500000}>Rp 2.500.000</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ backgroundColor: 'var(--color-primary-bg)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border-gold)' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary-dark)', fontWeight: 700, marginBottom: '0.25rem' }}>Estimasi Komisi</p>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)' }}>
                    {formatCurrency(estimatedCommission)}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '0.25rem' }}>Dari total penjualan {formatCurrency(totalOmset)}</p>
            </div>
        </div>
    );
};
