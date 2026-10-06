import React, { useState, useEffect } from 'react';
import { Mail, Lock, Sun, Moon, Loader2, ArrowLeft } from 'lucide-react';
import styles from './Auth.module.css';
import { useAuth } from './useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { ROUTES } from '../../../infrastructure/routes';

export const Auth = () => {
    const {
        mode,
        setMode,
        isAuthenticating,
        error,
        setError,
        register,
        login,
        navigate
    } = useAuth();

    const { isDark, toggleTheme } = useTheme();
    useDocumentTitle(mode === 'login' ? 'Iniciar Sesión' : 'Registrarse');

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (error) {
            toast.error(error);
            setError(null);
        }
    }, [error, setError]);

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(identifier, password);
        } catch (err: any) {
            setError("Error inesperado al intentar iniciar sesión.");
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register({
                nombre: fullName,
                email: identifier,
                password: password
            });
        } catch (err: any) {
            setError(err.message || "No se pudo completar el registro.");
        }
    };

    return (
        <div className={styles.authPage}>
            
            <button className={styles.backBtn} onClick={() => navigate(ROUTES.LANDING)}>
                <ArrowLeft size={18} />
                <span>Regresar al inicio</span>
            </button>

            <button className={styles.themeToggle} onClick={toggleTheme}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className={styles.floatingCircle1} />
            <div className={styles.floatingCircle2} />

            <main className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <img src="/assets/images/logo-ep.png" alt="Logo" className={styles.logoImage} />
                    </div>
                    <h1 className={styles.title}>Easy-Pay</h1>
                    <p className={styles.subtitle}>Dividir gastos nunca fue tan fácil</p>
                </div>

                <div className={styles.glassCard}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
                            onClick={() => { setMode('login'); setError(null); }}
                            disabled={isAuthenticating}
                        >
                            Iniciar Sesión
                        </button>
                        <button
                            className={`${styles.tab} ${mode === 'register' ? styles.tabActive : ''}`}
                            onClick={() => { setMode('register'); setError(null); }}
                            disabled={isAuthenticating}
                        >
                            Registrarse
                        </button>
                    </div>

                    {mode === 'login' && (
                        <form className={styles.form} onSubmit={handleLoginSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="identifier">Email o Usuario</label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} size={20} />
                                    <input
                                        type="text"
                                        id="identifier"
                                        placeholder="ejemplo@mail.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        disabled={isAuthenticating}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <div className={styles.options} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label htmlFor="password">Contraseña</label>
                                    <button 
                                        type="button" 
                                        className={styles.forgotPass}
                                        onClick={() => navigate(ROUTES.RECOVER_PASSWORD)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        ¿Olvidé mi contraseña?
                                    </button>
                                </div>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} size={20} />
                                    <input
                                        type="password"
                                        id="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isAuthenticating}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.primaryBtn} disabled={isAuthenticating}>
                                {isAuthenticating ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
                            </button>
                        </form>
                    )}

                    {mode === 'register' && (
                        <form className={styles.form} onSubmit={handleRegisterSubmit}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="name">Nombre Completo</label>
                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Juan Pérez"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        disabled={isAuthenticating}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-email">Email institucional</label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.inputIcon} size={20} />
                                    <input
                                        type="email"
                                        id="reg-email"
                                        placeholder="tu@ejemplo.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        disabled={isAuthenticating}
                                    />
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-password">Contraseña</label>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.inputIcon} size={20} />
                                    <input
                                        type="password"
                                        id="reg-password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isAuthenticating}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles.primaryBtn} disabled={isAuthenticating}>
                                {isAuthenticating ? <Loader2 className="animate-spin" size={20} /> : 'Crear Cuenta'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};