import React from 'react';
import { Navbar } from '@ui/components/Navbar';
import { Hero } from './components/Hero';
import { PainPoints } from './components/PainPoints';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { Comparison } from './components/Comparison';
import { FAQ } from './components/FAQ';
import { CTA } from './components/CTA';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Footer } from './components/Footer';
import styles from './LandingPage.module.css';

export const LandingPage = () => {
    useDocumentTitle('Inicio');
    return (
        <div className={styles.landingPage}>
            <Navbar />
            <main>
                <Hero />
                <PainPoints />
                <HowItWorks />
                <Testimonials />
                <Comparison />
                <FAQ />
                <CTA />
            </main>
            <Footer />
        </div>
    );
};
