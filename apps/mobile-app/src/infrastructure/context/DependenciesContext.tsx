import React, { createContext, useContext, useMemo } from 'react';
import { 
    GroupRepository,
    CreateGroupUseCase,
    JoinGroupUseCase,
    CloseGroupUseCase,
    GetGroupUseCase,
    CalculateSharesUseCase,
    AddItemUseCase,
    AssignItemUseCase,
    GetGroupUpdateUseCase
} from '@easy-pay/domain';
import { groupRepository as mobileGroupRepository } from '../api/repositories/GroupRepository';
// TOGGLE MOCKS: Set to false to use real Repositories
const USE_MOCKS = false;


interface Dependencies {
    repositories: {
        group: GroupRepository;
    };
    useCases: {
        createGroup: CreateGroupUseCase;
        joinGroup: JoinGroupUseCase;
        closeGroup: CloseGroupUseCase;
        getGroup: GetGroupUseCase;
        calculateShares: CalculateSharesUseCase;
        addItem: AddItemUseCase;
        assignItem: AssignItemUseCase;
        getGroupUpdate: GetGroupUpdateUseCase;
    };
}

const DependenciesContext = createContext<Dependencies | null>(null);

export const DependenciesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const dependencies = useMemo(() => {
        const groupRepo = mobileGroupRepository;

        return {
            repositories: {
                group: groupRepo,
            },
            useCases: {
                createGroup: new CreateGroupUseCase(groupRepo),
                joinGroup: new JoinGroupUseCase(groupRepo),
                closeGroup: new CloseGroupUseCase(groupRepo),
                getGroup: new GetGroupUseCase(groupRepo),
                calculateShares: new CalculateSharesUseCase(), // Repository-less use case
                addItem: new AddItemUseCase(groupRepo),
                assignItem: new AssignItemUseCase(groupRepo),
                getGroupUpdate: new GetGroupUpdateUseCase(groupRepo),
            }
        };
    }, []);

    return (
        <DependenciesContext.Provider value={dependencies}>
            {children}
        </DependenciesContext.Provider>
    );
};

export const useDependencies = () => {
    const context = useContext(DependenciesContext);
    if (!context) {
        throw new Error('useDependencies must be used within a DependenciesProvider');
    }
    return context;
};
