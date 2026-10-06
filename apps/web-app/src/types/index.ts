export interface Member {
    id?: string;
    name: string;
    avatar?: string;
}

export interface Group {
    id: string;
    name: string;
    icon?: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
    isAdmin?: boolean;
    lastAct?: string;
    members: (Member | string)[]; // Allowing string for backward compatibility with current mock data URLs
    extraMembers?: number;
    total: number;
    userBalance?: number;
    date?: string; // For settled groups
}

export interface Payment {
    id: string;
    amount: number;
    description: string;
    date: string;
    payer: Member;
}
