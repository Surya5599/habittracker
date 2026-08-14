import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
    return (
        <div className="flex justify-between items-center text-[10px] font-bold border-b border-edge-subtle py-1">
            <span className="uppercase text-ink-subtle">{label}</span>
            <span className="bg-surface-muted px-2">{value}</span>
        </div>
    );
};
