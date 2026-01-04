import React from 'react';
import { motion } from 'framer-motion';
import { Theme } from '../types';
import { MONTHS } from '../constants';

interface YearViewProps {
    theme: Theme;
    currentYear: number;
    annualStats: {
        consistencyRate: number;
        monthlySummaries: any[];
    };
}

const YearView: React.FC<YearViewProps> = ({ theme, currentYear, annualStats }) => {
    return (
        <div className="bg-white neo-border neo-shadow rounded-2xl p-6 flex flex-col h-full relative overflow-hidden group">
            <div className="mb-6 flex justify-between items-center z-10 relative">
                <h4 className="font-black uppercase text-sm tracking-widest">{currentYear} Retrospective</h4>
                <p className="text-xl font-black" style={{ color: theme.secondary }}>{annualStats.consistencyRate.toFixed(0)}% Done</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 flex-1 z-10 relative">
                {MONTHS.map((month, idx) => {
                    const summary = annualStats.monthlySummaries[idx] || {};
                    const rate = summary.rate || 0;

                    return (
                        <div key={month} className="flex flex-col items-center group/month">
                            <div className="w-full aspect-square bg-stone-50 border border-stone-200 relative overflow-hidden mb-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    whileInView={{ height: `${rate}%` }}
                                    transition={{ duration: 1, delay: idx * 0.05 }}
                                    className="absolute bottom-0 left-0 right-0 transition-colors duration-300"
                                    style={{ backgroundColor: theme.primary }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center font-black text-[10px] z-10 pointer-events-none mix-blend-multiply transition-opacity">
                                    {rate.toFixed(0)}%
                                </div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-black group-hover/month:text-black transition-colors">{month}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 p-4 border border-black text-white relative z-10" style={{ backgroundColor: theme.secondary }}>
                <p className="text-xs font-bold italic">"Consistency is the signature of greatness."</p>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full opacity-5 pointer-events-none" style={{ backgroundColor: theme.primary }} />
        </div>
    );
};

export default YearView;
