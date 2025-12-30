import React, { useRef, useEffect } from 'react';
import { Settings, LayoutDashboard, Calendar, Clock } from 'lucide-react';
import { Theme } from '../types';

interface SettingsMenuProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
    settingsRef: React.RefObject<HTMLDivElement>;
    defaultView: 'daily' | 'monthly' | 'dashboard';
    setDefaultView: (view: 'daily' | 'monthly' | 'dashboard') => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
    theme,
    setTheme,
    themes,
    settingsOpen,
    setSettingsOpen,
    settingsRef,
    defaultView,
    setDefaultView,
}) => {
    return (
        <div ref={settingsRef} className="relative inline-block">
            <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-1.5 rounded-full border border-stone-200 transition-colors ${settingsOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-800 hover:text-black'}`}
                title="Settings"
            >
                <Settings size={14} className={settingsOpen ? 'animate-spin-slow' : ''} />
            </button>

            {settingsOpen && (
                <div className="absolute top-10 left-0 z-50 bg-white border border-stone-300 shadow-xl p-3 w-56 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="mb-4">
                        <div className="text-[9px] font-bold uppercase text-stone-400 mb-2 border-b border-stone-100 pb-1">General</div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-600 block mb-1">Default View</label>
                            <div className="grid grid-cols-3 gap-1">
                                <button
                                    onClick={() => setDefaultView('weekly')}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${defaultView === 'weekly' ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                                    title="Daily View"
                                >
                                    <Clock size={12} className="mb-0.5" />
                                    <span className="text-[8px] font-bold uppercase">Daily</span>
                                </button>
                                <button
                                    onClick={() => setDefaultView('monthly')}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${defaultView === 'monthly' ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                                    title="Monthly View"
                                >
                                    <Calendar size={12} className="mb-0.5" />
                                    <span className="text-[8px] font-bold uppercase">Mnth</span>
                                </button>
                                <button
                                    onClick={() => setDefaultView('dashboard')}
                                    className={`flex flex-col items-center justify-center p-1.5 rounded border transition-all ${defaultView === 'dashboard' ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                                    title="Dashboard View"
                                >
                                    <LayoutDashboard size={12} className="mb-0.5" />
                                    <span className="text-[8px] font-bold uppercase">Dash</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="text-[9px] font-bold uppercase text-stone-400 mb-2 border-b border-stone-100 pb-1">Theme</div>
                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                            {themes.map((t) => (
                                <button
                                    key={t.name}
                                    onClick={() => { setTheme(t); }}
                                    className={`flex items-center gap-2 p-1.5 hover:bg-stone-50 rounded transition-colors text-left ${theme.name === t.name ? 'bg-stone-50 ring-1 ring-stone-200' : ''}`}
                                >
                                    <div className="flex gap-0.5">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }}></div>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.secondary }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold truncate">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
