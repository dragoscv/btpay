/**
 * Custom error class for BTPay API errors
 */
export class ApiError extends Error {
    public readonly status: number;
    public readonly data: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;

        // Ensure prototype chain is properly maintained
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends ApiError {
    constructor(message: string = 'Authentication failed', status: number = 401, data?: any) {
        super(message, status, data);
        this.name = 'AuthenticationError';

        // Ensure prototype chain is properly maintained
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

/**
 * Error thrown when payment initiation fails
 */
export class PaymentInitiationError extends ApiError {
    constructor(message: string, status: number, data?: any) {
        super(message, status, data);
        this.name = 'PaymentInitiationError';

        // Ensure prototype chain is properly maintained
        Object.setPrototypeOf(this, PaymentInitiationError.prototype);
    }
}

/**
 * Error thrown when validation fails for input parameters
 */
export class ValidationError extends Error {
    public readonly validationErrors: Record<string, string[]>;

    constructor(message: string, validationErrors: Record<string, string[]>) {
        super(message);
        this.name = 'ValidationError';
        this.validationErrors = validationErrors;

        // Ensure prototype chain is properly maintained
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

/**
 * Error thrown when a network error occurs
 */
export class NetworkError extends Error {
    constructor(message: string = 'Network error occurred') {
        super(message);
        this.name = 'NetworkError';

        // Ensure prototype chain is properly maintained
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}