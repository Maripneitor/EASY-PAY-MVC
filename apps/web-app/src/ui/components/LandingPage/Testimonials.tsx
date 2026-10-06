import React from 'react';
import { Star } from 'lucide-react';
import styles from './Testimonials.module.css';

export const Testimonials = () => {
    const reviews = [
        {
            name: 'Carlos M.',
            avatar: '/assets/images/avatar-2.png',
            text: '"Increíblemente fácil de usar. Ya no hay discusiones incómodas al final de la cena."',
            stars: 5
        },
        {
            name: 'Sofia R.',
            avatar: '/assets/images/avatar-3.png',
            text: '"La mejor app para salir con amigos. Calculamos la propina justa en segundos."',
            stars: 5
        },
        {
            name: 'Javier L.',
            avatar: '/assets/images/avatar-4.png',
            text: '"Me encanta que puedo pagar solo por lo que consumí. ¡Adiós a dividir en partes iguales!"',
            stars: 5
        }
    ];

    return (
        <section id="testimonials" className={styles.section}>
            <div className={styles.glow} />
            <div className={styles.container}>
                <h2 className={styles.title}>Lo que dicen nuestros usuarios</h2>

                <div className={styles.grid}>
                    {reviews.map((review, index) => (
                        <div key={index} className={styles.card}>
                            <div className={styles.avatarWrapper}>
                                <img src={review.avatar} alt={review.name} className={styles.avatar} onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + review.name;
                                }} />
                            </div>

                            <div className={styles.stars}>
                                {[...Array(review.stars)].map((_, i) => (
                                    <Star key={i} size={14} fill="#facc15" className="text-yellow-400" />
                                ))}
                            </div>

                            <p className={styles.reviewText}>{review.text}</p>
                            <h4 className={styles.userName}>{review.name}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
