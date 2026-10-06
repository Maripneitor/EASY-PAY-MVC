import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { TokenStorage } from '../src/infrastructure/security/TokenStorage';
import { User, Grupo, Participant, Item, GrupoStatus } from '../src/domain/types';
import { groupRepository } from '../src/infrastructure/api/repositories/GroupRepository';
import { paymentRepository } from '../src/infrastructure/api/repositories/PaymentRepository';
import { wsClient } from '../src/infrastructure/api/mobile-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../src/infrastructure/context/NotificationContext';
import { userRepository } from '../src/infrastructure/api/repositories/UserRepository';

// --- Types from PaymentContext ---
export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type PaymentStatus = 'pending' | 'waiting_confirmation' | 'confirmed' | 'rejected';

export interface SavedCard {
    id: string;
    token: string;
    last4: string;
    brand: string;
    holder: string;
    expiry: string;
    colors: string[];
    isDefault: boolean;
    createdAt: number;
}

export interface Debt {
    id: string;
    groupId: string;
    groupName: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
    concept: string;
    createdAt: number;
}

export interface Payment {
    id: string;
    debtId: string;
    groupId: string;
    groupName: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    note?: string;
    witnessId?: string;
    witnessName?: string;
    witnessConfirmed?: boolean;
    receiverConfirmed?: boolean;
    createdAt: number;
    confirmedAt?: number;
    concept: string;
}

// --- Context Type ---
interface EasyPayContextType {
    // Auth
    user: User | null;
    token: string | null;
    isLoading: boolean;
    loginAsGuest: (name: string, groupCode?: string) => Promise<void>;
    logout: () => Promise<void>;
    saveSession: (token: string, userData: User) => Promise<void>;
    saveGuestSession: (user: User) => Promise<void>;
    
    // Auth Flow Methods
    setupTwoFactor: (userId: string) => Promise<any>;
    verifyTwoFactor: (userId: string, code: string) => Promise<any>;
    requestPasswordReset: (email: string) => Promise<any>;
    changePassword: (userId: string, data: any) => Promise<any>;

    // Groups
    activeGrupo: Grupo | null;
    refreshGrupo: () => Promise<void>;
    createGrupo: (nombre: string, liderId: string) => Promise<string>;
    joinGrupo: (codigo: string) => Promise<boolean>;
    addItem: (item: Omit<Item, 'id'>) => Promise<void>;
    addItems: (items: Omit<Item, 'id'>[]) => Promise<void>;
    updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
    deleteItem: (id: string) => Promise<void>;
    assignItem: (itemId: string, participantIds: string[]) => Promise<void>;
    startSettlement: (selectedAccounts: any[]) => Promise<void>;
    closeGrupo: (tip: number, total: number) => Promise<void>;
    finalizeGroup: (groupId: string) => Promise<void>;
    clearGrupo: () => Promise<void>;
    calculateUserDebt: (participantId: string) => number;
    loadGroupDetails: (id: string) => Promise<void>;
    normalizeGrupo: (raw: any) => Grupo;

    // Payments
    debts: Debt[];
    payments: Payment[];
    cards: SavedCard[];
    initiatePayment: (data: Omit<Payment, 'id' | 'createdAt' | 'status'>) => Promise<Payment>;
    fetchFinancialData: () => Promise<void>;
    addCard: (card: Omit<SavedCard, 'id' | 'createdAt' | 'isDefault'>) => Promise<void>;
    removeCard: (id: string) => Promise<void>;
    setDefaultCard: (id: string) => Promise<void>;

    // Sync / NetInfo
    isOnline: boolean;
    lastRoute: string | null;
    saveLastRoute: (route: string) => Promise<void>;

    // Settlement Approvals
    pendingSettlements: any[];
    pendingSettlementsCount: number;
    fetchPendingSettlements: () => Promise<void>;

    // Missing Financial Methods
    getDebtsByUser: (userId: string) => Debt[];
    getTotalOwed: (userId: string) => number;
    getTotalToReceive: (userId: string) => number;
    pendingConfirmations: (userId: string) => Payment[];
    confirmPaymentAsReceiver: (paymentId: string) => Promise<void>;
    confirmPaymentAsWitness: (paymentId: string) => Promise<void>;
    rejectPayment: (paymentId: string) => Promise<void>;
    addDebt: (debt: Omit<Debt, 'id' | 'createdAt'>) => void;
    removeDebt: (debtId: string) => void;
}

const EasyPayContext = createContext<EasyPayContextType | undefined>(undefined);

const STORAGE_KEYS = {
    USER: 'user_data',
    ACTIVE_GRUPO: '@easy_pay_active_grupo',
    PAYMENTS: 'easypay_payments',
    LAST_ROUTE: 'easypay_last_route',
};

export const EasyPayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Auth State
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Group State
    const [activeGrupo, setActiveGrupo] = useState<Grupo | null>(null);
    const [balances, setBalances] = useState<any[]>([]);

    // Payment State
    const [debts, setDebts] = useState<Debt[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [cards, setCards] = useState<SavedCard[]>([]);
    const router = useRouter();
    const { notifyUserJoined, notifyGroupClosed, notifyItemAssigned } = useNotifications();
    const [realStats, setRealStats] = useState({ totalOwed: 0, totalToReceive: 0 });

    // Settlement Approval State
    const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);
    const [pendingSettlementsCount, setPendingSettlementsCount] = useState(0);

    // Connectivity State
    const [isOnline, setIsOnline] = useState(true);
    const [lastRoute, setLastRoute] = useState<string | null>(null);

    // --- Helpers ---
    const makeId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const saveLastRoute = async (route: string) => {
        setLastRoute(route);
        await AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTE, route);
    };

    // --- Connectivity Effect ---
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // --- Initial Load ---
    useEffect(() => {
        const init = async () => {
            try {
                // Load Auth
                const savedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
                if (savedUser) {
                    const parsedUser = JSON.parse(savedUser) as User;
                    setUser(parsedUser);
                    if (!parsedUser.isGuest) {
                        const savedToken = await TokenStorage.getToken();
                        if (savedToken) setToken(savedToken);
                    }
                }

                // Load Group
                const savedGrupo = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_GRUPO);
                if (savedGrupo) {
                    setActiveGrupo(JSON.parse(savedGrupo));
                }

                // Load Payments
                const savedPayments = await AsyncStorage.getItem(STORAGE_KEYS.PAYMENTS);
                if (savedPayments) {
                    const parsed = JSON.parse(savedPayments);
                    setDebts(parsed.debts ?? []);
                    setPayments(parsed.payments ?? []);
                }

                // Load Last Route
                const savedRoute = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROUTE);
                if (savedRoute) setLastRoute(savedRoute);
            } catch (e) {
                console.error('Error initializing EasyPay state:', e);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    // --- Persistence Effects ---
    useEffect(() => {
        if (activeGrupo) {
            AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_GRUPO, JSON.stringify(activeGrupo)).catch(() => {});
        } else {
            AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_GRUPO).catch(() => {});
        }
    }, [activeGrupo]);

    useEffect(() => {
        AsyncStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify({ debts, payments })).catch(() => {});
    }, [debts, payments]);

    // --- WebSocket Logic ---
    useEffect(() => {
        if (activeGrupo?.id && token && isOnline) {
            wsClient.connect(activeGrupo.id, token);
            
            // Refrescar datos en cualquier actualización general
            wsClient.on('*', () => {
                console.log("[WS] Actualización recibida, refrescando datos...");
                loadGroupDetails(activeGrupo.id);
            });

            wsClient.on('payment_reported', (data) => {
                console.log("[WS] Pago reportado:", data);
                fetchPendingSettlements();
            });

            wsClient.on('settlement_updated', (data) => {
                console.log("[WS] Liquidación actualizada:", data);
                fetchPendingSettlements();
            });

            wsClient.on('group_updated', () => {
                loadGroupDetails(activeGrupo.id);
            });
        }
        return () => {
            if (activeGrupo?.id) wsClient.disconnect();
        };
    }, [activeGrupo?.id, token, isOnline]);

    // --- Auth Actions ---
    const saveSession = async (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        await TokenStorage.setToken(newToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    };

    // --- Auth Flow Implementation ---
    const setupTwoFactor = async (userId: string) => {
        return await userRepository.setupTwoFactor(userId);
    };

    const verifyTwoFactor = async (userId: string, code: string) => {
        return await userRepository.verifyTwoFactor(userId, code);
    };

    const requestPasswordReset = async (email: string) => {
        return await userRepository.requestPasswordReset(email);
    };

    const changePassword = async (userId: string, data: any) => {
        return await userRepository.changePassword(userId, data);
    };

    const saveGuestSession = async (newUser: User) => {
        const guest = { ...newUser, isGuest: true };
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(guest));
        setUser(guest);
        setToken(null);
    };

    const logout = async () => {
        try {
            wsClient.disconnect();
            await TokenStorage.clear();
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
            await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_GRUPO);
            setToken(null);
            setUser(null);
            setActiveGrupo(null);
            
            // Redirigir a login
            router.replace('/login');
        } catch (e) {
            console.error("Error during logout:", e);
        }
    };

    // --- Group Actions ---
    const recalculateTotals = (items: Item[]) => {
        const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const tax = subtotal * 0.16; // 16% IVA
        const service = subtotal * 0.05; // 5% Servicio
        const tipPercent = subtotal < 3000 ? 0.10 : 0.05;
        const propina = subtotal * tipPercent;
        return { 
            subtotal, 
            tax,
            service,
            propina, 
            total: subtotal + tax + service + propina 
        };
    };

    const createGrupo = async (nombre: string, liderId: string, items: any[] = []) => {
        if (isOnline) {
            try {
                const leader = { 
                    id: liderId, 
                    nombre: user?.nombre || 'Tú',
                    avatar: user?.avatar || '',
                    color: '#2196F3'
                };
                const newGroupResp = await groupRepository.createGroup(leader as any, nombre, items);
                const normalized = normalizeGrupo(newGroupResp);
                setActiveGrupo(normalized);
                
                // Pequeño respiro para asegurar que la DB asimile el insert antes de la navegación
                await new Promise(resolve => setTimeout(resolve, 100));
                
                return normalized.id;
            } catch (error) {
                console.error("Error creating group on backend:", error);
                throw error;
            }
        }

        // Fallback offline (Mock)
        const newId = makeId('grp');
        const newGrupo: Grupo = {
            id: newId,
            codigo: Math.floor(100000 + Math.random() * 900000).toString(),
            nombre,
            liderId,
            participantes: [{
                id: liderId,
                nombre: user?.nombre || 'Tú',
                role: 'leader',
                isLeader: true,
                color: '#2196F3',
                status: 'online',
                avatar: user?.avatar || '',
                debt: 0
            } as any],
            items: [],
            subtotal: 0,
            propina: 0,
            total: 0,
            status: 'active' as any,
            creadaEn: new Date().toISOString(),
        };
        setActiveGrupo(newGrupo);
        return newId;
    };

    const joinGrupo = async (codigo: string): Promise<boolean> => {
        if (!user?.id) return false;
        
        try {
            const member: any = {
                id: user.id,
                nombre: user.nombre,
                avatar: user.avatar,
                email: user.email
            };
            const groupData = await groupRepository.joinGroup(codigo, member);
            if (groupData) {
                const normalized = normalizeGrupo(groupData);
                setActiveGrupo(normalized);
                return true;
            }
            return false;
        } catch (error: any) {
            console.error("Error joining group:", error);
            const detail = error.response?.data?.detail || error.message || "";
            
            if (detail.includes("settling")) throw new Error("El grupo está en fase de liquidación, no acepta nuevos miembros");
            if (detail.includes("closed")) throw new Error("El grupo ya está cerrado");
            if (detail.includes("parte de este grupo") || error.response?.status === 409) {
                throw new Error("Ya eres parte de este grupo");
            }
            if (detail.includes("Código") || error.response?.status === 404) {
                throw new Error("El código ingresado no existe o es inválido");
            }
            
            throw new Error(detail || "No se pudo unir al grupo. Verifica tu conexión.");
        }
    };

    const addItem = async (itemData: Omit<Item, 'id'>) => {
        if (!activeGrupo) return;
        const newItem: Item = { ...itemData, id: makeId('itm') };
        const updatedItems = [...activeGrupo.items, newItem];
        const totals = recalculateTotals(updatedItems);
        setActiveGrupo({ ...activeGrupo, items: updatedItems, ...totals });
        
        if (isOnline) {
            try {
                await groupRepository.addItem(activeGrupo.id, newItem);
            } catch (error) {
                console.warn('Failed to sync item, will be cached locally');
            }
        }
    };

    const addItems = async (itemsData: Omit<Item, 'id'>[]) => {
        if (!activeGrupo || itemsData.length === 0) return;
        
        const newItems = itemsData.map(data => ({ ...data, id: makeId('itm') }));
        const updatedItems = [...activeGrupo.items, ...newItems];
        const totals = recalculateTotals(updatedItems);
        setActiveGrupo({ ...activeGrupo, items: updatedItems, ...totals });
        
        if (isOnline) {
            try {
                // Backend does not support bulk add yet, so we loop but only update state once
                for (const item of newItems) {
                    await groupRepository.addItem(activeGrupo.id, item);
                }
            } catch (error) {
                console.warn('Failed to sync some items');
            }
        }
    };

    const updateItem = async (id: string, updates: Partial<Item>) => {
        if (!activeGrupo) return;
        const updatedItems = activeGrupo.items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        const totals = recalculateTotals(updatedItems);
        setActiveGrupo({ ...activeGrupo, items: updatedItems, ...totals });
    };

    const deleteItem = async (id: string) => {
        if (!activeGrupo) return;
        const updatedItems = activeGrupo.items.filter(item => item.id !== id);
        const totals = recalculateTotals(updatedItems);
        setActiveGrupo({ ...activeGrupo, items: updatedItems, ...totals });
    };

    const assignItem = async (itemId: string, participantIds: string[]) => {
        if (!activeGrupo) return;
        const updatedItems = activeGrupo.items.map(item =>
            item.id === itemId ? { ...item, asignadoA: participantIds } : item
        );
        setActiveGrupo({ ...activeGrupo, items: updatedItems });
    };

    const startSettlement = async (selectedAccounts: any[]) => {
        if (!activeGrupo || !isOnline) return;
        try {
            await groupRepository.startSettlement(activeGrupo.id, selectedAccounts);
        } catch (error) {
            console.error('Failed to start settlement:', error);
        }
    };

    const closeGrupo = async (tip: number, total: number) => {
        if (!activeGrupo) return;
        setActiveGrupo({ ...activeGrupo, status: 'settling', propina: tip, total: total });
        if (isOnline) {
            try {
                await groupRepository.closeGroup(activeGrupo.id, { tip_amount: tip, final_total: total });
            } catch (error) {
                console.error(error);
            }
        }
    };

    const finalizeGroup = async (groupId: string) => {
        if (!isOnline) return;
        try {
            await groupRepository.updateGroup(groupId, { status: 'closed' });
            if (activeGrupo?.id === groupId) {
                setActiveGrupo({ ...activeGrupo, status: 'closed' });
            }
            await loadGroupDetails(groupId);
        } catch (error) {
            console.error('Failed to finalize group:', error);
        }
    };

    const clearGrupo = async () => {
        setActiveGrupo(null);
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_GRUPO);
    };

    const refreshGrupo = async () => {
        if (activeGrupo?.id && isOnline) {
            await loadGroupDetails(activeGrupo.id);
        }
    };

    const normalizeGrupo = (raw: any): Grupo => {
        if (!raw) return null as any;

        const items = (raw.items || []).map((i: any) => ({
            id: i.id || i._id || i.item_id || makeId('itm'),
            nombre: i.nombre || i.description || 'Ítem',
            precio: parseFloat(i.precio || i.amount || '0'),
            cantidad: parseFloat(i.cantidad || i.quantity || '1'),
            categoria: i.categoria || i.category || 'Otros',
            autorId: i.autorId || i.addedBy || i.comprador_id || '',
            asignadoA: (i.asignadoA || i.assignedTo || i.participantes_ids || []).map((id: any) => String(id))
        }));

        // Recálculo local para consistencia absoluta en la UI
        const subtotalValue = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const taxValue = subtotalValue * 0.16;
        const serviceValue = subtotalValue * 0.05;
        const propinaValue = parseFloat(raw.propina || raw.propina_total || raw.tip || '0');
        const totalValue = subtotalValue + taxValue + serviceValue + propinaValue;

        const extraCharges = taxValue + serviceValue + propinaValue;
        const groupSubtotal = subtotalValue || 1;

        const participantes = (raw.participantes || raw.members || raw.integrantes || []).map((p: any) => {
            const rawId = p.id || p._id || (typeof p === 'string' ? p : makeId('usr'));
            const pId = String(rawId);
            const pName = p.nombre || p.name || (typeof p === 'string' ? 'Usuario' : 'Usuario Desconocido');
            
            // Calcular deuda individual proporcional
            const userSubtotal = items.reduce((acc, item) => {
                const assigned = item.asignadoA || [];
                if (assigned.includes(pId) && assigned.length > 0) {
                    return acc + (item.precio * item.cantidad / assigned.length);
                }
                return acc;
            }, 0);
            
            const proportion = userSubtotal / groupSubtotal;
            const userDebt = userSubtotal + (extraCharges * proportion);

            return {
                id: pId,
                nombre: pName,
                avatar: p.avatar || '',
                color: p.color || '#3b82f6',
                isLeader: p.isLeader || p.role === 'leader' || (raw.liderId || raw.admin_id) === pId,
                debt: isNaN(userDebt) ? 0 : userDebt,
                status: p.status || 'online'
            };
        });

        return {
            id: raw.id || raw._id || raw.group_id || '',
            nombre: raw.nombre || raw.name || 'Sin nombre',
            liderId: raw.liderId || raw.admin_id || '',
            codigo: raw.codigo || raw.codigo_invitacion || raw.invite_code || '000000',
            participantes,
            items,
            subtotal: subtotalValue,
            tax: taxValue,
            service: serviceValue,
            propina: propinaValue,
            total: totalValue,
            status: (raw.status || raw.estado || 'active').toLowerCase() as GrupoStatus,
            creadaEn: raw.creadaEn || raw.fecha_creacion || raw.created_at || new Date().toISOString()
        };
    };



    const loadGroupDetails = async (id: string) => {
        if (!isOnline) return;
        try {
            const [groupData, itemsData, balancesData] = await Promise.all([
                groupRepository.getGroup(id),
                groupRepository.getItems(id),
                groupRepository.getBalances(id)
            ]);
            
            const fullGroup = {
                ...groupData,
                items: itemsData
            };
            
            setActiveGrupo(normalizeGrupo(fullGroup));
            setBalances(balancesData.balance_detallado || []);
        } catch (error) {
            console.error("Error loading group details:", error);
        }
    };

    const calculateUserDebt = (userId: string): number => {
        if (!activeGrupo || !activeGrupo.items || activeGrupo.items.length === 0) return 0;
        
        try {
            // 1. Calcular el subtotal personal (suma de partes de items asignados)
            const userSubtotal = activeGrupo.items.reduce((acc, item) => {
                const assigned = item.asignadoA || [];
                if (assigned.includes(userId) && assigned.length > 0) {
                    const precio = parseFloat(item.precio?.toString() || '0');
                    const cantidad = parseFloat(item.cantidad?.toString() || '1');
                    return acc + (precio * cantidad / assigned.length);
                }
                return acc;
            }, 0);

            if (userSubtotal === 0) return 0;

            // 2. Calcular la proporción del usuario en el grupo
            const groupSubtotal = activeGrupo.subtotal || 1;
            const proportion = userSubtotal / groupSubtotal;

            // 3. Aplicar proporción a los cargos extra (IVA, Servicio, Propina)
            const extraCharges = (activeGrupo.tax || 0) + (activeGrupo.service || 0) + (activeGrupo.propina || 0);
            const userExtra = extraCharges * proportion;
            
            const total = userSubtotal + userExtra;
            return isNaN(total) ? 0 : total;
        } catch (e) {
            console.error("[EasyPayContext] Error calculating debt:", e);
            return 0;
        }
    };

    // --- Payment Actions ---
    const fetchFinancialData = useCallback(async () => {
        if (!user?.id || !isOnline) return;
        try {
            const stats = await paymentRepository.getStats(user.id);
            setRealStats({ totalOwed: stats.user_owes || 0, totalToReceive: stats.owed_to_user || 0 });
            
            const trans = await paymentRepository.getTransactions(user.id);
            const mappedPayments: Payment[] = trans.map((t: any) => ({
                id: t.id,
                debtId: t.id,
                groupId: '',
                groupName: t.group_name || 'Individual',
                fromUserId: t.is_incoming ? 'other' : user.id,
                fromUserName: t.is_incoming ? 'Compañero' : user.nombre,
                toUserId: t.is_incoming ? user.id : 'other',
                toUserName: t.is_incoming ? user.nombre : 'Compañero',
                amount: t.amount,
                method: 'transfer',
                status: t.status === 'completed' || t.status === 'approved' ? 'confirmed' : (t.status === 'pending' ? 'waiting_confirmation' : 'rejected'),
                createdAt: new Date(t.date).getTime(),
                concept: 'Pago'
            }));
            setPayments(mappedPayments);
        } catch (error) {
            console.error('Error fetching financial data:', error);
        }
    }, [user?.id, user?.nombre, isOnline]);

    const fetchCards = useCallback(async () => {
        if (!user?.id || !isOnline) return;
        try {
            const data = await paymentRepository.getCards(user.id);
            const mappedCards: SavedCard[] = data.map((c: any) => ({
                id: c.id || c._id,
                token: c.token || '',
                last4: c.last_four || '****',
                brand: c.brand || 'VISA',
                holder: c.holder || 'TITULAR',
                expiry: c.expiry || '00/00',
                colors: c.colors || ['#1e293b', '#0f172a'],
                isDefault: c.is_default || false,
                createdAt: c.created_at || Date.now()
            }));
            setCards(mappedCards);
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }, [user?.id, isOnline]);

    const fetchPendingSettlements = useCallback(async () => {
        if (!user?.id || !isOnline) return;
        try {
            // Buscamos los grupos del usuario
            const groups = await groupRepository.findByUser(user.id);
            const adminGroups = groups.filter(g => g.admin_id === user.id);
            
            let allPending: any[] = [];
            for (const g of adminGroups) {
                try {
                    const pending = await groupRepository.getPendingSettlements(g.id);
                    allPending = [...allPending, ...pending.map(p => ({ ...p, group_name: g.nombre }))];
                } catch (e) {
                    // Ignorar errores de un grupo específico
                }
            }
            
            setPendingSettlements(allPending);
            setPendingSettlementsCount(allPending.length);
        } catch (error) {
            console.error('Error fetching pending settlements:', error);
        }
    }, [user?.id, isOnline]);

    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries();
            fetchCards();
            fetchFinancialData();
            fetchPendingSettlements();
            if (activeGrupo?.id) loadGroupDetails(activeGrupo.id);
        }
    }, [isOnline, fetchCards, fetchFinancialData, fetchPendingSettlements, queryClient]);

    // Polling global para el badge (cada 30 segundos)
    useEffect(() => {
        if (!user?.id || !isOnline) return;
        
        const interval = setInterval(() => {
            console.log('[Polling] Refrescando badge de pagos pendientes...');
            fetchPendingSettlements();
        }, 30000);
        
        return () => clearInterval(interval);
    }, [user?.id, isOnline, fetchPendingSettlements]);

    const initiatePayment = useCallback(async (data: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment> => {
        const newPayment: Payment = {
            ...data,
            id: makeId('pay'),
            createdAt: Date.now(),
            status: 'waiting_confirmation',
            witnessConfirmed: false,
            receiverConfirmed: false,
        };
        setPayments(prev => [newPayment, ...prev]);
        return newPayment;
    }, []);

    const addCard = useCallback(async (card: Omit<SavedCard, 'id' | 'createdAt' | 'isDefault'>) => {
        if (!user?.id || !isOnline) return;
        const backendCard = {
            token: card.token,
            last_four: card.last4,
            brand: card.brand,
            holder: card.holder,
            expiry: card.expiry,
            colors: card.colors,
            is_default: cards.length === 0
        };
        await paymentRepository.addCard(user.id, backendCard);
        await fetchCards();
    }, [user?.id, cards.length, fetchCards, isOnline]);

    const removeCard = useCallback(async (id: string) => {
        if (!user?.id || !isOnline) return;
        await paymentRepository.removeCard(user.id, id);
        await fetchCards();
    }, [user?.id, fetchCards, isOnline]);

    const setDefaultCard = useCallback(async (id: string) => {
        if (!user?.id || !isOnline) return;
        await paymentRepository.setDefaultCard(user.id, id);
        await fetchCards();
    }, [user?.id, fetchCards, isOnline]);

    const getDebtsByUser = useCallback((userId: string) => {
        return debts.filter(d => d.fromUserId === userId);
    }, [debts]);

    const getTotalOwed = useCallback((userId: string) => {
        return debts
            .filter(d => d.fromUserId === userId)
            .reduce((acc, d) => acc + d.amount, 0);
    }, [debts]);

    const getTotalToReceive = useCallback((userId: string) => {
        return debts
            .filter(d => d.toUserId === userId)
            .reduce((acc, d) => acc + d.amount, 0);
    }, [debts]);

    const pendingConfirmations = useCallback((userId: string) => {
        return payments.filter(p => 
            (p.toUserId === userId && !p.receiverConfirmed) || 
            (p.witnessId === userId && !p.witnessConfirmed)
        );
    }, [payments]);

    const confirmPaymentAsReceiver = async (paymentId: string) => {
        setPayments(prev => prev.map(p => 
            p.id === paymentId ? { ...p, receiverConfirmed: true, status: p.witnessId ? (p.witnessConfirmed ? 'confirmed' : p.status) : 'confirmed' } : p
        ));
        // Sync with backend if needed
    };

    const confirmPaymentAsWitness = async (paymentId: string) => {
        setPayments(prev => prev.map(p => 
            p.id === paymentId ? { ...p, witnessConfirmed: true, status: p.receiverConfirmed ? 'confirmed' : p.status } : p
        ));
    };

    const rejectPayment = async (paymentId: string) => {
        setPayments(prev => prev.map(p => 
            p.id === paymentId ? { ...p, status: 'rejected' } : p
        ));
    };

    const addDebt = (debtData: Omit<Debt, 'id' | 'createdAt'>) => {
        const newDebt: Debt = {
            ...debtData,
            id: makeId('debt'),
            createdAt: Date.now()
        };
        setDebts(prev => [...prev, newDebt]);
    };

    const removeDebt = (debtId: string) => {
        setDebts(prev => prev.filter(d => d.id !== debtId));
    };

    const value: EasyPayContextType = {
        user, token, isLoading, saveSession, saveGuestSession, logout,
        activeGrupo, refreshGrupo, createGrupo, joinGrupo, addItem, addItems, updateItem, deleteItem, assignItem, startSettlement, closeGrupo, finalizeGroup, clearGrupo, calculateUserDebt, loadGroupDetails, normalizeGrupo,
        debts, payments, cards, initiatePayment, fetchFinancialData, addCard, removeCard, setDefaultCard,
        isOnline, lastRoute, saveLastRoute,
        pendingSettlements, pendingSettlementsCount, fetchPendingSettlements,
        getDebtsByUser, getTotalOwed, getTotalToReceive, pendingConfirmations,
        confirmPaymentAsReceiver, confirmPaymentAsWitness, rejectPayment, addDebt, removeDebt
    };

    return (
        <EasyPayContext.Provider value={value}>
            {children}
        </EasyPayContext.Provider>
    );
};

export const useEasyPay = () => {
    const context = useContext(EasyPayContext);
    if (context === undefined) {
        throw new Error('useEasyPay must be used within an EasyPayProvider');
    }
    return context;
};

export function timeAgoPayment(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
}
