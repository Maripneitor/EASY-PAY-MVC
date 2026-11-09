import React, { useState, useEffect, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Lock, User, Sun, Moon, Loader2, ArrowLeft, ArrowRight, 
    Eye, EyeOff, ShieldCheck, Check, AlertCircle 
} from 'lucide-react';
import styles from './Auth.module.css';
import { useAuth } from './useAuth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import { ROUTES } from '../../../infrastructure/routes';

export const Auth: React.FC = () => {
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
    useDocumentTitle(mode === 'login' ? 'Iniciar Sesión | Easy-Pay' : 'Crear Cuenta | Easy-Pay');

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);

    const emailId = useId();
    const passwordId = useId();
    const nameId = useId();

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    // Validación interactiva de fortaleza de contraseña (en modo registro)
    const passwordRules = useMemo(() => [
        { id: 'len', label: 'Mínimo 8 caracteres', met: password.length >= 8 },
        { id: 'upper', label: 'Una mayúscula (A-Z)', met: /[A-Z]/.test(password) },
        { id: 'num', label: 'Un número (0-9)', met: /[0-9]/.test(password) },
        { id: 'special', label: 'Un símbolo especial (@, $, !, %, *, #, ?, &)', met: /[^A-Za-z0-9]/.test(password) },
    ], [password]);

    const strengthScore = useMemo(() => {
        if (!password) return 0;
        let score = passwordRules.filter(r => r.met).length;
        if (password.length >= 12 && score === 4) score += 1;
        return score;
    }, [password, passwordRules]);

    const strengthColor = useMemo(() => {
        if (strengthScore <= 1) return '#ef4444'; // Red
        if (strengthScore <= 3) return '#f59e0b'; // Amber
        return '#10b981'; // Emerald
    }, [strengthScore]);

    const isPasswordValid = mode === 'login' ? password.length > 0 : strengthScore >= 3 && password.length >= 8;

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(identifier, password);
        } catch {
            setError("Error inesperado al intentar iniciar sesión.");
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (strengthScore < 3 || password.length < 8) {
            setError("La contraseña no cumple con los requisitos mínimos de seguridad.");
            return;
        }
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
            {/* Acciones Superiores de Navegación y Tema */}
            <header className={styles.topBar}>
                <button 
                    type="button" 
                    className={styles.backBtn} 
                    onClick={() => navigate(ROUTES.LANDING)}
                    aria-label="Regresar al inicio"
                >
                    <ArrowLeft size={16} />
                    <span>Inicio</span>
                </button>

                <button 
                    type="button" 
                    className={styles.themeToggle} 
                    onClick={toggleTheme}
                    aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </header>

            {/* Fondos Decorativos Suaves No Invasivos */}
            <div className={styles.ambientGlowPrimary} aria-hidden="true" />
            <div className={styles.ambientGlowSecondary} aria-hidden="true" />

            <main className={styles.container}>
                {/* Header de Identidad de Marca */}
                <div className={styles.brandHeader}>
                    <div className={styles.logoBadge}>
                        <img src="/assets/images/logo-ep.png" alt="Logo Easy-Pay" className={styles.logoImage} />
                    </div>
                    <h1 className={styles.brandTitle}>Easy-Pay</h1>
                    <p className={styles.brandSubtitle}>Control de gastos y liquidaciones compartidas</p>
                </div>

                {/* Tarjeta de Sesión Anti-Plantilla */}
                <div className={styles.authCard}>
                    {/* Control Segmentado con Spring LayoutId */}
                    <div className={styles.segmentedTabs} role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'login'}
                            className={`${styles.tabItem} ${mode === 'login' ? styles.tabItemActive : ''}`}
                            onClick={() => { setMode('login'); setError(null); }}
                            disabled={isAuthenticating}
                        >
                            {mode === 'login' && (
                                <motion.div 
                                    layoutId="authSegmentActive" 
                                    className={styles.activePillHighlight} 
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                            )}
                            <span className={styles.tabLabel}>Iniciar sesión</span>
                        </button>

                        <button
                            type="button"
                            role="tab"
                            aria-selected={mode === 'register'}
                            className={`${styles.tabItem} ${mode === 'register' ? styles.tabItemActive : ''}`}
                            onClick={() => { setMode('register'); setError(null); }}
                            disabled={isAuthenticating}
                        >
                            {mode === 'register' && (
                                <motion.div 
                                    layoutId="authSegmentActive" 
                                    className={styles.activePillHighlight} 
                                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                />
                            )}
                            <span className={styles.tabLabel}>Registrarse</span>
                        </button>
                    </div>

                    {/* Banner de Error Reactivo */}
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                                className={styles.errorAlert}
                                role="alert"
                            >
                                <AlertCircle size={16} className={styles.errorIcon} />
                                <span className={styles.errorText}>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modo Iniciar Sesión */}
                    {mode === 'login' && (
                        <form className={styles.authForm} onSubmit={handleLoginSubmit} noValidate>
                            <div className={styles.fieldBlock}>
                                <label htmlFor={emailId} className={styles.fieldLabel}>
                                    Correo electrónico
                                </label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.fieldIcon} size={18} aria-hidden="true" />
                                    <input
                                        type="email"
                                        id={emailId}
                                        placeholder="usuario@ejemplo.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        autoComplete="username"
                                        disabled={isAuthenticating}
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldBlock}>
                                <div className={styles.passwordRow}>
                                    <label htmlFor={passwordId} className={styles.fieldLabel}>
                                        Contraseña
                                    </label>
                                    <button 
                                        type="button" 
                                        className={styles.forgotLink}
                                        onClick={() => navigate(ROUTES.RECOVER_PASSWORD)}
                                        tabIndex={0}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.fieldIcon} size={18} aria-hidden="true" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id={passwordId}
                                        placeholder="Ingresa tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                        disabled={isAuthenticating}
                                        className={styles.fieldInput}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <motion.button 
                                type="submit" 
                                className={styles.submitBtn} 
                                disabled={isAuthenticating || !identifier.trim() || !password}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.1 }}
                            >
                                {isAuthenticating ? (
                                    <span className={styles.buttonFeedback}>
                                        <Loader2 className={styles.spinnerIcon} size={18} />
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    <span className={styles.buttonFeedback}>
                                        Acceder a la plataforma
                                        <ArrowRight size={16} />
                                    </span>
                                )}
                            </motion.button>
                        </form>
                    )}

                    {/* Modo Registro */}
                    {mode === 'register' && (
                        <form className={styles.authForm} onSubmit={handleRegisterSubmit} noValidate>
                            <div className={styles.fieldBlock}>
                                <label htmlFor={nameId} className={styles.fieldLabel}>
                                    Nombre completo
                                </label>
                                <div className={styles.inputWrapper}>
                                    <User className={styles.fieldIcon} size={18} aria-hidden="true" />
                                    <input
                                        type="text"
                                        id={nameId}
                                        placeholder="Nombre y Apellidos"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        autoComplete="name"
                                        disabled={isAuthenticating}
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldBlock}>
                                <label htmlFor={emailId} className={styles.fieldLabel}>
                                    Correo electrónico
                                </label>
                                <div className={styles.inputWrapper}>
                                    <Mail className={styles.fieldIcon} size={18} aria-hidden="true" />
                                    <input
                                        type="email"
                                        id={emailId}
                                        placeholder="tu@correo.com"
                                        value={identifier}
                                        onChange={(e) => setIdentifier(e.target.value)}
                                        required
                                        autoComplete="email"
                                        disabled={isAuthenticating}
                                        className={styles.fieldInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.fieldBlock}>
                                <label htmlFor={passwordId} className={styles.fieldLabel}>
                                    Contraseña segura
                                </label>
                                <div className={styles.inputWrapper}>
                                    <Lock className={styles.fieldIcon} size={18} aria-hidden="true" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id={passwordId}
                                        placeholder="Crea una contraseña robusta"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (!touchedPassword) setTouchedPassword(true);
                                        }}
                                        required
                                        autoComplete="new-password"
                                        disabled={isAuthenticating}
                                        className={styles.fieldInput}
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                {/* Requisitos de Seguridad en Vivo */}
                                {touchedPassword && password.length > 0 && (
                                    <div className={styles.passwordMeterBox}>
                                        <div className={styles.meterTrack}>
                                            <div 
                                                className={styles.meterFill} 
                                                style={{ 
                                                    width: `${Math.min(100, (strengthScore / 4) * 100)}%`,
                                                    backgroundColor: strengthColor
                                                }}
                                            />
                                        </div>
                                        <div className={styles.rulesList}>
                                            {passwordRules.map(rule => (
                                                <div 
                                                    key={rule.id} 
                                                    className={`${styles.ruleRow} ${rule.met ? styles.ruleRowMet : ''}`}
                                                >
                                                    <span className={styles.ruleDot}>
                                                        {rule.met ? <Check size={11} /> : null}
                                                    </span>
                                                    <span>{rule.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <motion.button 
                                type="submit" 
                                className={styles.submitBtn} 
                                disabled={isAuthenticating || !fullName.trim() || !identifier.trim() || !isPasswordValid}
                                whileTap={{ scale: 0.98 }}
                                transition={{ duration: 0.1 }}
                            >
                                {isAuthenticating ? (
                                    <span className={styles.buttonFeedback}>
                                        <Loader2 className={styles.spinnerIcon} size={18} />
                                        Creando cuenta...
                                    </span>
                                ) : (
                                    <span className={styles.buttonFeedback}>
                                        Completar registro
                                        <ArrowRight size={16} />
                                    </span>
                                )}
                            </motion.button>
                        </form>
                    )}

                    {/* Footer de Seguridad */}
                    <div className={styles.securityBadgeRow}>
                        <ShieldCheck size={14} className={styles.securityBadgeIcon} />
                        <span>Autenticación protegida con JWT, Bcrypt y Rate Limiting</span>
                    </div>
                </div>
            </main>
        </div>
    );
};
