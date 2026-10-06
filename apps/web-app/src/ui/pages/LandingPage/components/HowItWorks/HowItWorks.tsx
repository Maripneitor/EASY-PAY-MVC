import React from 'react';
import { QrCode, ClipboardList, Calculator, CheckCircle } from 'lucide-react';
import styles from './HowItWorks.module.css';

export const HowItWorks = () => {
    const steps = [
        {
            num: 1,
            title: 'Escanear',
            desc: 'Sube una foto del ticket o introduce el código QR del grupo.',
            visual: (
                <div className={styles.mockup}>
                    <div className={styles.mockupHeader}><div className={styles.mockupNotch} /></div>
                    <div className={styles.mockupBody}>
                        <QrCode size={48} className={styles.visualIcon} />
                        <div className={styles.dashedBox} />
                    </div>
                </div>
            )
        },
        {
            num: 2,
            title: 'Asignar',
            desc: 'Toca tus platos o divídelos entre varios comensales.',
            visual: (
                <div className={styles.mockup}>
                    <div className={styles.mockupHeader}><div className={styles.mockupNotch} /></div>
                    <div className={styles.mockupBodyList}>
                        <div className={styles.skeletonLine} />
                        <div className={styles.skeletonLineShort} />
                        <div className={styles.skeletonLineMedium} />
                        <div className={styles.skeletonLine} />
                    </div>
                </div>
            )
        },
        {
            num: 3,
            title: 'Calcular',
            desc: 'Impuestos y propinas se calculan al instante.',
            visual: (
                <div className={styles.mockup}>
                    <div className={styles.mockupHeader}><div className={styles.mockupNotch} /></div>
                    <div className={styles.mockupBodyCalc}>
                        <span className={styles.calcLabel}>Tu parte</span>
                        <span className={styles.calcValue}>$24.50</span>
                    </div>
                </div>
            )
        },
        {
            num: 4,
            title: 'Pagar',
            desc: 'Paga tu parte con un click desde tu móvil.',
            visual: (
                <div className={styles.mockup}>
                    <div className={styles.mockupHeader}><div className={styles.mockupNotch} /></div>
                    <div className={styles.mockupBodyPay}>
                        <button className={styles.payBtnMock}>PAGAR AHORA</button>
                    </div>
                </div>
            )
        }
    ];

    return (
        <section className={styles.section} id="how-it-works">
            <div className={styles.container}>
                <div className={styles.header}>
                    <span className={styles.overline}>Paso a paso</span>
                    <h2 className={styles.heading}>Cómo funciona</h2>
                </div>

                <div className={styles.grid}>
                    {steps.map((step, i) => (
                        <div key={i} className={styles.step}>
                            <div className={styles.numCircle}>
                                <span>{step.num}</span>
                            </div>
                            <h3 className={styles.stepTitle}>{step.title}</h3>
                            <p className={styles.stepDesc}>{step.desc}</p>
                            {step.visual}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
