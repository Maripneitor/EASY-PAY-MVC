import { usePayment } from '../../context/usePayment';
import { useAuthContext } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { statsRepository } from '../../../infrastructure/api/repositories';

export const useProfileStats = () => {
    const { user } = useAuthContext();
    const userId = user?.id || null;
    const { transactions, isLoading: transactionsLoading, refreshTransactions } = usePayment();

    // Still use useQuery for complex charts and stats that might not be in the simple transaction list
    const statsQuery = useQuery({
        queryKey: ['user-stats', userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID not found");
            return await statsRepository.getUserStats(userId);
        },
        enabled: !!userId,
    });

    const chartsQuery = useQuery({
        queryKey: ['user-charts', userId],
        queryFn: async () => {
            if (!userId) throw new Error("User ID not found");
            return await statsRepository.getUserCharts(userId);
        },
        enabled: !!userId,
    });

    const refresh = () => {
        refreshTransactions();
        statsQuery.refetch();
        chartsQuery.refetch();
    };

    const combinedData = {
        ...(statsQuery.data || {}),
        ...(chartsQuery.data || {}),
        transactions: transactions,
        by_category: chartsQuery.data?.by_category || statsQuery.data?.expenses_by_category || [],
        categories: chartsQuery.data?.by_category || statsQuery.data?.expenses_by_category || [],
        income_vs_expenses: chartsQuery.data?.income_vs_expenses || []
    };

    return { 
        stats: combinedData, 
        loading: transactionsLoading || statsQuery.isLoading || chartsQuery.isLoading,
        refresh 
    };
};
