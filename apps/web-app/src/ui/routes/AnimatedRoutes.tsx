import React, { Suspense, lazy, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { ROUTES } from '../../infrastructure/routes';
import { Loader } from '../components/Loader/Loader';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { AnimatePresence, motion } from 'framer-motion';

// ─── ErrorBoundary: captura errores de carga dinámica (React.lazy) ───────────
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class RouteErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[RouteErrorBoundary] Error al cargar módulo:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '100vh', gap: '1rem',
                    fontFamily: 'Inter, system-ui, sans-serif', color: '#e2e8f0',
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                }}>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px', padding: '2rem', textAlign: 'center', maxWidth: '420px',
                    }}>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>
                            Error de conexión
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
                            No se pudo cargar la página. Esto suele ocurrir si el servidor de desarrollo se reinició.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', border: 'none', borderRadius: '8px',
                                padding: '0.625rem 1.5rem', cursor: 'pointer', fontSize: '0.875rem',
                                fontWeight: 600,
                            }}
                        >
                            Reintentar
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- Lazy load de páginas ---
const LandingPage = lazy(() => import('../pages/LandingPage').then(m => ({ default: m.LandingPage })));
const Auth = lazy(() => import('../pages/Auth').then(m => ({ default: m.Auth })));
const RecoverPasswordPage = lazy(() => import('../pages/RecoverPassword/RecoverPasswordPage').then(m => ({ default: m.RecoverPasswordPage })));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const CreateGroup = lazy(() => import('../pages/CreateGroup').then(m => ({ default: m.CreateGroup })));
const GroupDetail = lazy(() => import('../pages/GroupDetail').then(m => ({ default: m.GroupDetail })));

const StatsPage = lazy(() => import('../pages/Stats/StatsPage').then(m => ({ default: m.StatsPage })));
const ProfilePage = lazy(() => import('../pages/Profile').then(m => ({ default: m.ProfilePage })));
const PersonalData = lazy(() => import('../pages/Profile/PersonalData').then(m => ({ default: m.PersonalData })));
const SettleUp = lazy(() => import('../pages/SettleUp').then(m => ({ default: m.SettleUp })));
const RegisterExpense = lazy(() => import('../pages/RegisterExpense').then(m => ({ default: m.RegisterExpense })));
const JoinGroup = lazy(() => import('../pages/JoinGroup').then(m => ({ default: m.JoinGroup })));
const GroupsPage = lazy(() => import('../pages/Groups/GroupsPage').then(m => ({ default: m.GroupsPage })));
const OCRScanner = lazy(() => import('../pages/OCRScanner').then(m => ({ default: m.OCRScanner })));

// 2FA
const TwoFactorSetup = lazy(() => import('../pages/TwoFactorSetup').then(m => ({ default: m.TwoFactorSetup })));
const TwoFactorVerify = lazy(() => import('../pages/TwoFactorSetup').then(m => ({ default: m.TwoFactorVerify })));
const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));

const PageTransition = ({ children }: { children: ReactNode }) => (
    <motion.div
        className="page-enter min-h-screen flex flex-col w-full"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
    >
        {children}
    </motion.div>
);

// ─── Guard: si ya está autenticado, redirige al dashboard ────────────────────
const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthContext();
    if (isLoading) return <Loader />;
    if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
    return <>{children}</>;
};

export const AnimatedRoutes = () => {
    const location = useLocation();
    const { isLoading } = useAuthContext();

    return (
        <RouteErrorBoundary>
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <Loader key="app-loader" />
                ) : (
                    <Suspense fallback={<Loader />} key="app-suspense">
                        <Routes location={location}>
                            {/* Rutas públicas con guard: si estás logueado, van al dashboard */}
                            <Route path={ROUTES.LANDING} element={
                                <PublicOnlyRoute>
                                    <PageTransition><LandingPage /></PageTransition>
                                </PublicOnlyRoute>
                            } />
                            <Route path={ROUTES.AUTH} element={
                                <PublicOnlyRoute>
                                    <PageTransition><Auth /></PageTransition>
                                </PublicOnlyRoute>
                            } />

                            {/* Rutas públicas sin guard */}
                            <Route path={ROUTES.RECOVER_PASSWORD} element={<PageTransition><RecoverPasswordPage /></PageTransition>} />
                            <Route path={ROUTES.RESET_PASSWORD} element={<PageTransition><RecoverPasswordPage /></PageTransition>} />
                            <Route path={ROUTES.QR_SCANNER} element={<PageTransition><JoinGroup /></PageTransition>} />

                            {/* Rutas protegidas */}
                            <Route element={<ProtectedRoute />}>
                                <Route element={<DashboardLayout />}>
                                    <Route path={ROUTES.DASHBOARD} element={<PageTransition><Dashboard /></PageTransition>} />
                                    <Route path={ROUTES.GROUPS} element={<PageTransition><GroupsPage /></PageTransition>} />
                                    <Route path={ROUTES.CREATE_GROUP} element={<PageTransition><CreateGroup /></PageTransition>} />
                                    <Route path="/grupo/:id" element={<PageTransition><GroupDetail /></PageTransition>} />
                                    <Route path="/grupo/:groupId/registrar-gasto" element={<PageTransition><RegisterExpense /></PageTransition>} />
                                    <Route path="/grupo/:groupId/editar-item/:itemId" element={<PageTransition><RegisterExpense /></PageTransition>} />
                                    <Route path="/grupo/:id/liquidar" element={<PageTransition><SettleUp /></PageTransition>} />

                                    <Route path={ROUTES.STATS} element={<PageTransition><StatsPage /></PageTransition>} />
                                    <Route path={ROUTES.PROFILE} element={<PageTransition><ProfilePage /></PageTransition>} />
                                    <Route path={ROUTES.CHANGE_PASSWORD} element={<PageTransition><RecoverPasswordPage /></PageTransition>} />
                                    <Route path={ROUTES.PERSONAL_DATA} element={<PageTransition><PersonalData /></PageTransition>} />
                                    <Route path={ROUTES.OCR_SCANNER} element={<PageTransition><OCRScanner /></PageTransition>} />
                                    <Route path={ROUTES.TWO_FACTOR_SETUP} element={<PageTransition><TwoFactorSetup /></PageTransition>} />
                                    <Route path={ROUTES.ADMIN} element={<PageTransition><AdminDashboard /></PageTransition>} />
                                </Route>
                                {/* Verificación fuera del Layout para que no muestre el panel principal tras registro */}
                                <Route path={ROUTES.TWO_FACTOR_VERIFY} element={<PageTransition><TwoFactorVerify /></PageTransition>} />
                            </Route>

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                        </Routes>
                    </Suspense>
                )}
            </AnimatePresence>
        </RouteErrorBoundary>
    );
};
