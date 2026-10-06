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
        const message = data?.detail || data?.message || error.message;

        switch (status) {
            case 404:
                // Note: Domain NotFoundException requires entity and id, 
                // but if we don't have them here, we can throw a general ValidationException 
                // or improve the mapper to pass them.
                throw new NotFoundException('Recurso', 'desconocido');
            case 401:
            case 403:
                throw new UnauthorizedException(message);
            case 400:
            case 409:
            case 422:
                throw new ValidationException(message);
            default:
                throw new InfrastructureException(message);
        }
    }

    if (error instanceof Error) {
        throw new InfrastructureException(error.message);
    }

    throw new InfrastructureException('Un error inesperado ha ocurrido.');
}
