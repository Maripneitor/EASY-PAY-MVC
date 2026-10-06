import { useState } from 'react';
import { toast } from 'sonner';

export const useClipboard = () => {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            toast.success('Dato copiado al portapapeles', {
                description: text,
                duration: 2000
            });
            
            // Reset icon after 2 seconds
            setTimeout(() => {
                setCopiedId(null);
            }, 2000);
            
            return true;
        } catch (err) {
            console.error('Failed to copy: ', err);
            toast.error('No se pudo copiar al portapapeles');
            return false;
        }
    };

    return { copyToClipboard, copiedId };
};
