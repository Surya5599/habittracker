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
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-surface border border-edge shadow-xl p-4 rounded-lg w-[280px]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-surface-strong rounded-full"><ChevronLeft size={16} /></button>
                <div className="font-bold text-sm">
                    {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
                </div>
                <button onClick={handleNextMonth} className="p-1 hover:bg-surface-strong rounded-full"><ChevronRight size={16} /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK_SHORT.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-ink-subtle uppercase">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;

                    const isSelected = date.toDateString() === currentDate.toDateString();
                    const isSystemToday = date.toDateString() === new Date().toDateString();

                    return (
                        <button
                            key={i}
                            onClick={() => {
                                onWeekSelect(date);
                                onClose();
                            }}
                            className={`
                                h-8 w-8 rounded-full text-xs font-bold flex flex-col items-center justify-center transition-all relative
                                ${isSelected ? 'text-ink-inverse' : 'hover:bg-surface-strong text-ink'}
                                ${isSystemToday && !isSelected ? 'text-ink-strong font-black' : ''}
                            `}
                            style={isSelected ? { backgroundColor: themePrimary } : {}}
                        >
                            {date.getDate()}
                            {isSystemToday && !isSelected && (
                                <div className="w-1 h-1 rounded-full bg-current absolute bottom-1" />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 pt-2 border-t border-edge-subtle flex justify-center">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onWeekSelect(new Date());
                        onClose();
                    }}
                    className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-surface-inverse text-ink-inverse rounded hover:bg-surface-inverse-hover transition-colors"
                >
                    Today
                </button>
            </div>

            <button onClick={onClose} className="absolute -top-2 -right-2 bg-surface border border-edge rounded-full p-1 shadow-md hover:bg-surface-muted">
                <X size={12} />
            </button>
        </div>
    );
};

