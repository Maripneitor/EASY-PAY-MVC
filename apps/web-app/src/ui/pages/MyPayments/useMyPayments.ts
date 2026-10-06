import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@ui/context/AuthContext';
import { userRepository } from '@infrastructure/api/repositories';
import { toast } from 'sonner';

export interface PaymentCard {
    id: string;
    lastFour: string;
    holder: string;
    brand: string;
    isDefault: boolean;
    bankName?: string;
    bankStyle?: string;
}

export interface PaymentTransaction {
    id: string;
    description: string;
    category: string;
    date: string;
    status: string;
    amount: number;
    avatarUrl?: string;
    icon?: string;
}

export const useMyPayments = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [cards, setCards] = useState<PaymentCard[]>([]);
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingCard, setIsAddingCard] = useState(false);

    const fetchCards = useCallback(async () => {
        if (!user?.id) return;
        try {
            const data = await userRepository.getCards(user.id);
            // Map backend snake_case to frontend camelCase
            const mappedCards: PaymentCard[] = data.map((c: any) => {
                let style = c.bank_style || 'bg-gradient-to-br from-slate-800 to-slate-900';
                const name = (c.bank_name || '').toUpperCase();

                // Fallback dinámico si el estilo es el por defecto
                if (style === 'bg-gradient-to-br from-slate-800 to-slate-900') {
                    if (name.includes('NU')) style = 'bg-gradient-to-r from-indigo-600 via-purple-700 to-fuchsia-800';
                    else if (name.includes('BBVA')) style = 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800';
                    else if (name.includes('SANTANDER')) style = 'bg-gradient-to-r from-rose-700 via-red-600 to-orange-600';
                    else if (name.includes('CITI') || name.includes('BANAMEX')) style = 'bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-900';
                    else if (name.includes('BANORTE')) style = 'bg-gradient-to-r from-red-800 via-red-700 to-slate-900';
                    else if (name.includes('HSBC')) style = 'bg-gradient-to-r from-red-600 via-red-500 to-gray-200';
                    else if (name.includes('RAPPI')) style = 'bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500';
                    else if (name.includes('AMERICAN') || name.includes('AMEX')) style = 'bg-gradient-to-r from-slate-400 via-slate-500 to-gray-600';
                }

                return {
                    id: c.id || c._id || Math.random().toString(36).substr(2, 9),
                    lastFour: c.last_four || '****',
                    holder: c.holder || 'TITULAR',
                    brand: c.brand || 'VISA',
                    isDefault: c.is_default || false,
                    bankName: c.bank_name || 'EASY-PAY',
                    bankStyle: style
                };
            });
            setCards(mappedCards);
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }, [user?.id]);

    const fetchTransactions = useCallback(async () => {
        // En una versión futura, aquí se llamará al endpoint de historial de pagos real.
        // Por ahora, cumplimos con la tarea de purgar los datos mockeados.
        setTransactions([]);
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCards(), fetchTransactions()]);
            setLoading(false);
        };
        loadData();
    }, [fetchCards, fetchTransactions]);

    const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);

    const goBack = () => navigate(-1);

    const handleDeleteCard = async (cardId: string) => {
        if (!user?.id || !cardId) return;

        try {
            // ELIMINACIÓN DIRECTA SIN 2FA como pidió el usuario
            const toastId = toast.loading('Eliminando tarjeta...');
            await userRepository.deleteCard(user.id, cardId);
            toast.success('Tarjeta eliminada correctamente', { id: toastId });
            fetchCards();
        } catch (error: any) {
            toast.error(error.message || 'No se pudo eliminar la tarjeta');
        }
    };

    const confirmDeleteCard = async () => {
        // Esta función ya no es necesaria para tarjetas pero la dejamos por compatibilidad si se usa en otro lado
        console.log('Confirm delete card placeholder');
    };

    const handleEditCard = (cardId: string) => {
        console.log('Edit card:', cardId);
    };

    const handleAddMethod = () => {
        setIsAddingCard(true);
    };

    const formatCurrency = (amount: number) => {
        const formatted = Math.abs(amount).toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
        });
        return amount < 0 ? `-${formatted}` : formatted;
    };

    return {
        cards,
        transactions,
        loading,
        isAddingCard,
        setIsAddingCard,
        is2FAModalOpen,
        setIs2FAModalOpen,
        userId: user?.id,
        goBack,
        handleDeleteCard,
        confirmDeleteCard,
        handleEditCard,
        handleAddMethod,
        formatCurrency,
        refreshCards: fetchCards
    };
};
