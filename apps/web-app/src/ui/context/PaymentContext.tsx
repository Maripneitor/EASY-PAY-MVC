import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { httpClient } from '../../infrastructure/api/http-client';
import { useAuthContext } from './AuthContext';

interface Transaction {
    id: string;
    type: string;
    group_name: string;
    description: string;
    amount: number;
    date: string;
    status: string;
    is_incoming: boolean;
    icon?: string;
    category?: string;
}

interface PaymentContextType {
    transactions: Transaction[];
    isLoading: boolean;
    refreshTransactions: (notify?: boolean) => Promise<void>;
}

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const PaymentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthContext();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshTransactions = useCallback(async (notify: boolean = false) => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const res = await httpClient.get(`/stats/user/${user.id}/transactions`);
            setTransactions(res.data);
            
            if (notify) {
                const channel = new BroadcastChannel('easy_pay_payments');
                channel.postMessage('refresh_needed');
                channel.close();
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // Sync across tabs using BroadcastChannel
    useEffect(() => {
        const channel = new BroadcastChannel('easy_pay_payments');
        channel.onmessage = (event) => {
            if (event.data === 'refresh_needed') {
                refreshTransactions();
            }
        };
        return () => channel.close();
    }, [refreshTransactions]);


    useEffect(() => {
        if (user?.id) {
            refreshTransactions();
        }
    }, [user?.id, refreshTransactions]);

    return (
        <PaymentContext.Provider value={{ transactions, isLoading, refreshTransactions }}>
            {children}
        </PaymentContext.Provider>
    );
};

