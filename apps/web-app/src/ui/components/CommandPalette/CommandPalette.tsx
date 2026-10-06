import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BarChart3, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { groupRepository } from '../../../infrastructure/api/repositories';
import { ROUTES } from '../../../infrastructure/routes';

export const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        const searchGroups = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                // Assuming groupRepository has a way to get all groups or search
                const allGroups = await groupRepository.getActiveGroups();
                const filtered = allGroups.filter((g: any) => 
                    g.nombre.toLowerCase().includes(query.toLowerCase())
                );
                setResults(filtered);
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(searchGroups, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (path: string) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center px-4 py-4 border-b border-[var(--border-color)]">
                            <Search className="text-slate-400 mr-3" size={20} />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Busca grupos, historial, perfil..."
                                className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-slate-500 font-medium"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500">
                                ESC
                            </kbd>
                            <button onClick={() => setIsOpen(false)} className="ml-4 p-1 hover:bg-[var(--hover-bg)] rounded-full transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="max-height-[60vh] overflow-y-auto p-2">
                            {query.length === 0 && (
                                <div className="p-2">
                                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación Rápida</p>
                                    <div className="space-y-1">
                                        <button onClick={() => handleSelect(ROUTES.GROUPS)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--hover-bg)] transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                <Users size={18} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-bold text-[var(--text-primary)]">Grupos</span>
                                                <span className="text-[10px] text-slate-500">Ver tus grupos activos</span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">G</span>
                                        </button>
                                        <button onClick={() => handleSelect(ROUTES.STATS)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--hover-bg)] transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                                <BarChart3 size={18} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-bold text-[var(--text-primary)]">Historial</span>
                                                <span className="text-[10px] text-slate-500">Análisis de historial</span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">E</span>
                                        </button>
                                        <button onClick={() => handleSelect(ROUTES.PROFILE)} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--hover-bg)] transition-colors group">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                <User size={18} />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-bold text-[var(--text-primary)]">Perfil</span>
                                                <span className="text-[10px] text-slate-500">Gestionar cuenta</span>
                                            </div>
                                            <span className="ml-auto text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">P</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {query.length > 0 && results.length > 0 && (
                                <div className="p-2">
                                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupos Encontrados</p>
                                    <div className="space-y-1">
                                        {results.map((group) => (
                                            <button 
                                                key={group.id} 
                                                onClick={() => handleSelect(ROUTES.GROUP_DETAIL(group.id))}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-bold text-xs">
                                                    {group.nombre.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-sm font-bold text-[var(--text-primary)]">{group.nombre}</span>
                                                    <span className="text-[10px] text-slate-500">{group.integrantes?.length} integrantes</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {query.length > 0 && results.length === 0 && !loading && (
                                <div className="p-12 text-center">
                                    <p className="text-sm text-slate-500">No se encontraron resultados para "{query}"</p>
                                </div>
                            )}
                            
                            {loading && (
                                <div className="p-12 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-3 bg-slate-50 dark:bg-black/20 border-t border-[var(--border-color)] flex items-center justify-center gap-4">
                             <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400">↑↓</kbd>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Navegar</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-400">ENTER</kbd>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Seleccionar</span>
                             </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
