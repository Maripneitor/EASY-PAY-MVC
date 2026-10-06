import React from 'react';
import { User } from 'lucide-react';
import styles from './Navbar.module.css';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../../infrastructure/routes';

export const Navbar = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthContext();

    const handleProfile = () => {
        navigate(ROUTES.PROFILE);
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.logoContainer} onClick={() => navigate(ROUTES.LANDING)}>
                <img 
                    src="/assets/images/logo-ep.png"
                    alt="Easy-Pay Logo"
                    aria-label="Logotipo de Easy-Pay"
                    className={styles.logoImage}
                />
                <span className={styles.logoText} aria-hidden="true">Easy-Pay</span>
            </div>

            <div className={styles.navLinks}>
                <a href="#pain-points" className={styles.navLink}>El Problema</a>
                <a href="#how-it-works" className={styles.navLink}>Cómo funciona</a>
                <a href="#testimonials" className={styles.navLink}>Testimonios</a>
                <a href="#comparison" className={styles.navLink}>Comparativa</a>
            </div>

            <div className={styles.actions}>
                {!isAuthenticated ? (
                    <button
                        className={styles.loginBtn}
                        onClick={() => navigate(ROUTES.AUTH)}
                        aria-label="Ir a la página de inicio de sesión"
                    >
                        Entrar
                    </button>
                ) : (
                    <button
                        className={styles.profileBtn}
                        onClick={handleProfile}
                        title="Mi Perfil"
                        aria-label="Ir a mi perfil de usuario"
                    >
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className={styles.avatarMini} />
                        ) : (
                            <User size={18} />
                        )}
                        <span className={styles.userNameMini}>{user?.name.split(' ')[0]}</span>
                    </button>
                )}
            </div>
        </nav>
    );
};
