import React from 'react';
import { ScanQrCode } from 'lucide-react';
import styles from './HowItWorks.module.css';

export const HowItWorks = () => {
    const steps = [
        {
            num: 1,
            title: 'Escanear',
            desc: 'Sube una foto del ticket o introduce el código QR del grupo.',
            mockup: (
                <div className={styles.mockupContainer}>
                    <ScanQrCode size={48} className={styles.mockupIcon} />
                    <div className={styles.mockupDashed} />
                </div>
            )
        },
        {
            num: 2,
            title: 'Asignar',
            desc: 'Toca tus platos o divídelos entre varios comensales.',
            mockup: (
                <div className={styles.mockupDetails}>
                    <div className={styles.line1} />
                    <div className={styles.line2} />
                    <div className={styles.line1} />
                    <div className={styles.line2} />
                </div>
            )
        },
        {
            num: 3,
            title: 'Calcular',
            desc: 'Impuestos y propinas se calculan al instante.',
            mockup: (
                <div className={styles.mockupCalc}>
                    <span className={styles.calcLabel}>Tu parte</span>
                    <span className={styles.calcValue}>$24.50</span>
                </div>
            )
        },
        {
            num: 4,
            title: 'Pagar',
            desc: 'Paga tu parte con un click desde tu móvil.',
            mockup: (
                <div className={styles.mockupPay}>
                    <div className={styles.payButton}>PAGAR AHORA</div>
                </div>
            )
        }
    ];

    return (
        <section id="how-it-works" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.overline}>Paso a paso</span>
                    <h2 className={styles.title}>Cómo funciona</h2>
                </div>

                <div className={styles.grid}>
                    {steps.map((step, index) => (
                        <div key={index} className={styles.step}>
                            <div className={styles.numberBadge}>
                                <span className={styles.number}>{step.num}</span>
                            </div>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDesc}>{step.desc}</p>

                            <div className={styles.mockupScreen}>
                                <div className={styles.mockupHeader}>
                                    <div className={styles.notch} />
                                </div>
                                <div className={styles.mockupBody}>
                                    {step.mockup}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
