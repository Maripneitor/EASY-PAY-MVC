import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { PaymentProvider } from './context/PaymentContext';
import { GroupProvider } from './context/GroupContext';
import { AnimatedRoutes } from './routes/AnimatedRoutes';
import './global.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60, // Reduced to 1 minute for fresher data
            retry: 2,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
        },
    },
});

export const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <PaymentProvider>
                    <GroupProvider>
                        <ThemeProvider>
                            <BrowserRouter>
                                <AnimatedRoutes />
                            </BrowserRouter>
                        <Toaster 
                        position="top-right" 
                        richColors 
                        closeButton 
                        duration={7000}
                        expand={false}
                        toastOptions={{
                            style: {
                                background: 'rgba(255, 255, 255, 0.9)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '24px',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                padding: '16px 24px',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: '#1e293b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            },
                        }}
                    />
                </ThemeProvider>
                    </GroupProvider>
                </PaymentProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};