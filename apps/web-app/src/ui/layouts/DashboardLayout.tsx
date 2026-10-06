import { useState } from 'react';
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
        const saved = localStorage.getItem('sidebarCollapsed');
        return saved !== null ? saved === 'false' : true;
    });
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
        <div className="flex h-screen bg-[var(--bg-body)] text-[var(--text-primary)] overflow-hidden transition-colors duration-300 font-display">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={toggleSidebar}
                onLogout={logout}
                userName={userName}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 transition-all duration-300">
                    <div className="max-w-7xl mx-auto w-full space-y-8">
                        <div className="flex justify-end items-center mb-4">
                            <NotificationBell />
                        </div>
                        <Outlet context={{ toggleSidebar, isSidebarOpen }} />
                    </div>
                </main>
            </div>
            
            <CommandPalette />
        </div>
    );
};