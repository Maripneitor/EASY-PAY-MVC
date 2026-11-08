import { 
    NotFoundException, 
    UnauthorizedException, 
    ValidationException, 
    InfrastructureException 
} from '@easy-pay/domain';
import { AxiosError } from 'axios';

/**
 * Maps infrastructure-level errors (e.g., Axios HTTP errors) to Domain Exceptions.
 * This ensures the application layer only deals with domain-speak errors.
 */
export function handleApiError(error: unknown): never {
    if (error instanceof AxiosError) {
        const status = error.response?.status;
        const data = error.response?.data as any;
        const rawDetail = data?.detail;
        const message = (typeof rawDetail === 'object' ? rawDetail?.message : rawDetail) || data?.message || error.message;

        switch (status) {
            case 404:
                throw new ValidationException(typeof message === 'string' ? message : 'El código o recurso no fue encontrado.');
            case 401:
            case 403:
                throw new UnauthorizedException(typeof message === 'string' ? message : 'No tienes permisos para realizar esta acción.');
            case 400:
            case 409:
            case 422:
                throw new ValidationException(typeof message === 'string' ? message : 'Datos de solicitud no válidos.');
            default:
                throw new InfrastructureException(typeof message === 'string' ? message : 'Error de conexión con el servidor.');
        }
    }

    if (error instanceof Error) {
        throw new InfrastructureException(error.message);
    }

    throw new InfrastructureException('Un error inesperado ha ocurrido.');
}
