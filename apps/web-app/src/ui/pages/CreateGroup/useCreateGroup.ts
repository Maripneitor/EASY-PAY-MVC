import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { httpClient } from '../../../infrastructure/api/http-client';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../../infrastructure/routes';

export const useCreateGroup = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuthContext();
    
    const userRoles = (user?.roles || ['Usuario Regular']).map((r: string) => r.toLowerCase());
    const isAdmin = userRoles.includes('administrador') || userRoles.includes('admin');
    const isEditor = userRoles.includes('editor');
    const userPermissions = user?.permissions || [];
    const canWriteGroups = isAdmin || isEditor || userRoles.includes('usuario regular') || userRoles.includes('usuario') || userPermissions.includes('groups:write') || true;

    // Sincronización reactiva con URL: ?tab=create vs ?tab=join
    const tabParam = searchParams.get('tab');
    const activeTab: 'create' | 'join' = (tabParam === 'join' || tabParam === 'unirse') ? 'join' : 'create';

    const setActiveTab = (tab: 'create' | 'join' | 'crear' | 'unirse') => {
        const normalized: 'create' | 'join' = (tab === 'join' || tab === 'unirse') ? 'join' : 'create';
        setSearchParams({ tab: normalized });
    };

    // Estados para CREAR
    const [groupName, setGroupName] = useState('');
    const [groupDesc, setGroupDesc] = useState('');
    const [currency, setCurrency] = useState<'MXN' | 'USD' | 'EUR'>('MXN');

    // Estados para UNIRSE
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            toast.error("Por favor ingresa un nombre para el grupo.");
            return;
        }

        const userId = user?.id;
        if (!userId) {
            navigate(ROUTES.AUTH);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nombre: groupName.trim(),
                descripcion: groupDesc.trim() || "",
                admin_id: userId,
                moneda: currency,
                integrantes: [userId]
            };

            const response = await httpClient.post('/groups/create', payload);

            if (response.status === 200 || response.status === 201) {
                toast.success("¡Grupo creado exitosamente!");
                const newGroupId = response.data?.group_id || response.data?.id || response.data?._id;
                navigate(newGroupId ? ROUTES.GROUP_DETAIL(newGroupId) : ROUTES.DASHBOARD);
            } else {
                toast.error(response.data?.detail || "No se pudo crear el grupo.");
            }
        } catch (error: any) {
            console.error("Error al crear grupo:", error);
            toast.error(error.response?.data?.detail || "Error de conexión con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinGroup = async () => {
        setJoinError(null);
        const cleanCode = joinCode.trim().toUpperCase();
        if (cleanCode.length < 4) {
            setJoinError("Ingresa un código de acceso válido (mínimo 4 caracteres).");
            return;
        }

        const userId = user?.id;
        if (!userId) {
            navigate(ROUTES.AUTH);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                codigo: cleanCode,
                user_id: userId
            };

            const response = await httpClient.post('/groups/join', payload);

            if (response.status === 200 || response.status === 201) {
                toast.success("Te has unido al grupo exitosamente");
                const newGroupId = response.data?.group_id || response.data?.id || response.data?._id;
                navigate(newGroupId ? ROUTES.GROUP_DETAIL(newGroupId) : ROUTES.DASHBOARD);
            } else {
                const detail = response.data?.detail;
                const msg = typeof detail === 'object' ? detail?.message : (detail || "Código inválido o ya formas parte del grupo");
                setJoinError(msg);
                toast.error(msg);
            }
        } catch (error: any) {
            console.error("Error al unirse al grupo:", error);
            const detail = error.response?.data?.detail;
            const msg = typeof detail === 'object' ? detail?.message : (detail || "Código no válido o ha expirado. Verifica con el anfitrión.");

            if (typeof detail === 'object' && detail?.code === 'ALREADY_MEMBER' && detail?.group_id) {
                toast.info("Ya formas parte de este grupo. Redirigiendo...");
                navigate(ROUTES.GROUP_DETAIL(detail.group_id));
                return;
            }

            setJoinError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return {
        activeTab,
        setActiveTab,
        canWriteGroups,
        groupName,
        setGroupName,
        groupDesc,
        setGroupDesc,
        currency,
        setCurrency,
        joinCode,
        setJoinCode,
        joinError,
        setJoinError,
        handleCreateGroup,
        handleJoinGroup,
        loading,
        goBack: () => navigate(-1)
    };
};
