import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LayoutDashboard, Calendar, Clock, MessageSquare, ChevronRight, ChevronDown, Check, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';

interface SettingsMenuProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
    settingsOpen: boolean;
    setSettingsOpen: (open: boolean) => void;
    settingsRef: React.RefObject<HTMLDivElement>;
    language: string;
    setLanguage: (lang: string) => void;
    startOfWeek: 'monday' | 'sunday';
    setStartOfWeek: (start: 'monday' | 'sunday') => void;
    defaultView: 'daily' | 'monthly' | 'dashboard';
    setDefaultView: (view: 'daily' | 'monthly' | 'dashboard') => void;
    onReportBug: () => void;
    hasUnreadFeedback?: boolean;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
    theme,
    setTheme,
    themes,
    settingsOpen,
    setSettingsOpen,
    settingsRef,
    language,
    setLanguage,
    startOfWeek,
    setStartOfWeek,
    defaultView,
    setDefaultView,
    onReportBug,
    hasUnreadFeedback = false,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [expandedSection, setExpandedSection] = useState<'language' | 'theme' | null>(null);

    const toggleSection = (section: 'language' | 'theme') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div ref={settingsRef} className="relative inline-block">
            <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-1.5 rounded-full border border-stone-200 transition-colors relative ${settingsOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-800 hover:text-black'}`}
                title={t('settings.title')}
            >
                <Settings size={14} className={settingsOpen ? 'animate-spin-slow' : ''} />
                {hasUnreadFeedback && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
            </button>

            {settingsOpen && (
                <div className="absolute top-10 right-0 z-50 bg-white border border-stone-200 shadow-xl rounded-xl p-2 w-64 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-1">

                    {/* Default View - Segmented Control */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
                        <span className="text-[10px] font-bold uppercase text-stone-500">{t('settings.general.defaultView')}</span>
                        <div className="flex bg-stone-100 p-0.5 rounded-md">
                            {[
                                { id: 'weekly', icon: Clock, label: t('settings.general.views.daily') },
                                { id: 'monthly', icon: Calendar, label: t('settings.general.views.monthly') },
                                { id: 'dashboard', icon: LayoutDashboard, label: t('settings.general.views.dashboard') }
                            ].map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => setDefaultView(view.id as any)}
                                    className={`p-1.5 rounded flex items-center justify-center transition-all ${defaultView === view.id ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'}`}
                                    title={view.label}
                                >
                                    <view.icon size={12} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Section */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => toggleSection('language')}
                            className={`flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors w-full ${expandedSection === 'language' ? 'bg-stone-50' : ''}`}
                        >
                            <span className="text-[10px] font-bold uppercase text-stone-500">{t('settings.language.title')}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold uppercase text-black">{language === 'en' ? 'ENG' : language.toUpperCase()}</span>
                                {expandedSection === 'language' ? <ChevronDown size={12} className="text-stone-400" /> : <ChevronRight size={12} className="text-stone-400" />}
                            </div>
                        </button>

                        {expandedSection === 'language' && (
                            <div className="grid grid-cols-3 gap-1 p-2 pt-0 animate-in slide-in-from-top-1 duration-200">
                                {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => { setLanguage(lang); setExpandedSection(null); }}
                                        className={`flex items-center justify-center py-2 rounded border transition-all ${language === lang ? 'bg-black text-white border-black' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'}`}
                                    >
                                        <span className="text-[10px] font-bold uppercase">{lang === 'en' ? 'ENG' : lang.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Start of Week - Segmented Control */}
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
                        <span className="text-[10px] font-bold uppercase text-stone-500">{t('settings.general.startOfWeek')}</span>
                        <div className="flex bg-stone-100 p-0.5 rounded-md">
                            {[
                                { id: 'sunday', label: 'SUN' },
                                { id: 'monday', label: 'MON' }
                            ].map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => setStartOfWeek(day.id as 'monday' | 'sunday')}
                                    className={`px-2 py-1 rounded flex items-center justify-center transition-all text-[10px] font-bold ${startOfWeek === day.id ? 'bg-white shadow-sm text-black' : 'text-stone-400 hover:text-stone-600'}`}
                                    title={day.label}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => toggleSection('theme')}
                            className={`flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors w-full ${expandedSection === 'theme' ? 'bg-stone-50' : ''}`}
                        >
                            <span className="text-[10px] font-bold uppercase text-stone-500">{t('settings.theme.title')}</span>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-0.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-black capitalize">{theme.name}</span>
                                {expandedSection === 'theme' ? <ChevronDown size={12} className="text-stone-400" /> : <ChevronRight size={12} className="text-stone-400" />}
                            </div>
                        </button>

                        {expandedSection === 'theme' && (
                            <div className="flex flex-col gap-1 p-2 pt-0 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                                {themes.map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => { setTheme(t); setExpandedSection(null); }}
                                        className={`flex items-center justify-between p-2 rounded transition-colors text-left ${theme.name === t.name ? 'bg-stone-100' : 'hover:bg-stone-50'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-0.5">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }}></div>
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.secondary }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-700 capitalize">{t.name}</span>
                                        </div>
                                        {theme.name === t.name && <Check size={12} className="text-black" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-stone-100 my-1" />

                    {/* Support Link */}
                    <button
                        onClick={() => {
                            onReportBug();
                            setSettingsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-stone-500 group-hover:text-stone-700">{t('settings.support.title')}</span>
                        <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-black transition-colors">
                            {hasUnreadFeedback && (
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                            <span className="text-[10px] font-bold">{t('settings.support.reportBug')}</span>
                            <MessageSquare size={12} />
                        </div>
                    </button>

                    {/* Privacy Policy Link */}
                    <button
                        onClick={() => {
                            navigate('/privacy');
                            setSettingsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-stone-500 group-hover:text-stone-700">Privacy</span>
                        <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-black transition-colors">
                            <span className="text-[10px] font-bold">Policy</span>
                            <Shield size={12} />
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};
