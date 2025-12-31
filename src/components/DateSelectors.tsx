import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { MONTHS, DAYS_OF_WEEK_SHORT } from '../constants';

interface WeekPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    onWeekSelect: (date: Date) => void;
    themePrimary: string;
}

export const WeekPicker: React.FC<WeekPickerProps> = ({ isOpen, onClose, currentDate, onWeekSelect, themePrimary }) => {
    const [viewDate, setViewDate] = React.useState(new Date(currentDate));

    if (!isOpen) return null;

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

    // Generate calendar grid
    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));
    }

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-stone-200 shadow-xl p-4 rounded-lg w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-stone-100 rounded-full"><ChevronLeft size={16} /></button>
                <div className="font-bold text-sm">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-stone-100 rounded-full"><ChevronRight size={16} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK_SHORT.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-stone-400 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;

                    const isSelected = date.toDateString() === currentDate.toDateString();
                    // Check if date is in the currently selected week logic if needed, but simple selection is fine for now

                    return (
                        <button
                            key={i}
                            onClick={() => {
                                onWeekSelect(date);
                                onClose();
                            }}
                            className={`
                                h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all
                                ${isSelected ? 'text-white' : 'hover:bg-stone-100 text-stone-700'}
                            `}
                            style={isSelected ? { backgroundColor: themePrimary } : {}}
                        >
                            {date.getDate()}
                        </button>
                    );
                })}
            </div>

            <button onClick={onClose} className="absolute -top-2 -right-2 bg-white border border-stone-200 rounded-full p-1 shadow-md hover:bg-stone-50">
                <X size={12} />
            </button>
        </div>
    );
};

interface MonthPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentMonthIndex: number;
    currentYear: number;
    onMonthSelect: (monthIndex: number, year: number) => void;
    themePrimary: string;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({ isOpen, onClose, currentMonthIndex, currentYear, onMonthSelect, themePrimary }) => {
    const [viewYear, setViewYear] = React.useState(currentYear);

    if (!isOpen) return null;

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-stone-200 shadow-xl p-4 rounded-lg w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={(e) => { e.stopPropagation(); setViewYear(prev => prev - 1); }} className="p-1 hover:bg-stone-100 rounded-full"><ChevronLeft size={16} /></button>
                <div className="font-bold text-sm">
                    {viewYear}
                </div>
                <button onClick={(e) => { e.stopPropagation(); setViewYear(prev => prev + 1); }} className="p-1 hover:bg-stone-100 rounded-full"><ChevronRight size={16} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {MONTHS.map((month, index) => {
                    const isSelected = index === currentMonthIndex && viewYear === currentYear;
                    return (
                        <button
                            key={month}
                            onClick={() => {
                                onMonthSelect(index, viewYear);
                                onClose();
                            }}
                            className={`
                                py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all
                                ${isSelected ? 'text-white' : 'hover:bg-stone-100 text-stone-600'}
                            `}
                            style={isSelected ? { backgroundColor: themePrimary } : {}}
                        >
                            {month.substring(0, 3)}
                        </button>
                    );
                })}
            </div>
            <button onClick={onClose} className="absolute -top-2 -right-2 bg-white border border-stone-200 rounded-full p-1 shadow-md hover:bg-stone-50">
                <X size={12} />
            </button>
        </div>
    );
};

interface YearPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentYear: number;
    onYearSelect: (year: number) => void;
    themePrimary: string;
}

export const YearPicker: React.FC<YearPickerProps> = ({ isOpen, onClose, currentYear, onYearSelect, themePrimary }) => {
    if (!isOpen) return null;

    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
        years.push(i);
    }

    return (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white border border-stone-200 shadow-xl p-4 rounded-lg w-[200px]">
            <div className="text-center font-bold text-sm mb-3 uppercase tracking-wider text-stone-500">Select Year</div>
            <div className="grid grid-cols-3 gap-2 h-[200px] overflow-y-auto custom-scrollbar">
                {years.map(year => {
                    const isSelected = year === currentYear;
                    return (
                        <button
                            key={year}
                            onClick={() => {
                                onYearSelect(year);
                                onClose();
                            }}
                            className={`
                                py-2 rounded-md text-xs font-bold transition-all
                                ${isSelected ? 'text-white' : 'hover:bg-stone-100 text-stone-600'}
                            `}
                            style={isSelected ? { backgroundColor: themePrimary } : {}}
                        >
                            {year}
                        </button>
                    )
                })}
            </div>
            <button onClick={onClose} className="absolute -top-2 -right-2 bg-white border border-stone-200 rounded-full p-1 shadow-md hover:bg-stone-50">
                <X size={12} />
            </button>
        </div>
    );
};
