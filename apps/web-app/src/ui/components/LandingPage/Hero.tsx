import React from 'react';
import { PlusCircle, Users, Store, QrCode } from 'lucide-react';
import styles from './Hero.module.css';
import { cn } from '../../../infrastructure/utils';

export const Hero = () => {
    return (
        <main className={styles.hero}>
            <div className="absolute inset-0 grid-pattern pointer-events-none opacity-30"></div>
            <div className="absolute inset-0 dots-pattern pointer-events-none opacity-20"></div>

            <div className={styles.container}>
                <div className={styles.textContent}>
                    <h1 className={styles.title}>
                        La cuenta, <br />
                        dividida en <br />
                        <span className={styles.highlight}>segundos</span>.
                    </h1>
                    <p className={styles.description}>
                        Cero estrés. Escanea, asigna y paga tu parte. Olvídate de las calculadoras y disfruta de la sobremesa.
                    </p>

                    <div className={styles.ctaGrid}>
                        <div className={styles.ctaCard}>
                            <div className={styles.cardHeader}>
                                <PlusCircle className={styles.cardIcon} size={32} />
                                <h3 className={styles.cardTitle}>Nuevo Grupo</h3>
                            </div>
                            <p className={styles.cardDescription}>
                                Eres el anfitrión. Crea un código.
                            </p>
                            <button className={styles.primaryBtn} onClick={() => console.log('Crear Grupo')}>
                                Crear Grupo
                            </button>
                        </div>

                        <div className={styles.ctaCard}>
                            <div className={styles.cardHeader}>
                                <Users className={styles.cardIconSecondary} size={32} />
                                <h3 className={styles.cardTitle}>Unirme</h3>
                            </div>
                            <p className={styles.cardDescription}>
                                ¿Tienes código? Únete ya.
                            </p>
                            <button className={styles.secondaryBtn} onClick={() => console.log('Unirme')}>
                                Unirme
                            </button>
                        </div>
                    </div>

                    <div className={styles.hint}>
                        <span className={styles.hintEmoji}>💡</span>
                        <p className={styles.hintText}>
                            El anfitrión crea el grupo y comparte el código.
                        </p>
                    </div>
                </div>

                <div className={styles.visualContent}>
                    <div className={styles.glow} />
                    <div className={styles.receiptContainer}>
                        <div className={styles.receipt}>
                            <div className={styles.scanBeam} />
                            <div className={styles.scanLine} />

                            <div className={styles.receiptHeader}>
                                <div className={styles.storeIcon}>
                                    <Store size={20} className="text-gray-400" />
                                </div>
                                <div className={styles.headerLine1} />
                                <div className={styles.headerLine2} />
                            </div>

                            <div className={styles.receiptItems}>
                                <div className={styles.itemHeader}>
                                    <span>Item</span>
                                    <span>Precio</span>
                                </div>

                                <div className={styles.itemsList}>
                                    <div className={styles.itemRow}>
                                        <span>Hamburguesa</span>
                                        <span>$15.00</span>
                                    </div>
                                    <div className={styles.itemRow}>
                                        <span>Cervezas x3</span>
                                        <span>$18.00</span>
                                    </div>
                                    <div className={styles.itemRow}>
                                        <span>Nachos</span>
                                        <span>$12.00</span>
                                    </div>
                                </div>

                                <div className={styles.floatingItems}>
                                    <div className={cn(styles.floatingItem, "animate-item-left")}>
                                        <span>Hamburguesa</span>
                                        <span>$15.00</span>
                                    </div>
                                    <div className={cn(styles.floatingItem, "animate-item-center")} style={{ animationDelay: '0.5s' }}>
                                        <span>Cervezas x3</span>
                                        <span>$18.00</span>
                                    </div>
                                    <div className={cn(styles.floatingItem, "animate-item-right")} style={{ animationDelay: '1s' }}>
                                        <span>Nachos</span>
                                        <span>$12.00</span>
                                    </div>
                                </div>

                                <div className={styles.divider} />
                                <div className={styles.totalRow}>
                                    <span>TOTAL</span>
                                    <span>$45.00</span>
                                </div>
                                <div className={styles.qrIconContainer}>
                                    <QrCode size={32} className="text-gray-200" />
                                </div>
                            </div>
                        </div>

                        {/* User Cards */}
                        <div className={styles.userCards}>
                            <div className={cn(styles.userCard, styles.userCard1)}>
                                <div className={styles.userCardInner}>
                                    <div className={styles.notch} />
                                    <div className={cn(styles.avatar, styles.avatar1)}>AM</div>
                                    <p className={styles.userLabel}>Total</p>
                                    <p className={styles.userValue}>$15.00</p>
                                </div>
                            </div>
                            <div className={cn(styles.userCard, styles.userCard2)}>
                                <div className={styles.userCardInner}>
                                    <div className={styles.notch} />
                                    <div className={cn(styles.avatar, styles.avatar2)}>JD</div>
                                    <p className={styles.userLabel}>Total</p>
                                    <p className={styles.userValue}>$18.00</p>
                                </div>
                            </div>
                            <div className={cn(styles.userCard, styles.userCard3)}>
                                <div className={styles.userCardInner}>
                                    <div className={styles.notch} />
                                    <div className={cn(styles.avatar, styles.avatar3)}>ME</div>
                                    <p className={styles.userLabel}>Total</p>
                                    <p className={styles.userValue}>$12.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.scrollDown}>
                <div className="bounce-subtle">
                    <span className="material-icons text-3xl text-alice-blue">expand_more</span>
                </div>
            </div>
        </main>
    );
};
