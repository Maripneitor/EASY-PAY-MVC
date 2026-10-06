import { motion } from 'framer-motion';

export const Loader = () => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg-body)]"
        >
            <div className="relative">
                {/* Outer Glow */}
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-[var(--primary)] blur-3xl rounded-full opacity-20"
                />
                
                {/* Logo / Icon container */}
                <motion.div
                    animate={{ 
                        rotate: 360,
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                        rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="relative w-24 h-24 bg-[var(--bg-card)] rounded-[2rem] border-2 border-[var(--primary)] flex items-center justify-center shadow-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/20 to-transparent" />
                    <span className="text-4xl font-black text-[var(--primary)] tracking-tighter">EP</span>
                </motion.div>
            </div>
            
            <div className="mt-10 flex flex-col items-center">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                >
                    <h2 className="text-xl font-black uppercase tracking-[0.3em] text-[var(--text-primary)]">Easy Pay</h2>
                    <div className="mt-4 flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ 
                                    scale: [1, 1.5, 1],
                                    opacity: [0.3, 1, 0.3]
                                }}
                                transition={{ 
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2
                                }}
                                className="w-2 h-2 bg-[var(--primary)] rounded-full"
                            />
                        ))}
                    </div>
                </motion.div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-60">Sincronizando finanzas...</p>
            </div>
        </motion.div>
    );
};
