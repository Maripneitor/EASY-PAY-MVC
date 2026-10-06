import React from 'react';
import { Calculator, Mic2, Banknote, Hourglass } from 'lucide-react';
import styles from './PainPoints.module.css';

export const PainPoints = () => {
    const points = [
        {
            icon: <Calculator className={styles.icon} size={32} />,
            title: 'Calculadora infernal',
            description: '¿Quién pidió qué? ¿Cuánto es el 15% de propina? Deja de hacer sumas en servilletas.'
        },
        {
            icon: <Mic2 className={styles.icon} size={32} />,
            title: 'Discusiones incómodas',
            description: '"Yo solo comí una ensalada". Evita el drama de pagar por lo que no consumiste.'
        },
        {
            icon: <Banknote className={styles.icon} size={32} />,
            title: 'Problemas de Propina',
            description: 'Calcula la propina justa automáticamente, sin regatear ni quedar mal.'
        },
        {
            icon: <Hourglass className={styles.icon} size={32} />,
            title: 'Tiempo perdido',
            description: 'Pagar debería tomar segundos, no 20 minutos esperando el datáfono.'
        }
    ];

    return (
        <section id="pain-points" className={styles.section}>
            <div className={styles.glow} />
            <div className={styles.container}>
                <h2 className={styles.title}>
                    El dolor de cabeza de la cuenta <br />
                    <span className={styles.subtitle}>ya es historia</span>
                </h2>

                <div className={styles.grid}>
                    {points.map((point, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                {point.icon}
                            </div>
                            <h3 className={styles.cardTitle}>{point.title}</h3>
                            <p className={styles.cardDescription}>{point.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
