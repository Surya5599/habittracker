import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LayoutDashboard, Calendar, Clock, MessageSquare, ChevronRight, ChevronDown, Check, Shield, Moon, Sun, Sparkles, Download, Globe, SlidersHorizontal, Palette, LogOut, KeyRound, Trash2, User, Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';
import { AI_COACH_PERSONALITIES, AiCoachPersonality, personalityAvatarUrl } from '../utils/aiCoachPrompt';

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
    colorMode: 'light' | 'dark';
    setColorMode: (mode: 'light' | 'dark') => void;
    cardStyle: 'compact' | 'large';
    setCardStyle: (style: 'compact' | 'large') => void;
    aiPersonality: AiCoachPersonality;
    setAiPersonality: (personality: AiCoachPersonality) => void;
    aiCoachEnabled: boolean;
    setAiCoachEnabled: (enabled: boolean) => void;
    onReportBug: () => void;
    onOpenWhatsNew: () => void;
    onOpenTutorial: () => void;
    onExportData: () => void;
    onViewJournal: () => void;
    isExportingData?: boolean;
    hasUnreadFeedback?: boolean;
    hasUnseenWhatsNew?: boolean;
    onLogout?: () => void;
    onChangePassword?: () => void;
    onDeleteAccount?: () => void;
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
    colorMode,
    setColorMode,
    cardStyle,
    setCardStyle,
    aiPersonality,
    setAiPersonality,
    aiCoachEnabled,
    setAiCoachEnabled,
    onReportBug,
    onOpenWhatsNew,
    onOpenTutorial,
    onExportData,
    onViewJournal,
    isExportingData = false,
    hasUnreadFeedback = false,
    hasUnseenWhatsNew = false,
    onLogout,
    onChangePassword,
    onDeleteAccount,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [expandedSection, setExpandedSection] = useState<'language' | 'theme' | 'cardStyle' | 'aiPersonality' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toggleSection = (section: 'language' | 'theme' | 'cardStyle' | 'aiPersonality') => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div ref={settingsRef} className="relative inline-block">
            <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`p-1.5 rounded-full border-2 border-edge-strong transition-colors relative ${settingsOpen ? 'bg-surface-strong text-ink-strong' : 'text-ink-strong hover:text-ink-strong'}`}
                title={t('settings.title')}
            >
                <Settings size={14} className={settingsOpen ? 'animate-spin-slow' : ''} />
                {(hasUnreadFeedback || hasUnseenWhatsNew) && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-ink-inverse" />
                )}
            </button>

            {settingsOpen && (
                <div className="absolute top-10 right-0 z-50 bg-surface border-3 border-edge-strong shadow-neo rounded-xl p-2 w-72 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
                    <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                            <SlidersHorizontal size={12} className="text-ink-subtle" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Preferences</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors">
                            <span className="text-[10px] font-bold uppercase text-ink-muted">{t('settings.general.startOfWeek')}</span>
                            <div className="flex bg-surface-strong p-1 rounded-lg">
                                {[
                                    { id: 'sunday', label: 'SUN' },
                                    { id: 'monday', label: 'MON' }
                                ].map((day) => (
                                    <button
                                        key={day.id}
                                        onClick={() => setStartOfWeek(day.id as 'monday' | 'sunday')}
                                        className={`px-2 py-1 rounded flex items-center justify-center transition-all text-[10px] font-bold ${startOfWeek === day.id ? 'bg-surface shadow-sm text-ink-strong' : 'text-ink-subtle hover:text-ink'}`}
                                        title={day.label}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <button
                                onClick={() => toggleSection('language')}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full ${expandedSection === 'language' ? 'bg-surface' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Globe size={12} className="text-ink-subtle" />
                                    <span className="text-[10px] font-bold uppercase text-ink-muted">{t('settings.language.title')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-ink-strong">{language === 'en' ? 'ENG' : language.toUpperCase()}</span>
                                    {expandedSection === 'language' ? <ChevronDown size={12} className="text-ink-subtle" /> : <ChevronRight size={12} className="text-ink-subtle" />}
                                </div>
                            </button>

                            {expandedSection === 'language' && (
                                <div className="grid grid-cols-3 gap-1 p-2 pt-0 animate-in slide-in-from-top-1 duration-200">
                                    {['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => { setLanguage(lang); setExpandedSection(null); }}
                                            className={`flex items-center justify-center py-2 rounded border transition-all ${language === lang ? 'bg-theme-primary text-white border-edge-strong' : 'bg-surface text-ink-muted border-edge hover:border-edge-muted'}`}
                                        >
                                            <span className="text-[10px] font-bold uppercase">{lang === 'en' ? 'ENG' : lang.toUpperCase()}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                            <Palette size={12} className="text-ink-subtle" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Appearance</span>
                        </div>

                        <div className="flex flex-col">
                            <button
                                onClick={() => toggleSection('theme')}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full ${expandedSection === 'theme' ? 'bg-surface' : ''}`}
                            >
                                <span className="text-[10px] font-bold uppercase text-ink-muted">{t('settings.theme.title')}</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }}></div>
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-ink-strong capitalize">{theme.name}</span>
                                    {expandedSection === 'theme' ? <ChevronDown size={12} className="text-ink-subtle" /> : <ChevronRight size={12} className="text-ink-subtle" />}
                                </div>
                            </button>

                            {expandedSection === 'theme' && (
                                <div className="flex flex-col gap-1 p-2 pt-0 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-1 duration-200">
                                    {themes.map((t) => (
                                        <button
                                            key={t.name}
                                            onClick={() => { setTheme(t); setExpandedSection(null); }}
                                            className={`flex items-center justify-between p-2 rounded transition-colors text-left ${theme.name === t.name ? 'bg-surface-strong' : 'hover:bg-surface-muted'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.primary }}></div>
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.secondary }}></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-ink capitalize">{t.name}</span>
                                            </div>
                                            {theme.name === t.name && <Check size={12} className="text-ink-strong" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors">
                            <span className="text-[10px] font-bold uppercase text-ink-muted">Mode</span>
                            <div className="flex bg-surface-strong p-1 rounded-lg">
                                <button
                                    onClick={() => setColorMode('light')}
                                    className={`p-1.5 rounded flex items-center justify-center transition-all ${colorMode === 'light' ? 'bg-surface shadow-sm text-ink-strong' : 'text-ink-subtle hover:text-ink'}`}
                                    title="Light"
                                >
                                    <Sun size={10} />
                                </button>
                                <button
                                    onClick={() => setColorMode('dark')}
                                    className={`p-1.5 rounded flex items-center justify-center transition-all ${colorMode === 'dark' ? 'bg-surface shadow-sm text-ink-strong' : 'text-ink-subtle hover:text-ink'}`}
                                    title="Dark"
                                >
                                    <Moon size={10} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <button
                                onClick={() => toggleSection('cardStyle')}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full ${expandedSection === 'cardStyle' ? 'bg-surface' : ''}`}
                            >
                                <span className="text-[10px] font-bold uppercase text-ink-muted">Card Style</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase text-ink-strong">{cardStyle === 'large' ? 'Large' : 'Compact'}</span>
                                    {expandedSection === 'cardStyle' ? <ChevronDown size={12} className="text-ink-subtle" /> : <ChevronRight size={12} className="text-ink-subtle" />}
                                </div>
                            </button>

                            {expandedSection === 'cardStyle' && (
                                <div className="grid grid-cols-2 gap-2 p-2 pt-0 animate-in slide-in-from-top-1 duration-200">
                                    <button
                                        type="button"
                                        onClick={() => setCardStyle('compact')}
                                        className={`rounded-xl border p-2 text-left transition-all ${cardStyle === 'compact' ? 'border-edge-strong bg-surface shadow-sm' : 'border-edge bg-surface-muted hover:border-edge-muted'}`}
                                    >
                                        <div className="rounded-lg border border-edge-strong overflow-hidden bg-surface">
                                            <div className="flex items-center justify-between px-2 py-2 bg-[#9ab4c1]">
                                                <div className="min-w-0">
                                                    <div className="text-[8px] font-black uppercase tracking-wider text-ink-inverse">Thursday</div>
                                                    <div className="text-[7px] font-bold text-ink-inverse/85">Jan 1, 2026</div>
                                                </div>
                                                <div className="w-7 h-7 rounded-full border-3 border-ink-inverse/35 border-r-white flex items-center justify-center text-[7px] font-black text-ink-inverse">
                                                    40
                                                </div>
                                            </div>
                                            <div className="px-2 py-3 bg-surface-muted">
                                                <div className="h-2 rounded bg-edge mb-1.5"></div>
                                                <div className="h-2 rounded bg-edge w-4/5"></div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] font-black uppercase text-ink">Compact</div>
                                        <div className="text-[9px] text-ink-muted">Small progress badge in the header.</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setCardStyle('large')}
                                        className={`rounded-xl border p-2 text-left transition-all ${cardStyle === 'large' ? 'border-edge-strong bg-surface shadow-sm' : 'border-edge bg-surface-muted hover:border-edge-muted'}`}
                                    >
                                        <div className="rounded-lg border border-edge-strong overflow-hidden bg-surface">
                                            <div className="px-2 py-2 bg-[#9ab4c1] text-center">
                                                <div className="text-[8px] font-black uppercase tracking-wider text-ink-inverse">Thursday</div>
                                                <div className="text-[7px] font-bold text-ink-inverse/85">Jan 1, 2026</div>
                                            </div>
                                            <div className="px-2 py-3 bg-surface-muted flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-full border-[5px] border-edge border-r-[#9ab4c1] flex items-center justify-center text-[10px] font-black text-ink">
                                                    40%
                                                </div>
                                                <div className="mt-2 h-2 rounded bg-edge w-full"></div>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[10px] font-black uppercase text-ink">Large</div>
                                        <div className="text-[9px] text-ink-muted">Big day progress panel under the date.</div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                            <Bot size={12} className="text-ink-subtle" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">AI Coach</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors">
                            <span className="text-[10px] font-bold uppercase text-ink-muted">Enabled</span>
                            <button
                                type="button"
                                onClick={() => setAiCoachEnabled(!aiCoachEnabled)}
                                className={`relative w-9 h-5 rounded-full border-2 border-edge-strong transition-colors ${aiCoachEnabled ? 'bg-surface-inverse' : 'bg-surface'}`}
                                aria-label="Toggle AI Coach"
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full border border-edge-strong bg-surface transition-transform ${aiCoachEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                                />
                            </button>
                        </div>

                        <div className={`flex flex-col transition-opacity ${aiCoachEnabled ? '' : 'opacity-40 pointer-events-none'}`}>
                            <button
                                onClick={() => toggleSection('aiPersonality')}
                                className={`flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full ${expandedSection === 'aiPersonality' ? 'bg-surface' : ''}`}
                            >
                                <span className="text-[10px] font-bold uppercase text-ink-muted">Personality</span>
                                <div className="flex items-center gap-1.5">
                                    <img
                                        src={personalityAvatarUrl(aiPersonality)}
                                        alt=""
                                        className="w-4 h-4 rounded-full border border-edge-strong bg-surface-strong"
                                    />
                                    <span className="text-[10px] font-bold uppercase text-ink-strong">
                                        {AI_COACH_PERSONALITIES.find(p => p.id === aiPersonality)?.label ?? 'Direct'}
                                    </span>
                                    {expandedSection === 'aiPersonality' ? <ChevronDown size={12} className="text-ink-subtle" /> : <ChevronRight size={12} className="text-ink-subtle" />}
                                </div>
                            </button>

                            {expandedSection === 'aiPersonality' && (
                                <div className="flex flex-col gap-1 p-2 pt-0 animate-in slide-in-from-top-1 duration-200">
                                    {AI_COACH_PERSONALITIES.map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setAiPersonality(p.id); setExpandedSection(null); }}
                                            className={`flex items-start gap-2 p-2 rounded transition-colors text-left ${aiPersonality === p.id ? 'bg-surface-strong' : 'hover:bg-surface-muted'}`}
                                        >
                                            <img
                                                src={personalityAvatarUrl(p.id)}
                                                alt={p.label}
                                                className="w-7 h-7 rounded-full border border-edge-strong bg-surface shrink-0"
                                                loading="lazy"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-[10px] font-bold text-ink uppercase">{p.label}</span>
                                                    {aiPersonality === p.id && <Check size={12} className="text-ink-strong shrink-0" />}
                                                </div>
                                                <span className="text-[9px] text-ink-muted">{p.description}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                            <Download size={12} className="text-ink-subtle" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Data</span>
                        </div>

                        <button
                            onClick={() => {
                                onExportData();
                                setSettingsOpen(false);
                            }}
                            disabled={isExportingData}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full text-left group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">Export Data</span>
                            <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                                <span className="text-[10px] font-bold">{isExportingData ? 'Preparing...' : 'Download'}</span>
                                <Download size={12} />
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                onViewJournal();
                                setSettingsOpen(false);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full text-left group"
                        >
                            <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">View Journal</span>
                            <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                                <span className="text-[10px] font-bold">Preview + Download</span>
                                <Download size={12} />
                            </div>
                        </button>
                    </div>

                    <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                        <div className="flex items-center gap-2 px-2 pb-2">
                            <MessageSquare size={12} className="text-ink-subtle" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Support</span>
                        </div>

                    {/* What's New */}
                    <button
                        onClick={() => {
                            onOpenWhatsNew();
                            setSettingsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">What&apos;s New</span>
                        <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                            {hasUnseenWhatsNew && (
                                <span className="px-1.5 py-1 text-[8px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-400">New</span>
                            )}
                            <Sparkles size={12} />
                        </div>
                    </button>

                    {/* Tutorial */}
                    <button
                        onClick={() => {
                            onOpenTutorial();
                            setSettingsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">Run Tutorial</span>
                        <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                            <Sparkles size={12} />
                        </div>
                    </button>

                    {/* Support Link */}
                    <button
                        onClick={() => {
                            onReportBug();
                            setSettingsOpen(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">{t('settings.support.title')}</span>
                        <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
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
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-muted transition-colors w-full text-left group"
                    >
                        <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">Privacy</span>
                        <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                            <span className="text-[10px] font-bold">Policy</span>
                            <Shield size={12} />
                        </div>
                    </button>
                    </div>

                    {(onLogout || onChangePassword || onDeleteAccount) && (
                        <div className="rounded-xl border border-edge bg-surface-muted/70 p-2">
                            <div className="flex items-center gap-2 px-2 pb-2">
                                <User size={12} className="text-ink-subtle" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Account</span>
                            </div>

                            {onChangePassword && (
                                <button
                                    onClick={() => {
                                        onChangePassword();
                                        setSettingsOpen(false);
                                    }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full text-left group"
                                >
                                    <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">Change Password</span>
                                    <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                                        <span className="text-[10px] font-bold">Email reset</span>
                                        <KeyRound size={12} />
                                    </div>
                                </button>
                            )}

                            {onLogout && (
                                <button
                                    onClick={() => {
                                        setSettingsOpen(false);
                                        onLogout();
                                    }}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-surface transition-colors w-full text-left group"
                                >
                                    <span className="text-[10px] font-bold uppercase text-ink-muted group-hover:text-ink">Log Out</span>
                                    <div className="flex items-center gap-1.5 text-ink-subtle group-hover:text-ink-strong transition-colors">
                                        <LogOut size={12} />
                                    </div>
                                </button>
                            )}

                            {onDeleteAccount && !showDeleteConfirm && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 transition-colors w-full text-left group"
                                >
                                    <span className="text-[10px] font-bold uppercase text-red-400 group-hover:text-red-600">Delete Account</span>
                                    <div className="flex items-center gap-1.5 text-red-300 group-hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                    </div>
                                </button>
                            )}

                            {onDeleteAccount && showDeleteConfirm && (
                                <div className="mx-2 mb-1 p-3 rounded-lg border-2 border-red-400 bg-red-50">
                                    <p className="text-[10px] font-bold text-red-700 mb-2 leading-relaxed">This permanently deletes all your habits, completions, and journal entries. This cannot be undone.</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setSettingsOpen(false);
                                                onDeleteAccount();
                                            }}
                                            className="flex-1 py-1.5 text-[10px] font-black uppercase bg-red-500 text-ink-inverse rounded border-2 border-red-600 hover:bg-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1 py-1.5 text-[10px] font-black uppercase bg-surface text-ink rounded border-2 border-edge-muted hover:border-edge-hover transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
