import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#e5e5e5] flex items-center justify-center p-4">
            <motion.div
                animate={{
                    rotateX: [0, 10, 0],
                    rotateY: [0, -10, 0]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-64 h-96 neo-border neo-shadow bg-white rounded-xl p-6 relative preserve-3d"
                style={{ perspective: 1000 }}
            >
                <div className="h-full flex flex-col">
                    <div className="h-8 w-1/2 bg-[#C19A9A] neo-border mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className={`w-6 h-6 neo-border ${i % 2 === 0 ? 'bg-black' : ''}`}></div>
                                <div className="h-4 flex-1 bg-gray-100 neo-border"></div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto h-32 w-full neo-border bg-[#F8F7F4] flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full border-8 border-gray-100 border-t-[#C19A9A] animate-spin"></div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
