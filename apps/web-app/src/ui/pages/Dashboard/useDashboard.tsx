import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupRepository, statsRepository, paymentRepository, userRepository } from '@infrastructure/api/repositories';
import { useAuthContext } from '@ui/context/AuthContext';
import { useGroupContext } from '@ui/context/GroupContext';
import { ROUTES } from '@infrastructure/routes';
import { toast } from 'sonner';

/**
 * Normaliza diferentes formatos de ID provenientes de la API (MongoDB $oid, string, etc)
 */
const normalizeId = (id: any): string => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    return id.$oid || id.id || id._id || id.toString();
};

const MAX_DELETED_HISTORY = 15;

export const useDashboard = () => {
    const { activeGroups: allActiveGroups, settledGroups, isLoading: groupsLoading, refreshGroups } = useGroupContext();
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasCards, setHasCards] = useState(true);
    const { user, isLoading: authLoading } = useAuthContext();
    const userId = user?.id;
    const navigate = useNavigate();

    const fetchUserCards = useCallback(async (id: string) => {
        try {
            const cards = await paymentRepository.getCards(id);
            setHasCards(cards && cards.length > 0);
        } catch (e) {
            console.error("Error fetching cards:", e);
        }
    }, []);

    const fetchUserStats = useCallback(async (id: string) => {
        try {
            const userStats = await statsRepository.getUserStats(id);
            setStats(userStats);
        } catch (e) {
            console.error("Error fetching stats:", e);
        }
    }, []);

    const [transactions, setTransactions] = useState<any[]>([]);

    const fetchUserTransactions = useCallback(async (id: string) => {
        try {
            const txs = await statsRepository.getUserTransactions(id);
            setTransactions(txs || []);
        } catch (e) {
            console.error("Error fetching transactions:", e);
        }
    }, []);

    const fetchDashboardData = useCallback(async () => {
        if (authLoading) return;
        if (!userId) {
            setIsLoading(false);
            navigate(ROUTES.AUTH);
            return;
        }

        try {
            await Promise.allSettled([
                fetchUserCards(userId),
                fetchUserStats(userId),
                fetchUserTransactions(userId)
            ]);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId, navigate, authLoading, fetchUserCards, fetchUserStats, fetchUserTransactions]);

    useEffect(() => {
        fetchDashboardData();
        window.addEventListener('focus', fetchDashboardData);
        return () => window.removeEventListener('focus', fetchDashboardData);
    }, [fetchDashboardData]);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

    const deleteGroup = async (groupId: string) => {
        if (!userId) return;
        const toastId = toast.loading("Preparando verificación de seguridad...");
        try {
            await userRepository.setupTwoFactor(userId);
            setGroupToDelete(groupId);
            setIs2FAModalOpen(true);
            toast.success("Código de verificación enviado", { id: toastId });
        } catch (error: any) {
            toast.error(error.message || "Error al preparar la seguridad", { id: toastId });
        }
    };

    const confirmDeleteGroup = async () => {
        if (!groupToDelete) return;
        try {
            const groupInfo = allActiveGroups.find(g => g.id === groupToDelete) || settledGroups.find(g => g.id === groupToDelete);
            await groupRepository.deleteGroup(groupToDelete);
            
            if (groupInfo) {
                const stored = localStorage.getItem('recently_deleted_groups');
                const deletedHistory = stored ? JSON.parse(stored) : [];
                const newHistory = [
                    { ...groupInfo, deletedAt: new Date().toISOString() },
                    ...deletedHistory
                ].slice(0, MAX_DELETED_HISTORY);
                localStorage.setItem('recently_deleted_groups', JSON.stringify(newHistory));
            }

            setIs2FAModalOpen(false);
            // We need to refresh instead of local filtering to keep stats in sync
            refreshGroups();
            fetchDashboardData();
            
            setGroupToDelete(null);
            toast.success('Grupo eliminado correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar el grupo');
        }
    };

    return {
        allActiveGroups,
        settledGroups,
        stats,
        transactions,
        isLoading,
        hasCards,
        navigate,
        refresh: fetchDashboardData,
        deleteGroup,
        confirmDeleteGroup,
        is2FAModalOpen,
        setIs2FAModalOpen,
        userId
    };
};