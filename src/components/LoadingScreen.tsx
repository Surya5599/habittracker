import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center gap-10 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="flex flex-col items-center gap-6"
            >
                <div className="text-center leading-none select-none">
                    <span className="font-serif text-5xl font-black tracking-tighter text-[#404040]">HABI</span>
                    <span className="font-serif text-5xl font-black tracking-tighter text-[#c59b97]">CARD</span>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="neo-border neo-shadow bg-white rounded-2xl overflow-hidden w-64"
                >
                    <div className="h-12 bg-[#c59b97] border-b-[3px] border-black flex items-center justify-center">
                        <div className="h-3 w-20 bg-white/40 rounded-full" />
                    </div>
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-5 h-5 border-2 border-black flex-shrink-0 ${i <= 2 ? 'bg-black' : 'bg-white'}`} />
                                <div className={`h-3 rounded-sm bg-stone-100 ${i === 1 ? 'w-28' : i === 2 ? 'w-20' : i === 3 ? 'w-24' : 'w-16'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="border-t-[3px] border-black grid grid-cols-3 divide-x-[3px] divide-black">
                        {['HABITS', 'TASKS', 'JOURNAL'].map((label) => (
                            <div key={label} className="py-2 flex flex-col items-center gap-1">
                                <div className="text-[8px] font-black uppercase tracking-widest text-stone-400">{label}</div>
                                <div className="h-2 w-6 bg-stone-100 rounded-sm" />
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="flex items-end gap-2"
            >
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                        className="w-3.5 h-3.5 border-2 border-black bg-[#c59b97]"
                    />
                ))}
            </motion.div>
        </div>
    );
};
