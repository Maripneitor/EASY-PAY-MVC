import React from 'react';
import { Check, X } from 'lucide-react';
import styles from './Comparison.module.css';
import { cn } from '../../../../../infrastructure/utils';

export const Comparison = () => {
    const features = [
        { name: 'Tiempo de cobro', traditional: '15-25 minutos', easypay: '< 2 minutos', highlight: true },
        { name: 'Precisión en la división', traditional: false, easypay: true },
        { name: 'Pago contactless', traditional: false, easypay: true },
        { name: 'Historial de gastos', traditional: false, easypay: true }
    ];

    return (
        <section id="comparison" className={styles.section}>
            <div className={styles.container}>
                <h2 className={styles.title}>¿Por qué elegir Easy-Pay?</h2>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headerRow}>
                                <th className={styles.featureHeader}>Características</th>
                                <th className={styles.columnHeader}>Método Tradicional</th>
                                <th className={cn(styles.columnHeader, styles.highlightColumn)}>Easy-Pay</th>
                            </tr>
                        </thead>
                        <tbody>
                            {features.map((f, i) => (
                                <tr key={i} className={styles.row}>
                                    <td className={styles.featureName}>{f.name}</td>
                                    <td className={styles.cell}>
                                        {typeof f.traditional === 'string' ? (
                                            f.traditional
                                        ) : f.traditional ? (
                                            <CheckBadge success />
                                        ) : (
                                            <CheckBadge fail />
                                        )}
                                    </td>
                                    <td className={cn(styles.cell, styles.highlightCell)}>
                                        {f.highlight ? (
                                            <span className={styles.greenText}>{f.easypay}</span>
                                        ) : f.easypay ? (
                                            <CheckBadge success glow />
                                        ) : (
                                            <CheckBadge fail />
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

const CheckBadge = ({ success, fail, glow }: { success?: boolean; fail?: boolean; glow?: boolean }) => (
    <div className={styles.badgeWrapper}>
        <div className={cn(
            styles.badge,
            success && styles.successBadge,
            fail && styles.failBadge,
            glow && styles.glowBadge
        )}>
            {success && <Check size={20} />}
            {fail && <X size={20} />}
        </div>
    </div>
);
