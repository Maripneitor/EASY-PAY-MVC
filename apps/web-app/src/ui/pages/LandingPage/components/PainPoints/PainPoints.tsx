import React from 'react';
import { Calculator, MessageSquare, CreditCard, Hourglass } from 'lucide-react';
import styles from './PainPoints.module.css';

export const PainPoints = () => {
    const points = [
        {
            icon: <Calculator size={32} />,
            title: 'Calculadora infernal',
            desc: '¿Quién pidió qué? ¿Cuánto es el 15% de propina? Deja de hacer sumas en servilletas.'
        },
        {
            icon: <MessageSquare size={32} />,
            title: 'Discusiones incómodas',
            desc: '"Yo solo comí una ensalada". Evita el drama de pagar por lo que no consumiste.'
        },
        {
            icon: <CreditCard size={32} />,
            title: 'Problemas de Propina',
            desc: 'Calcula la propina justa automáticamente, sin regatear ni quedar mal.'
        },
        {
            icon: <Hourglass size={32} />,
            title: 'Tiempo perdido',
            desc: 'Pagar debería tomar segundos, no 20 minutos esperando el datáfono.'
        }
    ];

    return (
        <section className={styles.section} id="pain-points">
            <div className={styles.glow} />
            <div className={styles.container}>
                <h2 className={styles.heading}>
                    El dolor de cabeza de la cuenta <br />
                    <span className={styles.subHeading}>ya es historia</span>
                </h2>

                <div className={styles.grid}>
                    {points.map((point, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.iconWrapper}>
                                {point.icon}
                            </div>
                            <h3 className={styles.cardTitle}>{point.title}</h3>
                            <p className={styles.cardDesc}>{point.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
