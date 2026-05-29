import React from 'react';
import { LayoutDashboard, Calendar, Clock } from 'lucide-react';
import { Theme } from '../types';

interface BottomNavProps {
    view: 'monthly' | 'dashboard' | 'weekly';
    setView: (view: 'monthly' | 'dashboard' | 'weekly') => void;
    resetWeekOffset: () => void;
    theme: Theme;
}

export const BottomNav: React.FC<BottomNavProps> = ({ view, setView, resetWeekOffset, theme }) => {
    const tabs = [
        { id: 'weekly' as const, label: 'Week', Icon: Clock, onClick: () => { resetWeekOffset(); setView('weekly'); } },
        { id: 'monthly' as const, label: 'Month', Icon: Calendar, onClick: () => setView('monthly') },
        { id: 'dashboard' as const, label: 'Year', Icon: LayoutDashboard, onClick: () => setView('dashboard') },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-[3px] border-black shadow-[0_-6px_0px_0px_rgba(0,0,0,1)] flex justify-around items-center z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {tabs.map(({ id, label, Icon, onClick }) => {
                const isActive = view === id;
                return (
                    <button
                        key={id}
                        onClick={onClick}
                        className="flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-all"
                    >
                        <div
                            className="p-1.5 rounded-sm transition-all"
                            style={isActive ? { backgroundColor: theme.primary } : {}}
                        >
                            <Icon size={16} className={isActive ? 'text-white' : 'text-stone-400'} />
                        </div>
                        <span
                            className={`font-serif text-[9px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-black' : 'text-stone-400'}`}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
