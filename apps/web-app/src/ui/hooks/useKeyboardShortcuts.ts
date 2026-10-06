import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@infrastructure/routes';
import { toast } from 'sonner';

export const useKeyboardShortcuts = (closeModals?: () => void) => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid shortcuts if user is typing in an input or textarea
            if (
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                (document.activeElement as HTMLElement)?.isContentEditable
            ) {
                return;
            }

            const key = e.key.toLowerCase();
            const ctrlKey = e.ctrlKey || e.metaKey;

            // Esc to close modals
            if (e.key === 'Escape' && closeModals) {
                closeModals();
                return;
            }

            // Command Palette (Ctrl + K) - handled in a separate component usually, 
            // but we can trigger a state here if needed.
            if (ctrlKey && key === 'k') {
                e.preventDefault();
                // This will be handled by the CommandPalette component listener
                return;
            }

            // Simple navigation shortcuts
            if (!ctrlKey) {
                switch (key) {
                    case 'g':
                        toast.success('Navegando a Grupos...');
                        navigate(ROUTES.DASHBOARD);
                        break;
                    case 'e':
                        toast.success('Navegando a Estadísticas...');
                        navigate(ROUTES.STATS);
                        break;
                    case 'p':
                        toast.success('Navegando a Perfil...');
                        navigate(ROUTES.PROFILE);
                        break;
                    default:
                        break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, closeModals]);
};
