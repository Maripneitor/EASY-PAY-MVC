import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { groupRepository } from '@infrastructure/api/repositories';
import { useAuthContext } from './AuthContext';

const normalizeId = (id: any) => {
    if (!id) return "";
    if (typeof id === 'string') return id;
    return id.$oid || id.id || id._id || id.toString();
};

interface GroupContextType {
    groups: any[];
    activeGroups: any[];
    settledGroups: any[];
    isLoading: boolean;
    refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isLoading: authLoading } = useAuthContext();
    const [groups, setGroups] = useState<any[]>([]);
    const [activeGroups, setActiveGroups] = useState<any[]>([]);
    const [settledGroups, setSettledGroups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshGroups = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const data = await groupRepository.findByUser(user.id);
            if (Array.isArray(data)) {
                const groupsWithBalances = await Promise.all(data.map(async (group: any) => {
                    try {
                        const bData = await groupRepository.getBalances(group.id);
                        const bList = bData.balance_detallado || bData.balances || [];
                        const myInfo = bList.find((b: any) => normalizeId(b.usuario_id) === normalizeId(user.id));

                        return {
                            ...group,
                            id: normalizeId(group.id || group._id),
                            admin_id: normalizeId(group.admin_id || group.administrador_id),
                            total_gastado: bData.total_gastado_en_grupo || 0,
                            mi_balance: myInfo?.balance || 0,
                            integrantes: (group.integrantes || []).map((i: any) => ({
                                ...i,
                                id: normalizeId(i.id || i._id)
                            }))
                        };
                    } catch (e) {
                        return { ...group, total_gastado: 0, mi_balance: 0 };
                    }
                }));
                setGroups(groupsWithBalances);
                setActiveGroups(groupsWithBalances.filter((g: any) => !g.is_settled));
                setSettledGroups(groupsWithBalances.filter((g: any) => g.is_settled));
            }
        } catch (error) {
            console.error("Error fetching groups in Context:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!authLoading && user?.id) {
            refreshGroups();
        }
    }, [authLoading, user?.id, refreshGroups]);

    return (
        <GroupContext.Provider value={{ groups, activeGroups, settledGroups, isLoading, refreshGroups }}>
            {children}
        </GroupContext.Provider>
    );
};

export const useGroupContext = () => {
    const context = useContext(GroupContext);
    if (!context) {
        throw new Error('useGroupContext must be used within a GroupProvider');
    }
    return context;
};
