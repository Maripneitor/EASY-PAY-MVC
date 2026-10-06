import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDependencies } from '../context/DependenciesContext';
import { Group, Item } from '@easy-pay/domain';

export const useGroup = (groupId: string) => {
    const { useCases } = useDependencies();
    const queryClient = useQueryClient();

    // Fetch group details
    const { 
        data: group, 
        isLoading, 
        error 
    } = useQuery({
        queryKey: ['group', groupId],
        queryFn: () => useCases.getGroup.execute(groupId),
        enabled: !!groupId,
    });

    // Real-time subscription
    useEffect(() => {
        if (!groupId) return;

        const unsubscribe = useCases.getGroupUpdate.execute(groupId, (updatedGroup: Group) => {
            queryClient.setQueryData(['group', groupId], updatedGroup);
        });

        return () => unsubscribe();
    }, [groupId, queryClient, useCases]);

    // Derive shares using the use case
    const shares = group ? useCases.calculateShares.execute(group) : null;

    // Mutation to add an item
    const addItemMutation = useMutation({
        mutationFn: (itemData: { description: string; amount: number; addedBy: string }) => 
            useCases.addItem.execute(groupId, { description: itemData.description, amount: itemData.amount } as any, itemData.addedBy),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        },
    });

    // Mutation to assign an item to members
    const assignItemMutation = useMutation({
        mutationFn: ({ itemId, memberIds }: { itemId: string; memberIds: string[] }) => 
            useCases.assignItem.execute(groupId, itemId, memberIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        },
    });

    // Mutation to close group
    const closeGroupMutation = useMutation({
        mutationFn: () => useCases.closeGroup.execute(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['group', groupId] });
        },
    });

    return {
        group,
        shares,
        isLoading,
        error: error instanceof Error ? error.message : null,
        addItem: addItemMutation.mutateAsync,
        assignItem: assignItemMutation.mutateAsync,
        closeGroup: closeGroupMutation.mutateAsync,
        isAddingItem: addItemMutation.isPending,
        isAssigningItem: assignItemMutation.isPending,
        isClosingGroup: closeGroupMutation.isPending,
    };
};
