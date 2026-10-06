import React from 'react';
import styles from './CTA.module.css';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../../infrastructure/routes';

export const CTA = () => {
    const navigate = useNavigate();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.topBar} />
                    <h2 className={styles.heading}>¡Empieza a dividir sin dramas!</h2>
                    <p className={styles.text}>Únete a miles de comensales felices que ya no sufren con la cuenta.</p>
                    <button
                        className={styles.button}
                        onClick={() => navigate(ROUTES.AUTH)}
                    >
                        Crear mi cuenta gratis
                    </button>
                </div>
            </div>
        </section>
    );
};
