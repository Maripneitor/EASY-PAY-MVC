import React from 'react';
import { Star } from 'lucide-react';
import styles from './Testimonials.module.css';

export const Testimonials = () => {
    const reviews = [
        {
            avatar: '/assets/images/member-2.png',
            name: 'Carlos M.',
            text: '"Increíblemente fácil de usar. Ya no hay discusiones incómodas al final de la cena."'
        },
        {
            avatar: '/assets/images/profile-2.png',
            name: 'Sofia R.',
            text: '"La mejor app para salir con amigos. Calculamos la propina justa en segundos."'
        },
        {
            avatar: '/assets/images/member-3.png',
            name: 'Javier L.',
            text: '"Me encanta que puedo pagar solo por lo que consumí. ¡Adiós a dividir en partes iguales!"'
        }
    ];

    return (
        <section className={styles.section} id="testimonials">
            <div className={styles.container}>
                <h2 className={styles.heading}>Lo que dicen nuestros usuarios</h2>

                <div className={styles.grid}>
                    {reviews.map((rev, i) => (
                        <div key={i} className={styles.card}>
                            <div className={styles.avatarWrapper}>
                                <img src={rev.avatar} alt={rev.name} className={styles.avatar} />
                            </div>
                            <div className={styles.stars}>
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} size={14} fill="currentColor" className={styles.starIcon} />
                                ))}
                            </div>
                            <p className={styles.text}>{rev.text}</p>
                            <h4 className={styles.author}>{rev.name}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
