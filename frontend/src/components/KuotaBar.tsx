import React from 'react';

interface KuotaBarProps {
    total: number;
    booked: number;
}

const KuotaBar: React.FC<KuotaBarProps> = ({ total, booked }) => {
    const percentage = Math.min((booked / total) * 100, 100);
    const remaining = total - booked;

    let barColor = 'bg-brand-primary';
    if (percentage >= 90) barColor = 'bg-red-600';
    else if (percentage >= 70) barColor = 'bg-yellow-500';

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={remaining <= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                    {remaining === 0 ? 'KUOTA PENUH' : `Sisa: ${remaining} Seat`}
                </span>
                <span className="text-gray-400">{booked}/{total}</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

export default KuotaBar;
