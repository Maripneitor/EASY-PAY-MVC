import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../../infrastructure/utils';
import { ROUTES } from '../../../infrastructure/routes';

const I18N_TEXTS = {
    DASHBOARD: 'Inicio',
    STATS: 'Estadísticas',
    HELP: 'Ayuda',
    NOTIFICATIONS: 'Notificaciones',
    PROFILE: 'Perfil'
} as const;

interface NavItem {
    id: string;
    path: string;
    label: string;
}

export const MobileNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 10) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const navItems: NavItem[] = [
        { id: 'dashboard', path: ROUTES.DASHBOARD, label: I18N_TEXTS.DASHBOARD },
        { id: 'stats', path: ROUTES.STATS, label: I18N_TEXTS.STATS },
        { id: 'help', path: '/help', label: I18N_TEXTS.HELP },
        { id: 'notifications', path: '/notifications', label: I18N_TEXTS.NOTIFICATIONS },
        { id: 'profile', path: ROUTES.PROFILE, label: I18N_TEXTS.PROFILE },
    ];


    const getActiveId = () => {
        const found = navItems.find(item => location.pathname.startsWith(item.path));
        return found ? found.id : 'dashboard';
    };

    const [activeId, setActiveId] = useState(getActiveId());

    useEffect(() => {
        setActiveId(getActiveId());
    }, [location.pathname]);

    const handleNavigation = (id: string, path: string) => {
        setActiveId(id);
        navigate(path);
    };

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 flex justify-center items-center pb-4 px-2 pointer-events-none md:hidden transition-transform duration-300 ease-in-out",
            !isVisible && "translate-y-[150%]"
        )}>
            <div className="pointer-events-auto w-auto">
                <div className="flex justify-center items-center relative transition-all duration-[450ms] ease-in-out w-auto">
                    <article className="border border-solid border-gray-200 dark:border-slate-700 w-full ease-in-out duration-500 left-0 rounded-2xl flex shadow-xl shadow-black/10 bg-white dark:bg-slate-800 backdrop-blur-md px-2">

                        {navItems.map((item) => (
                            <label
                                key={item.id}
                                className="has-[:checked]:shadow-lg relative w-full h-16 p-4 ease-in-out duration-300 border-solid border-transparent has-[:checked]:border-black/5 dark:has-[:checked]:border-white/10 group flex flex-row gap-3 items-center justify-center text-slate-500 dark:text-slate-400 rounded-xl cursor-pointer"
                                htmlFor={item.id}
                                onClick={() => handleNavigation(item.id, item.path)}
                                title={item.label}
                            >
                                <input
                                    id={item.id}
                                    name="mobile-nav"
                                    type="radio"
                                    className="hidden peer/expand"
                                    checked={activeId === item.id}
                                    readOnly
                                />
                                <div className="relative">
                                    <svg viewBox="0 0 24 24" height={24} width={24} xmlns="http://www.w3.org/2000/svg" className="peer-checked/expand:text-blue-500 peer-checked/expand:fill-blue-500/20 text-2xl peer-checked/expand:scale-125 ease-in-out duration-300 transition-all">
                                        {item.id === 'dashboard' && <path fill="currentColor" d="M4 13h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1zm-1 7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v4zm10 0a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7zm1-10h6a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1z" />}
                                        {item.id === 'stats' && <path fill="currentColor" d="M5 9.2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9.2zM10.5 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12.7a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5zM16 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5.7a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V12z" />}
                                        {item.id === 'help' && (
                                            <>
                                                <path fill="currentColor" d="M11.953 2C6.465 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.493 2 11.953 2zM12 20c-4.411 0-8-3.589-8-8s3.567-8 7.953-8C16.391 4 20 7.589 20 12s-3.589 8-8 8z" />
                                                <path fill="currentColor" d="M11 7h2v7h-2zm0 8h2v2h-2z" />
                                            </>
                                        )}
                                        {item.id === 'notifications' && <path fill="currentColor" d="M12 22a2.01 2.01 0 0 0 2-2h-4a2.01 2.01 0 0 0 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />}
                                        {item.id === 'profile' && <path fill="currentColor" d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" />}
                                    </svg>
                                    {item.id === 'notifications' && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                                </div>
                            </label>
                        ))}
                    </article>
                </div>
            </div>
        </div>
    );
};
