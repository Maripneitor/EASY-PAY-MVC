import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@ui/components/Sidebar/Sidebar';
import { useAuthContext } from '@ui/context/AuthContext';
import { CommandPalette } from '@ui/components/CommandPalette/CommandPalette';
import { useKeyboardShortcuts } from '@ui/hooks/useKeyboardShortcuts';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { NotificationBell } from '@ui/components/Notifications/NotificationBell';

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        // En pantallas móviles (< 768px), el sidebar siempre inicia cerrado
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            return false;
        }
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved !== null ? saved === 'false' : true;
    });

    // Auto-cerrar sidebar en resize si se reduce a móvil
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const { logout, user } = useAuthContext();

    useKeyboardShortcuts();

    const userName = user?.nombre || user?.name || 'Usuario';
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => {
            const newState = !prev;
            localStorage.setItem('sidebarCollapsed', (!newState).toString());
            return newState;
        });
    };

    return (
        <div className="min-h-screen bg-[#0b0f19] text-[var(--text-primary)] flex flex-col md:flex-row overflow-hidden font-display">
            {/* Header Móvil Superior (Completamente independiente del sidebar, visible solo en móvil) */}
            <header className="w-full h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-40 md:hidden shrink-0">
                <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-10 h-10 text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
                    aria-label="Abrir menú de navegación"
                >
                    <Menu size={22} strokeWidth={2.5} />
                </button>

                <div className="flex items-center gap-2">
                    <img src="/assets/images/logo-ep.png" alt="Easy-Pay" className="w-7 h-7 object-contain" />
                    <span className="font-black text-base tracking-tight text-white">Easy-Pay</span>
                </div>

                <div className="flex items-center">
                    <NotificationBell />
                </div>
            </header>

            {/* Sidebar (Off-canvas en móvil, estático/relativo en desktop) */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={toggleSidebar}
                onLogout={logout}
                userName={userName}
            />

            {/* Contenedor Principal (Main Content: flex-1 flex flex-col min-w-0 overflow-y-auto p-4 md:p-8) */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 transition-all duration-300">
                    <div className="max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
                        <Outlet context={{ toggleSidebar, isSidebarOpen }} />
                    </div>
                </main>
            </div>
            
            <CommandPalette />
        </div>
    );
};