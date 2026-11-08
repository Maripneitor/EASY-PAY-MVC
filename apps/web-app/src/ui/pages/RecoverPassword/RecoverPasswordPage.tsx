import React, { useState, useMemo } from 'react';
import { 
    Mail, 
    ArrowLeft, 
    Sun, 
    Moon, 
    Lock, 
    Loader2, 
    KeyRound, 
    Eye, 
    EyeOff, 
    Check, 
    X, 
    ShieldCheck, 
    AlertCircle 
} from 'lucide-react';
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
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmTouched, setConfirmTouched] = useState(false);

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

    // --- Validación de fortaleza y requisitos en tiempo real ---
    const passwordRequirements = useMemo(() => {
        return [
            { id: 'length', label: 'Al menos 8 caracteres', met: newPassword.length >= 8 },
            { id: 'uppercase', label: 'Al menos una letra mayúscula (A-Z)', met: /[A-Z]/.test(newPassword) },
            { id: 'number', label: 'Al menos un número (0-9)', met: /[0-9]/.test(newPassword) },
            { id: 'special', label: 'Un símbolo especial (@, $, !, %, *, #, ?, &)', met: /[^A-Za-z0-9]/.test(newPassword) },
        ];
    }, [newPassword]);

    const strengthScore = useMemo(() => {
        if (!newPassword) return 0;
        let score = 0;
        passwordRequirements.forEach(req => {
            if (req.met) score += 1;
        });
        if (newPassword.length >= 12 && score === 4) score += 1; // bonus longitud
        return score; // 0 a 5
    }, [newPassword, passwordRequirements]);

    const strengthMeta = useMemo(() => {
        if (!newPassword) return { label: '', percent: 0, color: 'transparent' };
        switch (strengthScore) {
            case 1:
                return { label: 'Muy Débil', percent: 20, color: '#ef4444' };
            case 2:
                return { label: 'Débil', percent: 40, color: '#f97316' };
            case 3:
                return { label: 'Media', percent: 65, color: '#eab308' };
            case 4:
                return { label: 'Fuerte', percent: 85, color: '#3b82f6' };
            case 5:
            default:
                return { label: 'Muy Fuerte', percent: 100, color: '#10b981' };
        }
    }, [strengthScore, newPassword]);

    const passwordsMatch = useMemo(() => {
        return newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
    }, [newPassword, confirmPassword]);

    const isStep3Valid = useMemo(() => {
        const hasMinReqs = passwordRequirements.filter(r => r.met).length >= 3 && newPassword.length >= 8;
        return hasMinReqs && passwordsMatch;
    }, [passwordRequirements, newPassword, passwordsMatch]);

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
                    setCountdown(5);
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
            setCountdown(5);
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
        if (newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        setLoading(true);
        try {
            await userRepository.changePassword(userId, { 
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            
            toast.success('Contraseña actualizada correctamente');

            if (tempToken && tempUser) {
                updateUserSession(tempUser, tempToken);
                toast.success('Sesión iniciada automáticamente');
                navigate(ROUTES.DASHBOARD);
            } else {
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
            <button className={styles.backBtn} onClick={() => navigate(ROUTES.LANDING)} aria-label="Regresar al inicio">
                <ArrowLeft size={18} />
                <span>Regresar al inicio</span>
            </button>
            <button className={styles.themeToggle} onClick={toggleTheme} aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className={styles.floatingCircle1} />
            <div className={styles.floatingCircle2} />

            <main className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <img src="/assets/images/logo-ep.png" alt="Logo de Easy-Pay" className={styles.logoImage} />
                    </div>
                    <h1 className={styles.title}>Easy-Pay</h1>
                </div>

                <div className={styles.glassCard}>
                    {/* Indicador de progreso de pasos */}
                    <div className={styles.stepsIndicator} aria-label={`Paso ${step} de 3`}>
                        <span className={`${styles.stepDot} ${step >= 1 ? styles.activeDot : ''}`} />
                        <span className={`${styles.stepDot} ${step >= 2 ? styles.activeDot : ''}`} />
                        <span className={`${styles.stepDot} ${step >= 3 ? styles.activeDot : ''}`} />
                    </div>

                    {step === 1 && (
                        <>
                            <div className="text-center mb-8">
                                <h2 className={styles.formTitle}>¿Olvidaste tu contraseña?</h2>
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    No te preocupes. Introduce tu email y te enviaremos un código para restablecerla.
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleRequestReset} noValidate={false}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="email">Email</label>
                                    <div className={styles.inputWrapper}>
                                        <Mail className={styles.inputIcon} size={20} aria-hidden="true" />
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="tu@ejemplo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                            autoComplete="email"
                                            tabIndex={1}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={loading || !email.trim()} tabIndex={2}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                                            <span>Enviando código...</span>
                                        </>
                                    ) : (
                                        'Enviar código'
                                    )}
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
                                        <KeyRound className={styles.inputIcon} size={20} aria-hidden="true" />
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
                                            tabIndex={1}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button type="submit" className={styles.primaryBtn} disabled={loading || code.length < 4} tabIndex={2}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                                            <span>Verificando...</span>
                                        </>
                                    ) : (
                                        'Verificar código'
                                    )}
                                </button>

                                <div className="text-center mt-4">
                                    <button 
                                        type="button"
                                        onClick={handleResendCode}
                                        disabled={loading || resending || countdown > 0}
                                        className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 disabled:no-underline flex items-center justify-center gap-2 mx-auto"
                                        tabIndex={3}
                                    >
                                        {resending && <Loader2 className="animate-spin" size={12} aria-hidden="true" />}
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
                            <div className="text-center mb-6">
                                <h2 className={styles.formTitle}>Nueva contraseña</h2>
                                <p className={styles.subtitle} style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                                    Crea una contraseña segura para proteger tu cuenta de Easy-Pay.
                                </p>
                            </div>

                            <form className={styles.form} onSubmit={handleChangePassword}>
                                {/* Campo Nueva Contraseña */}
                                <div className={styles.inputGroup}>
                                    <label htmlFor="newPassword">Nueva contraseña</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={20} aria-hidden="true" />
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            id="newPassword"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            disabled={loading}
                                            autoComplete="new-password"
                                            className={styles.hasToggleBtn}
                                            aria-describedby="password-strength-info"
                                            aria-invalid={newPassword.length > 0 && newPassword.length < 8}
                                            tabIndex={1}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePasswordBtn}
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            aria-label={showNewPassword ? 'Ocultar nueva contraseña' : 'Ver nueva contraseña'}
                                            tabIndex={2}
                                        >
                                            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Medidor de Fortaleza de Contraseña */}
                                    {newPassword.length > 0 && (
                                        <div className={styles.strengthMeter} id="password-strength-info" aria-live="polite">
                                            <div className={styles.strengthBarContainer}>
                                                <div className={styles.strengthBarTrack}>
                                                    <div 
                                                        className={styles.strengthBarFill} 
                                                        style={{ 
                                                            width: `${strengthMeta.percent}%`, 
                                                            backgroundColor: strengthMeta.color 
                                                        }}
                                                    />
                                                </div>
                                                <span 
                                                    className={styles.strengthLabel} 
                                                    style={{ color: strengthMeta.color }}
                                                >
                                                    {strengthMeta.label}
                                                </span>
                                            </div>

                                            {/* Checklist de Requisitos en Tiempo Real */}
                                            <ul className={styles.requirementsList}>
                                                {passwordRequirements.map(req => (
                                                    <li 
                                                        key={req.id} 
                                                        className={`${styles.requirementItem} ${req.met ? styles.reqMet : ''}`}
                                                    >
                                                        {req.met ? (
                                                            <Check size={14} className="text-emerald-500" aria-hidden="true" />
                                                        ) : (
                                                            <X size={14} className="text-slate-400" aria-hidden="true" />
                                                        )}
                                                        <span>{req.label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Campo Confirmar Contraseña */}
                                <div className={styles.inputGroup} style={{ marginTop: '0.75rem' }}>
                                    <label htmlFor="confirmPassword">Confirmar contraseña</label>
                                    <div className={styles.inputWrapper}>
                                        <Lock className={styles.inputIcon} size={20} aria-hidden="true" />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value);
                                                if (!confirmTouched) setConfirmTouched(true);
                                            }}
                                            onBlur={() => setConfirmTouched(true)}
                                            required
                                            minLength={8}
                                            disabled={loading}
                                            autoComplete="new-password"
                                            className={`${styles.hasToggleBtn} ${
                                                confirmTouched && confirmPassword
                                                    ? passwordsMatch
                                                        ? styles.inputSuccess
                                                        : styles.inputError
                                                    : ''
                                            }`}
                                            aria-invalid={confirmTouched && !!confirmPassword && !passwordsMatch}
                                            aria-describedby="confirm-password-error"
                                            tabIndex={3}
                                        />
                                        <button
                                            type="button"
                                            className={styles.togglePasswordBtn}
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Ver confirmación de contraseña'}
                                            tabIndex={4}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {/* Mensajes de Validación en Tiempo Real */}
                                    {confirmTouched && confirmPassword && (
                                        <div id="confirm-password-error" aria-live="polite">
                                            {passwordsMatch ? (
                                                <div className={styles.successFeedback}>
                                                    <Check size={14} aria-hidden="true" />
                                                    <span>¡Las contraseñas coinciden!</span>
                                                </div>
                                            ) : (
                                                <div className={styles.errorFeedback}>
                                                    <AlertCircle size={14} aria-hidden="true" />
                                                    <span>Las contraseñas no coinciden</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.primaryBtn} 
                                    disabled={loading || !isStep3Valid}
                                    tabIndex={5}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                                            <span>Cambiando contraseña...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} aria-hidden="true" />
                                            <span>Cambiar contraseña</span>
                                        </>
                                    )}
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
                            tabIndex={6}
                        >
                            <ArrowLeft size={18} aria-hidden="true" />
                            <span>{isAuthenticated ? 'Cancelar y volver al Perfil' : 'Volver al inicio de sesión'}</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
