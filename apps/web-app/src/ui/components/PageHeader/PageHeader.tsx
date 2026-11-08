import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { ROUTES } from '../../../infrastructure/routes';
import { cn } from '../../../infrastructure/utils';
import styles from './PageHeader.module.css';

const USER_AVATAR_URL = 'https://ui-avatars.com/api/?name=Juan&background=3b82f6&color=fff&bold=true';
const DEFAULT_USER_NAME = 'Juan';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightSlot?: React.ReactNode;
    showAvatar?: boolean;
    onAvatarClick?: () => void;
    showStats?: boolean;
    onStatsClick?: () => void;
    userName?: string;
    onMenuClick?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    onBack,
    onMenuClick,
    rightSlot,
    showAvatar = false,
    onAvatarClick,
    showStats = false,
    onStatsClick,
    userName = DEFAULT_USER_NAME,
}) => {
    const navigate = useNavigate();

    const handleAvatarClick = onAvatarClick || (() => navigate(ROUTES.PROFILE));
    const handleStatsClick = onStatsClick || (() => navigate(ROUTES.STATS));
    const hasLeftContent = Boolean(onBack || (onMenuClick && !onBack));

    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                {hasLeftContent && (
                    <div className={styles.leftSlot}>
                        <div className="flex items-center gap-1">
                            {onMenuClick && !onBack && (
                                <button 
                                    onClick={onMenuClick} 
                                    className="md:hidden flex items-center justify-center w-10 h-10 -ml-1 text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors shrink-0 active:scale-95" 
                                    aria-label="Abrir menú de navegación"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                            
                            {onBack && (
                                <button 
                                    onClick={onBack} 
                                    className={cn(styles.backBtn, "active:scale-95 transition-transform duration-150 cursor-pointer")} 
                                    aria-label="Volver a la página anterior"
                                >
                                    <ArrowLeft size={18} className={styles.backIcon} aria-hidden="true" />
                                    <span className={cn(styles.backText, "hidden md:inline-block")}>Volver</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <div className={cn(styles.titleContainer, "flex-1 min-w-0")}>
                    {subtitle && (
                        <span className="hidden md:inline-block text-[10px] font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-0.5 truncate">
                            {subtitle}
                        </span>
                    )}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[var(--text-primary)] tracking-tight truncate leading-tight">
                        {title}
                    </h1>
                </div>

                <div className={styles.rightActions}>
                    {rightSlot}
                    {showStats && (
                        <button className={cn(styles.notifBtn, "active:scale-95 transition-transform duration-150 cursor-pointer")} onClick={handleStatsClick} aria-label="Ver historial">
                            <BarChart3 size={20} aria-hidden="true" />
                        </button>
                    )}
                    {showAvatar && (
                        <div className={styles.avatarGroup} onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                            <span className={cn(styles.userNameLabel, "hidden md:inline-block truncate max-w-[120px]")}>{userName}</span>
                            <div className={styles.avatarWrapper}>
                                <img src={USER_AVATAR_URL} alt={userName} className={styles.avatar} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};