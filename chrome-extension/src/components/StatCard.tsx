import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
    return (
        <div className="flex justify-between items-center text-[10px] font-bold border-b border-stone-100 py-1">
            <span className="uppercase text-stone-400">{label}</span>
            <span className="bg-stone-50 px-2">{value}</span>
        </div>
    );
};
