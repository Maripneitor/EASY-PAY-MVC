export abstract class DomainException extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class NotFoundException extends DomainException {
    constructor(entity: string, id: string) {
        super(`${entity} con id "${id}" no encontrado.`, 'NOT_FOUND');
    }
}

export class UnauthorizedException extends DomainException {
    constructor(message: string = 'No tienes permisos para realizar esta acción.') {
        super(message, 'UNAUTHORIZED');
    }
}

export class ValidationException extends DomainException {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
    }
}

export class InfrastructureException extends DomainException {
    constructor(message: string = 'Error de conexión con el servidor.') {
        super(message, 'INFRASTRUCTURE_ERROR');
    }
}
