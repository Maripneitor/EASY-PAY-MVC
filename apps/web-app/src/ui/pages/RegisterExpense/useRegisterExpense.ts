import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient as useTanstackQueryClient } from '@tanstack/react-query';
import { httpClient } from '../../../infrastructure/api/http-client';
import { toast } from 'sonner';

export const useRegisterExpense = () => {
    const { groupId, itemId } = useParams<{ groupId: string, itemId: string }>();
    const navigate = useNavigate();
    const queryClient = useTanstackQueryClient();
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<{ id: string, nombre: string }[]>([]);

    const [formData, setFormData] = useState({
        nombre: '', // Logical reference
        precio: '', // Logical reference
        cantidad: 1, // Logical reference
        categoria: 'Otros', // Logical reference
        comprador_id: '', // Logical reference
        participantes_ids: [] as string[] // Logical reference
    });

    const fetchGroupAndItem = useCallback(async () => {
        const userId = localStorage.getItem('userId');
        const cleanGroupId = groupId?.replace(/[#?:]/g, '');

        if (!userId || !cleanGroupId) return;

        setLoading(true);
        try {
            // Fetch group first to get members
            const resGroup = await httpClient.get(`/groups/${cleanGroupId}`);
            if (resGroup.status === 200) {
                const currentGroup = resGroup.data;
                const formattedList = currentGroup.integrantes.map((m: any) => ({
                    id: m.id,
                    nombre: m.id === userId ? `Yo (${m.nombre || 'Usuario'})` : (m.nombre || 'Usuario')
                }));
                setMembers(formattedList);

                // If editing, fetch item details
                if (itemId) {
                    const resItem = await httpClient.get(`/groups/${cleanGroupId}/items/${itemId}`);
                    if (resItem.status === 200) {
                        const item = resItem.data;
                        setFormData({
                            nombre: item.nombre,
                            precio: (item.monto || item.precio || 0).toString(),
                            cantidad: item.cantidad || 1,
                            categoria: item.categoria || 'Otros',
                            comprador_id: typeof item.comprador_id === 'object' ? item.comprador_id.id || item.comprador_id._id : item.comprador_id,
                            participantes_ids: Array.isArray(item.participantes_ids) 
                                ? item.participantes_ids.map((p: any) => typeof p === 'object' ? p.id || p._id : p)
                                : []
                        });
                    }
                } else {
                    // Default for new expense
                    setFormData(prev => ({
                        ...prev,
                        comprador_id: userId, // Logical reference
                        categoria: 'Otros', // Logical reference
                        participantes_ids: formattedList.map((m: any) => m.id) // Logical reference
                    }));
                }
            }
        } catch (error: any) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [groupId, itemId]);

    useEffect(() => {
        fetchGroupAndItem();
    }, [fetchGroupAndItem]);

    const toggleParticipant = (id: string) => {
        setFormData(prev => ({
            ...prev,
            participantes_ids: prev.participantes_ids.includes(id) // Logical reference
                ? prev.participantes_ids.filter(p => p !== id)
                : [...prev.participantes_ids, id]
        }));
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const cleanGroupId = groupId?.replace(/[#?:]/g, '');

        if (!formData.nombre || !formData.precio || formData.participantes_ids.length === 0) {
            toast.warning("Por favor rellena todos los campos.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                group_id: cleanGroupId,
                nombre: formData.nombre.trim(),
                precio: parseFloat(formData.precio),
                cantidad: Number(formData.cantidad),
                categoria: formData.categoria,
                comprador_id: formData.comprador_id,
                participantes_ids: formData.participantes_ids
            };

            const url = itemId 
                ? `/groups/${cleanGroupId}/items/${itemId}`
                : '/groups/add-item';
            
            const response = itemId 
                ? await httpClient.put(url, payload)
                : await httpClient.post(url, payload);

            if (response.status === 200 || response.status === 201) {
                toast.success(itemId ? "Gasto actualizado" : "Gasto registrado");
                queryClient.invalidateQueries({ queryKey: ['group', cleanGroupId] });
                queryClient.invalidateQueries({ queryKey: ['pending-settlements', cleanGroupId] });
                navigate(-1);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Error al procesar el gasto");
        } finally {
            setLoading(false);
        }
    };

    return { 
        formData, 
        setFormData, 
        members, 
        handleSubmit, 
        loading, 
        toggleParticipant,
        isSubmittingExpense: loading // For backward compatibility if needed
    };
};