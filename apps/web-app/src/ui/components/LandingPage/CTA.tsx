import React from 'react';
import styles from './CTA.module.css';

export const CTA = () => {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.topBar} />
                    <h2 className={styles.title}>¡Empieza a dividir sin dramas!</h2>
                    <p className={styles.desc}>Únete a miles de comensales felices que ya no sufren con la cuenta.</p>
                    <button className={styles.button} onClick={() => console.log('CTA Click')}>
                        Crear mi cuenta gratis
                    </button>
                </div>
            </div>
        </section>
    );
};
