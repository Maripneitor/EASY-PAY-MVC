import React from 'react';
import styles from './ThemeSwitch.module.css';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitch = () => {
    const { toggleTheme, isDark } = useTheme();
    
    // Si isDark es false, significa que el fondo es blanco (Luz)
    const isLightActive = !isDark;

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div className="hidden md:block">
                <label className={styles.switch}>
                    <input
                        type="checkbox"
                        checked={isLightActive}
                        onChange={toggleTheme}
                        id="theme-checkbox"
                    />
                    <span className={styles.slider}>
                        <div className={`${styles.star} ${styles.star_1}`} />
                        <div className={`${styles.star} ${styles.star_2}`} />
                        <div className={`${styles.star} ${styles.star_3}`} />
                        <svg viewBox="0 0 16 16" className={`${styles.cloud} ${styles.cloud_1}`}>
                            <path
                                transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                                fill="#fff"
                                d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                            />
                        </svg>
                    </span>
                </label>
            </div>

            <button
                onClick={toggleTheme}
                className="p-2 mr-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-yellow-400 md:hidden transition-colors"
                aria-label="Toggle theme"
            >
                {isLightActive ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} />}
            </button>
        </div>
    );
};