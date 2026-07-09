import React from 'react';

interface DocumentStatus {
    uploaded: boolean;
    verified: boolean;
}

interface DocumentChecklistProps {
    documentStatus?: Record<string, DocumentStatus>;
}

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({ documentStatus }) => {
    const defaultStatus: Record<string, DocumentStatus> = {
        ktp: { uploaded: false, verified: false },
        passport: { uploaded: false, verified: false },
        visa: { uploaded: false, verified: false },
        other: { uploaded: false, verified: false },
        ...(documentStatus || {})
    };

    const docLabels: Record<string, string> = {
        ktp: 'KTP',
        passport: 'Paspor',
        visa: 'Visa',
        other: 'Dokumen Lain'
    };

    const mandatoryKeys = ['ktp', 'passport', 'visa'];
    const totalDocs = mandatoryKeys.length;
    const uploadedDocs = mandatoryKeys.filter(k => defaultStatus[k].uploaded).length;
    const progressPercent = Math.round((uploadedDocs / totalDocs) * 100);

    return (
        <div style={{
            background: '#131210',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            color: 'var(--color-text)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '20px' }}>assignment</span>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.02em' }}>Kelengkapan Dokumen</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{uploadedDocs} / {totalDocs}</span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden', marginBottom: '1.25rem', display: 'flex' }}>
                <div style={{ width: `${progressPercent}%`, background: 'var(--color-primary)', transition: 'width 0.4s ease', borderRadius: '9999px' }} />
            </div>

            {/* Document List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(docLabels).map(([key, label]) => {
                    const status = defaultStatus[key];
                    let badgeColor = '#ef4444'; // Red (Not Uploaded)
                    let badgeBg = 'rgba(239, 68, 68, 0.08)';
                    let iconName = 'close';
                    let statusText = 'Belum Diupload';

                    if (status.uploaded) {
                        if (status.verified) {
                            badgeColor = '#22c55e'; // Green (Verified)
                            badgeBg = 'rgba(34, 197, 94, 0.08)';
                            iconName = 'check';
                            statusText = 'Terverifikasi';
                        } else {
                            badgeColor = '#eab308'; // Yellow/Amber (Uploaded)
                            badgeBg = 'rgba(234, 179, 8, 0.08)';
                            iconName = 'info';
                            statusText = 'Belum Verifikasi';
                        }
                    } else if (key === 'other') {
                        badgeColor = '#888888'; // Gray (Optional)
                        badgeBg = 'rgba(136, 136, 136, 0.08)';
                        iconName = 'circle';
                        statusText = 'Opsional';
                    }

                    return (
                        <div key={key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.625rem 0.875rem',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.03)',
                            borderRadius: '0.5rem'
                        }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-light)' }}>{label}</span>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                background: badgeBg,
                                color: badgeColor,
                                border: `1px solid rgba(${badgeColor === '#ef4444' ? '239,68,68' : badgeColor === '#eab308' ? '234,179,8' : '136,136,136'}, 0.15)`
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '14px', fontWeight: 'bold' }}>{iconName}</span>
                                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{statusText}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DocumentChecklist;
