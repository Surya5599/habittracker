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
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-2 pb-safe flex justify-around items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
            <button
                onClick={() => { resetWeekOffset(); setView('weekly'); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-sm transition-all ${view === 'weekly' ? 'text-black' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <div className={`p-1.5 rounded-full ${view === 'weekly' ? 'bg-black text-white' : ''}`}>
                    <Clock size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${view === 'weekly' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>My Week</span>
            </button>

            <button
                onClick={() => setView('monthly')}
                className={`flex flex-col items-center gap-1 p-2 rounded-sm transition-all ${view === 'monthly' ? 'text-black' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <div className={`p-1.5 rounded-full ${view === 'monthly' ? 'bg-black text-white' : ''}`}>
                    <Calendar size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${view === 'monthly' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>My Month</span>
            </button>

            <button
                onClick={() => setView('dashboard')}
                className={`flex flex-col items-center gap-1 p-2 rounded-sm transition-all ${view === 'dashboard' ? 'text-black' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <div className={`p-1.5 rounded-full ${view === 'dashboard' ? 'bg-black text-white' : ''}`}>
                    <LayoutDashboard size={20} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${view === 'dashboard' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>Dashboard</span>
            </button>
        </div>
    );
};
