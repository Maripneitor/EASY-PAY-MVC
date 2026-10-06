import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

export const FAQ = () => {
    const faqs = [
        {
            q: '¿Es seguro pagar con Easy-Pay?',
            a: 'Absolutamente. Utilizamos encriptación de grado bancario para proteger todos tus datos y transacciones. Tu seguridad es nuestra prioridad.'
        },
        {
            q: '¿Necesito descargar una app?',
            a: 'No necesariamente. Puedes usar nuestra versión web directamente desde tu navegador escaneando el código QR. Sin embargo, la app ofrece funciones adicionales.'
        },
        {
            q: '¿Puedo dividir la cuenta de forma desigual?',
            a: '¡Sí! Puedes asignar items específicos a cada persona o dividir el costo de platos compartidos como prefieras.'
        },
        {
            q: '¿Tiene algún costo extra?',
            a: 'Para los usuarios es completamente gratuito. Cobramos una pequeña comisión a los restaurantes asociados.'
        }
    ];

    return (
        <section id="faq" className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>Preguntas Frecuentes</h2>
                <div className={styles.list}>
                    {faqs.map((faq, i) => (
                        <details key={i} className={styles.item}>
                            <summary className={styles.summary}>
                                <span className={styles.question}>{faq.q}</span>
                                <ChevronDown className={styles.icon} />
                            </summary>
                            <div className={styles.answer}>
                                <p>{faq.a}</p>
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
};
