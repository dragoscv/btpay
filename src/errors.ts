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