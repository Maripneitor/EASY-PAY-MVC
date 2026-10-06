import { useState, useEffect, useCallback } from 'react';
import { statsRepository, UserStats } from '../api/repositories/StatsRepository';

export const useProfileStats = (userId: string | undefined) => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const data = await statsRepository.getUserStats(userId);
            setStats(data);
            setError(null);
        } catch (err) {
            setError('No se pudieron cargar los datos del historial');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refreshStats: fetchStats };
};
