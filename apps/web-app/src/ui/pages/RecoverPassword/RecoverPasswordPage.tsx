import React, { useState } from 'react';
import { Mail, ArrowLeft, Sun, Moon, Lock, Loader2, KeyRound } from 'lucide-react';
import styles from './RecoverPassword.module.css';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../../infrastructure/routes';
import { toast } from 'sonner';

import { userRepository } from '../../../infrastructure/api/repositories';

import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export const RecoverPasswordPage = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();
    const { user, updateUserSession } = useAuthContext();
    const isAuthenticated = !!user;

    useDocumentTitle('Recuperar Contraseña | Easy-Pay');
    
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    React.useEffect(() => {
        let timer: any;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const [tempToken, setTempToken] = useState<string | null>(null);
    const [tempUser, setTempUser] = useState<any | null>(null);

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await userRepository.requestPasswordReset(email);
            
            if (data.status === 'success') {
                toast.success('Código enviado a tu correo');
                if (data.user_id) {
                    setUserId(data.user_id);
                    setStep(2);
                    setCountdown(5); // Iniciar espera al entrar en paso 2
                } else {
                    toast.info(data.message);
                }
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al solicitar restablecimiento');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;
        setResending(true);
        try {
            await userRepository.requestPasswordReset(email);
            toast.success('Código reenviado');
            setCountdown(5); // 5 segundos de espera
        } catch (error: any) {
            toast.error(error.message || 'Error al reenviar código');
        } finally {
            setResending(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await userRepository.verifyTwoFactor(userId, code);
            
            if (data.status === 'success') {
                toast.success('Código verificado correctamente');
                // Guardamos el token y usuario temporalmente para el auto-login final
                if (data.access_token) {
                    setTempToken(data.access_token);
                    setTempUser(data.user);
                }
                setStep(3);
            } else {
                toast.error(data.message || 'Código inválido');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al verificar código');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        
        setLoading(true);
        try {
            await userRepository.changePassword(userId, { 
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            toast.success('Contraseña actualizada correctamente');

            // MEJORA: Auto-login si tenemos el token de la verificación
            if (tempToken && tempUser) {
                updateUserSession(tempUser, tempToken);
                toast.success('Sesión iniciada automáticamente');
                navigate(ROUTES.DASHBOARD);
            } else {
                // Si no hay token (poco probable), mandamos al login manual
                navigate(ROUTES.AUTH);
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al cambiar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <button className={styles.backBtn} onClick={() => navigate(ROUTES.LANDING)}>
                <ArrowLeft size={18} />
                <span>Regresar al inicio</span>
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
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
                </div>

                <div className={styles.glassCard}>
                    {step === 1 && (
                        <>
                            <div className="text-center mb-8">
                                <h2 className={styles.formTitle}>¿Olvidaste tu contraseña?</h2>
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    No te preocupes. Introduce tu email y te enviaremos un código para restablecerla.
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleRequestReset}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="email">Email</label>
                                    <div className={styles.inputWrapper}>
                                        <Mail className={styles.inputIcon} size={20} />
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="tu@ejemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar código'}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <div className="text-center mb-8">
                                <h2 className={styles.formTitle}>Ingresa el código</h2>
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    Hemos enviado un código de verificación a <strong>{email}</strong>
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleVerifyCode}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="code">Código de verificación</label>
                                    <div className={styles.inputWrapper}>
                                        <KeyRound className={styles.inputIcon} size={20} />
                                        <input
                                            type="text"
                                            id="code"
                                            placeholder="Ej. 123456"
                                            value={code}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 6) setCode(val);
                                            }}
                                            required
                                            disabled={loading}
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verificar código'}
                                </button>

                                <div className="text-center mt-4">
                                    <button 
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={loading || resending || countdown > 0}
                                        className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
                                    >
                                        {resending && <Loader2 className="animate-spin" size={12} />}
                                        {countdown > 0 
                                            ? `Reenviar en ${countdown}s` 
                                            : '¿No recibiste el código? Reenviar'
                                        }
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <div className="text-center mb-8">
                                <h2 className={styles.formTitle}>Nueva contraseña</h2>
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    Ingresa tu nueva contraseña para acceder a tu cuenta.
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleChangePassword}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="newPassword">Nueva contraseña</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={20} />
                                        <input
                                            type="password"
                                            id="newPassword"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
                                    <label htmlFor="confirmPassword">Confirmar contraseña</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={20} />
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Cambiar contraseña'}
                                </button>
                            </form>
                        </>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <button
                            type="button"
                            className={styles.switchBtn}
                            onClick={() => navigate(isAuthenticated ? ROUTES.PROFILE : ROUTES.AUTH)}
                            style={{ margin: '0 auto' }}
                            disabled={loading}
                        >
                            <ArrowLeft size={18} />
                            <span>{isAuthenticated ? 'Cancelar y volver al Perfil' : 'Volver al inicio de sesión'}</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
