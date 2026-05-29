import React, { useEffect, useState } from 'react';

// ─── Slide 1: Neo-Brutalist Design ────────────────────────────────────────────
export const DesignPreview: React.FC = () => (
    <div className="border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-stone-50 p-3 select-none">
        <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-black">Today's Habits</span>
            <span className="text-[9px] font-bold text-stone-400 border border-stone-300 px-1.5 py-0.5">May 28</span>
        </div>
        {([
            { name: 'Morning Workout', color: '#ef4444', pct: 82, done: true },
            { name: 'Meditate',        color: '#8b5cf6', pct: 91, done: true },
            { name: 'Read 20 mins',    color: '#3b82f6', pct: 67, done: false },
        ] as const).map(h => (
            <div key={h.name} className="flex items-center gap-2 mb-2 border-[2px] border-black p-1.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                <span className="text-[10px] font-bold flex-1 truncate">{h.name}</span>
                <div className="w-14 h-1.5 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden">
                    <div className="h-full" style={{ width: `${h.pct}%`, backgroundColor: h.color }} />
                </div>
                <div
                    className="w-4 h-4 border-2 border-black flex items-center justify-center shrink-0"
                    style={{ backgroundColor: h.done ? h.color : 'white' }}
                >
                    {h.done && <span className="text-white text-[8px] font-black leading-none">✓</span>}
                </div>
            </div>
        ))}
        <div className="flex gap-1.5 mt-1">
            {['Weekly', 'Monthly', 'Year'].map((v, i) => (
                <div key={v} className={`flex-1 text-center text-[8px] font-black uppercase py-1 border-2 border-black ${i === 0 ? 'bg-black text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]' : 'bg-white text-stone-500'}`}>{v}</div>
            ))}
        </div>
    </div>
);

// ─── Slide 2: Multiple Journal Entries ───────────────────────────────────────
export const JournalPreview: React.FC = () => {
    const [blink, setBlink] = useState(true);
    useEffect(() => {
        const iv = setInterval(() => setBlink(b => !b), 550);
        return () => clearInterval(iv);
    }, []);

    return (
        <div className="border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-amber-50 p-3 space-y-2 select-none">
            {[
                { time: '8:32 AM', mood: '😊', text: 'Great morning run. Feeling energized and ready.' },
                { time: '1:15 PM', mood: '😐', text: 'Afternoon slump hit hard — too much coffee.' },
            ].map((e, i) => (
                <div key={i} className="border-[2px] border-black p-2 bg-white">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs leading-none">{e.mood}</span>
                        <span className="text-[9px] font-bold text-stone-400">{e.time}</span>
                    </div>
                    <p className="text-[10px] text-stone-600 leading-snug font-medium">{e.text}</p>
                </div>
            ))}
            {/* Newest entry being typed */}
            <div className="border-[2px] border-amber-400 p-2 bg-white">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs leading-none">😌</span>
                    <span className="text-[9px] font-bold text-stone-400">9:04 PM</span>
                    <span className="ml-auto text-[7px] font-black bg-amber-400 text-black px-1 py-0.5 leading-none">NEW</span>
                </div>
                <p className="text-[10px] text-stone-600 leading-snug font-medium">
                    Feeling calm after meditating{blink ? <span className="font-black text-amber-500">|</span> : ' '}
                </p>
            </div>
        </div>
    );
};

// ─── Slide 3: Journal PDF Export ─────────────────────────────────────────────
export const PdfExportPreview: React.FC = () => {
    const [step, setStep] = useState(0);
    useEffect(() => {
        const t = setTimeout(() => setStep(1), 400);
        const t2 = setTimeout(() => setStep(2), 1200);
        const t3 = setTimeout(() => setStep(0), 3000);
        return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(t3); };
    }, [step]);

    return (
        <div className="border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-stone-200 p-2.5 flex gap-2.5 select-none overflow-hidden">
            {/* Sidebar */}
            <div className="w-[72px] shrink-0 border-[2px] border-black bg-stone-50 p-2 space-y-1.5">
                <div className="text-[7px] font-black uppercase text-stone-400 tracking-widest">Font</div>
                {['Serif', 'Sans', 'Mono'].map((f, i) => (
                    <div key={f} className={`text-[9px] font-bold px-1 py-0.5 border border-black ${i === 0 ? 'bg-black text-white' : 'bg-white text-stone-500'}`}>{f}</div>
                ))}
                <div className="text-[7px] font-black uppercase text-stone-400 tracking-widest pt-1">Layout</div>
                {['Multi-page', 'Full page'].map((l, i) => (
                    <div key={l} className={`text-[8px] font-bold px-1 py-0.5 border border-black ${i === 0 ? 'bg-black text-white' : 'bg-white text-stone-500'}`}>{l}</div>
                ))}
            </div>

            {/* Page preview sliding in */}
            <div
                className="flex-1 border-[2px] border-black bg-white p-2 transition-all duration-500"
                style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(14px)' }}
            >
                <div className="border-b-2 border-stone-300 pb-1 mb-2">
                    <div className="text-[9px] font-black uppercase tracking-wide">My Journal</div>
                    <div className="text-[8px] text-stone-400 font-medium">Jan – May 2026 · 47 entries</div>
                </div>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-px bg-stone-200 mb-[7px]" />
                ))}
                <div
                    className="transition-all duration-300 mt-1"
                    style={{ opacity: step >= 2 ? 1 : 0 }}
                >
                    <div className="text-[8px] font-black text-stone-500 mb-1">May 28, 2026</div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-px bg-stone-200 mb-[7px]" />
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Slide 4: Monthly Grid ────────────────────────────────────────────────────
export const GridPreview: React.FC = () => {
    const [revealed, setRevealed] = useState(0);
    const TOTAL = 21; // 3 habits × 7 days
    useEffect(() => {
        const iv = setInterval(() => setRevealed(r => r < TOTAL ? r + 1 : 0), 130);
        return () => clearInterval(iv);
    }, []);

    const habits = [
        { name: 'Workout',  color: '#ef4444', completions: [true,  false, true,  true,  false, true,  true ], nonDue: [] },
        { name: 'Meditate', color: '#8b5cf6', completions: [true,  true,  true,  false, true,  false, false], nonDue: [5, 6] },
        { name: 'Read',     color: '#3b82f6', completions: [false, true,  true,  true,  false, true,  true ], nonDue: [] },
    ];
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let cell = 0;

    return (
        <div className="border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white p-2.5 select-none">
            <div className="text-[9px] font-black uppercase tracking-widest mb-2 text-stone-500">May 2026</div>
            {/* Day headers */}
            <div className="grid gap-px mb-1" style={{ gridTemplateColumns: '68px repeat(7, 1fr)' }}>
                <div />
                {days.map((d, i) => (
                    <div key={i} className="text-[8px] font-black text-center text-stone-400">{d}</div>
                ))}
            </div>
            {/* Habit rows */}
            {habits.map(h => (
                <div key={h.name} className="grid gap-px mb-1.5" style={{ gridTemplateColumns: '68px repeat(7, 1fr)' }}>
                    <div className="flex items-center gap-1 pr-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                        <span className="text-[8px] font-bold text-stone-700 truncate">{h.name}</span>
                    </div>
                    {days.map((_, di) => {
                        const idx = cell++;
                        const isND = (h.nonDue as number[]).includes(di);
                        const done = h.completions[di];
                        const show = idx < revealed;
                        return (
                            <div key={di} className="flex items-center justify-center border border-stone-100 rounded-sm" style={{ aspectRatio: '1' }}>
                                {isND ? (
                                    <span className="text-[8px] text-stone-300 font-black leading-none">/</span>
                                ) : show ? (
                                    <div
                                        className="w-2.5 h-2.5 rounded-full border border-black/10"
                                        style={{
                                            backgroundColor: done ? h.color : '#e5e7eb',
                                            transform: 'scale(1)',
                                            transition: 'transform 0.15s ease',
                                        }}
                                    />
                                ) : (
                                    <div className="w-2.5 h-2.5 rounded-full bg-stone-50 border border-stone-100" />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ─── Slide 5: Tasks Panel ─────────────────────────────────────────────────────
export const TasksPreview: React.FC = () => {
    const [checked, setChecked] = useState<number[]>([]);
    const tasks = ['Complete morning workout', 'Review weekly goals', 'Call the dentist', 'Read for 20 mins'];

    useEffect(() => {
        let i = 0;
        const tick = () => {
            if (i < tasks.length) {
                setChecked(prev => [...prev, i++]);
                setTimeout(tick, 700);
            } else {
                setTimeout(() => { i = 0; setChecked([]); setTimeout(tick, 400); }, 1200);
            }
        };
        const init = setTimeout(tick, 300);
        return () => clearTimeout(init);
    }, []);

    const done = checked.length;

    return (
        <div className="border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white p-3 select-none">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest">Tasks · May 28</span>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-black text-stone-500">{done}/{tasks.length}</span>
                    {done === tasks.length && (
                        <span className="text-[7px] font-black bg-green-500 text-white px-1 py-0.5 leading-none">ALL DONE</span>
                    )}
                </div>
            </div>
            <div className="space-y-1.5">
                {tasks.map((t, i) => {
                    const isChecked = checked.includes(i);
                    return (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-2 py-1.5 border-[2px] transition-all duration-300"
                            style={{
                                backgroundColor: isChecked ? '#f0fdf4' : 'white',
                                borderColor: isChecked ? '#86efac' : '#e5e7eb',
                            }}
                        >
                            <div
                                className="w-3.5 h-3.5 border-[2px] border-black flex items-center justify-center shrink-0 transition-all duration-200"
                                style={{ backgroundColor: isChecked ? '#22c55e' : 'white' }}
                            >
                                {isChecked && <span className="text-white text-[8px] font-black leading-none">✓</span>}
                            </div>
                            <span
                                className="text-[10px] font-semibold transition-all duration-300"
                                style={{
                                    color: isChecked ? '#a8a29e' : '#374151',
                                    textDecoration: isChecked ? 'line-through' : 'none',
                                }}
                            >
                                {t}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
