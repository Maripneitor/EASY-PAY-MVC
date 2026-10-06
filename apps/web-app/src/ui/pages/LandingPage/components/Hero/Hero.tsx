import React from 'react';
import { PlusCircle, Users, Store, DollarSign, QrCode } from 'lucide-react';
import styles from './Hero.module.css';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../../infrastructure/routes';
import { cn } from '../../../../../infrastructure/utils';

export const Hero = () => {
    const navigate = useNavigate();

    return (
        <section className={styles.hero}>
            <div className={styles.gridPattern} />
            <div className={styles.dotsPattern} />

            <div className={styles.decorativeIcons}>
                <div className={styles.floatIcon1}>
                    <div className={styles.glassIcon}>
                        <DollarSign size={48} className={styles.iconColor} />
                    </div>
                </div>
                <div className={styles.floatIcon2}>
                    <div className={styles.glassIcon}>
                        <Store size={36} className={styles.iconColor} />
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                <div className={styles.content}>
                    <h1 className={styles.title}>
                        La cuenta, <br />
                        dividida en <br />
                        <span className={styles.highlight}>segundos</span>.
                    </h1>
                    <p className={styles.subtitle}>
                        Cero estrés. Escanea, asigna y paga tu parte. Olvídate de las calculadoras y disfruta de la sobremesa.
                    </p>

                    <div className={styles.actions}>
                        <button 
                            className={styles.mainCtaBtn}
                            onClick={() => navigate(ROUTES.AUTH)}
                        >
                            <QrCode size={20} />
                            <span>Comenzar ahora</span>
                        </button>
                    </div>

                    <div className={styles.hint}>
                        <span className={styles.hintEmoji}>🔒</span>
                        <p>Inicia sesión o regístrate para gestionar tus grupos y pagos.</p>
                    </div>
                </div>

                <div className={styles.visuals}>
                    <div className={styles.glow} />
                    <div className={styles.receiptContainer}>
                        <div className={styles.receipt}>
                            <div className={styles.scanBeam} />
                            <div className={styles.scanBeamBlur} />

                            <div className={styles.receiptHeader}>
                                <div className={styles.storeIconWrapper}>
                                    <Store size={20} className={styles.storeIcon} />
                                </div>
                                <div className={styles.skeletonLine1} />
                                <div className={styles.skeletonLine2} />
                            </div>

                            <div className={styles.receiptContent}>
                                <div className={styles.receiptTableHead}>
                                    <span>Item</span>
                                    <span>Precio</span>
                                </div>

                                <div className={styles.receiptItems}>
                                    <div className={styles.receiptRow}>
                                        <span>Hamburguesa</span>
                                        <span>$15.00</span>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>Cervezas x3</span>
                                        <span>$18.00</span>
                                    </div>
                                    <div className={styles.receiptRow}>
                                        <span>Nachos</span>
                                        <span>$12.00</span>
                                    </div>
                                </div>

                                <div className={styles.animatedItems}>
                                    <div className={styles.animItemLeft}>
                                        <span>Hamburguesa</span>
                                        <span>$15.00</span>
                                    </div>
                                    <div className={styles.animItemCenter}>
                                        <span>Cervezas x3</span>
                                        <span>$18.00</span>
                                    </div>
                                    <div className={styles.animItemRight}>
                                        <span>Nachos</span>
                                        <span>$12.00</span>
                                    </div>
                                </div>

                                <div className={styles.receiptDivider} />
                                <div className={styles.receiptTotal}>
                                    <span>TOTAL</span>
                                    <span>$45.00</span>
                                </div>
                                <div className={styles.qrIconWrapper}>
                                    <QrCode size={32} className={styles.qrIcon} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.mobileAvatars}>
                            <div className={styles.avatarCard1}>
                                <div className={styles.phoneFrame}>
                                    <div className={cn(styles.avatarCircle, styles.bgPurple)}>AM</div>
                                    <span className={styles.avatarLabel}>Total</span>
                                    <span className={styles.avatarValue}>$15.00</span>
                                </div>
                            </div>
                            <div className={styles.avatarCard2}>
                                <div className={styles.phoneFrame}>
                                    <div className={cn(styles.avatarCircle, styles.bgBlue)}>JD</div>
                                    <span className={styles.avatarLabel}>Total</span>
                                    <span className={styles.avatarValue}>$18.00</span>
                                </div>
                            </div>
                            <div className={styles.avatarCard3}>
                                <div className={styles.phoneFrame}>
                                    <div className={cn(styles.avatarCircle, styles.bgGreen)}>ME</div>
                                    <span className={styles.avatarLabel}>Total</span>
                                    <span className={styles.avatarValue}>$12.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.scrollHint}>
                <div className={styles.bounce}>
                    <span className={styles.arrowDown}>↓</span>
                </div>
            </div>
        </section>
    );
};
