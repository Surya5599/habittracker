import React, { useState } from 'react';
import { Theme, Habit, HabitCompletion, DailyNote } from '../types';
import { THEMES } from '../constants';
import { Check, LayoutDashboard, Calendar, CreditCard } from 'lucide-react';
import { DailyCard } from './DailyCard';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTheme: Theme;
    onThemeChange: (theme: Theme) => void;
    initialView: 'weekly' | 'monthly' | 'dashboard';
    onViewChange: (view: 'weekly' | 'monthly' | 'dashboard') => void;
    username?: string;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
    isOpen,
    onClose,
    initialTheme,
    onThemeChange,
    initialView,
    onViewChange,
    username
}) => {
    const [step, setStep] = useState(1);
    const [selectedTheme, setSelectedTheme] = useState<Theme>(initialTheme);
    const [selectedView, setSelectedView] = useState<'weekly' | 'monthly' | 'dashboard'>(initialView);

    if (!isOpen) return null;

    const handleThemeSelect = (theme: Theme) => {
        setSelectedTheme(theme);
        onThemeChange(theme);
    };

    const handleViewSelect = (view: 'weekly' | 'monthly' | 'dashboard') => {
        setSelectedView(view);
    };

    const handleNext = () => {
        if (step === 1) {
            setStep(2);
        } else {
            onViewChange(selectedView);
            onClose();
        }
    };

    // Dummy data for preview
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const dummyHabits: Habit[] = [
        { id: '1', name: 'Drink 2L Water', type: 'daily', color: selectedTheme.primary, goal: 100 },
        { id: '2', name: 'Read 20 Pages', type: 'daily', color: selectedTheme.primary, goal: 100 },
        { id: '3', name: 'Meditation', type: 'daily', color: selectedTheme.primary, goal: 100 },
    ];

    const dummyCompletions: HabitCompletion = {
        '1': { [dateKey]: true },
        '2': { [dateKey]: true }, // Ensure better visual progress
        '3': { [dateKey]: false },
    };

    const dummyNotes: DailyNote = {
        [dateKey]: [
            { id: 't1', text: 'Review annual goals', completed: true },
            { id: 't2', text: 'Grocery shopping', completed: false },
        ]
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b-2 border-black bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Step {step} of 2</span>
                        <div className="flex gap-1">
                            <div className={`h-2 w-8 rounded-full ${step >= 1 ? 'bg-black' : 'bg-gray-300'}`} />
                            <div className={`h-2 w-8 rounded-full ${step >= 2 ? 'bg-black' : 'bg-gray-300'}`} />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                        {step === 1 ? 'Choose Your Aesthetic' : 'Select Default View'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {step === 1
                            ? 'Pick a color theme that inspires you.'
                            : 'Which view would you like to see when you open the app?'}
                    </p>
                    <p className="text-gray-600 text-xs">You can change these settings in the settings menu later.</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start h-full">
                            {/* Theme Grid - Left on Desktop */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-2">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.name}
                                        onClick={() => handleThemeSelect(theme)}
                                        className={`
                      relative p-2 border-2 text-left transition-all
                      ${selectedTheme.name === theme.name
                                                ? 'border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50'
                                                : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}
                    `}
                                    >
                                        <div className="flex gap-2 mb-2">
                                            <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: theme.primary }} />
                                            <div className="w-6 h-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: theme.secondary }} />
                                        </div>
                                        <div className="text-xs font-bold text-gray-700 whitespace-normal leading-tight">{theme.name}</div>
                                        {selectedTheme.name === theme.name && (
                                            <div className="absolute top-2 right-2 text-black">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Preview Card - Right on Desktop */}
                            <div className="flex justify-center items-center h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 lg:sticky lg:top-0">
                                <div className="w-full max-w-[320px] transform transition-transform hover:scale-[1.02]">
                                    <DailyCard
                                        date={today}
                                        habits={dummyHabits}
                                        completions={dummyCompletions}
                                        theme={selectedTheme}
                                        toggleCompletion={() => { }}
                                        notes={dummyNotes}
                                        updateNote={() => { }}
                                        onShareClick={() => { }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Weekly Preview */}
                            <button
                                onClick={() => handleViewSelect('weekly')}
                                className={`
                                    relative border-[3px] text-left transition-all group overflow-hidden flex flex-col h-[300px]
                                    ${selectedView === 'weekly'
                                        ? 'border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        : 'border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'}
                                `}
                            >
                                <div className="p-4 border-b-2 border-dashed border-gray-200 flex items-center justify-between bg-white z-10">
                                    <h3 className="font-bold text-lg">Weekly</h3>
                                    {selectedView === 'weekly' && <Check size={20} strokeWidth={3} />}
                                </div>
                                <div className="flex-1 bg-stone-50 p-2 overflow-hidden relative">
                                    {/* Mockup UI */}
                                    <div className="flex gap-2 mb-2 overflow-hidden opacity-50">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex-1 h-32 bg-white border border-black/10 rounded-sm"></div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] w-3/4">
                                            <div className="h-4 w-1/2 bg-black mb-2"></div>
                                            <div className="space-y-2">
                                                <div className="h-2 w-full bg-gray-200"></div>
                                                <div className="h-2 w-3/4 bg-gray-200"></div>
                                                <div className="h-2 w-5/6 bg-gray-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {/* Monthly Preview */}
                            <button
                                onClick={() => handleViewSelect('monthly')}
                                className={`
                                    relative border-[3px] text-left transition-all group overflow-hidden flex flex-col h-[300px]
                                    ${selectedView === 'monthly'
                                        ? 'border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        : 'border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'}
                                `}
                            >
                                <div className="p-4 border-b-2 border-dashed border-gray-200 flex items-center justify-between bg-white z-10">
                                    <h3 className="font-bold text-lg">Monthly</h3>
                                    {selectedView === 'monthly' && <Check size={20} strokeWidth={3} />}
                                </div>
                                <div className="flex-1 bg-stone-50 p-3 overflow-hidden">
                                    {/* Mockup UI */}
                                    <div className="grid grid-cols-7 gap-1 h-full content-start opacity-75">
                                        {Array.from({ length: 28 }).map((_, i) => (
                                            <div key={i} className={`aspect-square border border-gray-200 bg-white ${i === 14 ? 'bg-black text-white' : ''}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </button>

                            {/* Dashboard Preview */}
                            <button
                                onClick={() => handleViewSelect('dashboard')}
                                className={`
                                    relative border-[3px] text-left transition-all group overflow-hidden flex flex-col h-[300px]
                                    ${selectedView === 'dashboard'
                                        ? 'border-black bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                        : 'border-gray-200 hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]'}
                                `}
                            >
                                <div className="p-4 border-b-2 border-dashed border-gray-200 flex items-center justify-between bg-white z-10">
                                    <h3 className="font-bold text-lg">Dashboard</h3>
                                    {selectedView === 'dashboard' && <Check size={20} strokeWidth={3} />}
                                </div>
                                <div className="flex-1 bg-stone-50 p-3 flex flex-col gap-2 overflow-hidden">
                                    {/* Mockup UI */}
                                    <div className="flex gap-2 h-20">
                                        <div className="flex-1 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full border-[3px] border-black border-t-transparent rotation-45"></div>
                                        </div>
                                        <div className="flex-1 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full border-[3px] border-black/20"></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-white border border-gray-200 p-2 space-y-2">
                                        <div className="h-2 w-full bg-gray-100 rounded"></div>
                                        <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                                        <div className="h-2 w-1/2 bg-gray-100 rounded"></div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t-2 border-black bg-gray-50 flex justify-between items-center">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="text-sm font-bold text-gray-500 hover:text-black underline decoration-2 underline-offset-4"
                        >
                            Back
                        </button>
                    )}
                    <div className={step === 1 ? 'ml-auto' : ''}> {/* Spacer to push Next to right if Back is missing */}
                        <button
                            onClick={handleNext}
                            className="bg-black text-white px-8 py-3 font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        >
                            {step === 1 ? 'Next Step' : 'Get Started'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
