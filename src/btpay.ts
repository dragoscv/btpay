import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
    BTPayOptions,
    CreatePaymentParams,
    PaymentInitiationResponse,
    PaymentStatusResponse,
    PaymentType
} from './types';
import { ApiError } from './errors';

/**
 * Main BTPay API client for interacting with BT-BG PSD2 PISP API
 */
export class BTPay {
    private readonly apiKey: string;
    private readonly environment: 'sandbox' | 'production';
    private readonly client: AxiosInstance;
    private accessToken: string | null = null;

    /**
     * Creates a new BTPay client instance
     * @param options Configuration options for the API client
     */
    constructor(options: BTPayOptions) {
        this.apiKey = options.apiKey;
        this.environment = options.environment || 'sandbox';

        // Create Axios instance with base configuration
        this.client = axios.create({
            baseURL: this.getBaseUrl(),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to handle common headers and authentication
        this.client.interceptors.request.use(async (config) => {
            // Add authentication if token is available
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }

            return config;
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response) {
                    throw new ApiError(
                        `API Error: ${error.response.status}`,
                        error.response.status,
                        error.response.data
                    );
                } else if (error.request) {
                    throw new ApiError('No response received', 0, error.request);
                } else {
                    throw new ApiError('Request error', 0, error.message);
                }
            }
        );
    }

    /**
     * Get the base URL based on the environment
     * @returns The API base URL
     */
    private getBaseUrl(): string {
        return this.environment === 'production'
            ? 'https://api.apistorebt.ro/bt/prd/bt-psd2'
            : 'https://api.apistorebt.ro/bt/sb/bt-psd2';
    }

    /**
     * Authenticate with the API using OAuth2
     * @returns Promise resolving to the authentication success status
     */
    async authenticate(): Promise<boolean> {
        try {
            // Note: This is a simplified version - actual implementation would need to follow
            // the specific OAuth flow required by the BT API
            const response = await this.client.post('/oauth2/token', {
                grant_type: 'client_credentials',
                client_id: this.apiKey,
            });

            if (response.data?.access_token) {
                this.accessToken = response.data.access_token;
                return true;
            }

            return false;
        } catch (error) {
            console.error('Authentication failed:', error);
            throw new ApiError('Authentication failed', 401, error);
        }
    }

    /**
     * Initiate a payment transaction
     * @param params Payment creation parameters
     * @returns Promise resolving to payment initiation response
     */
    async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResponse> {
        const { paymentService, paymentProduct, payment, psuIpAddress } = params;

        // Generate a UUID for the request if not provided
        const requestId = params.requestId || uuidv4();

        try {
            const response = await this.client.post(
                `/v2/${paymentService}/${paymentProduct}`,
                payment,
                {
                    headers: {
                        'X-Request-ID': requestId,
                        'PSU-IP-Address': psuIpAddress || '127.0.0.1',
                        ...(params.psuGeoLocation && { 'PSU-Geo-Location': params.psuGeoLocation }),
                    },
                } as AxiosRequestConfig
            );

            return response.data as PaymentInitiationResponse;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to create payment', 0, error);
        }
    }

    /**
     * Get payment status
     * @param paymentId The ID of the payment
     * @param paymentService The payment service type
     * @param paymentProduct The payment product type
     * @returns Promise resolving to payment status
     */
    async getPaymentStatus(
        paymentId: string,
        paymentService: PaymentType = PaymentType.SINGLE,
        paymentProduct: string = 'ron-payment'
    ): Promise<PaymentStatusResponse> {
        const requestId = uuidv4();

        try {
            const response = await this.client.get(
                `/v2/${paymentService}/${paymentProduct}/${paymentId}/status`,
                {
                    headers: {
                        'X-Request-ID': requestId,
                    },
                }
            );

            return response.data as PaymentStatusResponse;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to get payment status', 0, error);
        }
    }

    /**
     * Get payment details
     * @param paymentId The ID of the payment
     * @param paymentService The payment service type
     * @param paymentProduct The payment product type
     * @returns Promise resolving to payment details
     */
    async getPaymentDetails(
        paymentId: string,
        paymentService: PaymentType = PaymentType.SINGLE,
        paymentProduct: string = 'ron-payment'
    ): Promise<any> {
        const requestId = uuidv4();

        try {
            const response = await this.client.get(
                `/v2/${paymentService}/${paymentProduct}/${paymentId}`,
                {
                    headers: {
                        'X-Request-ID': requestId,
                    },
                }
            );

            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to get payment details', 0, error);
        }
    }

    /**
     * Confirm a bulk payment
     * @param bulkPaymentId The bulk payment ID to confirm
     * @param paymentProduct The payment product (usually ron-payment)
     * @returns Promise resolving to the confirmation response
     */
    async confirmBulkPayment(
        bulkPaymentId: string,
        paymentProduct: string = 'ron-payment'
    ): Promise<any> {
        const requestId = uuidv4();

        try {
            const response = await this.client.post(
                `/v2/${PaymentType.BULK}/${paymentProduct}/confirmation`,
                {
                    paymentBulkId: bulkPaymentId
                },
                {
                    headers: {
                        'X-Request-ID': requestId,
                        'PSU-IP-Address': '127.0.0.1',
                    },
                }
            );

            return response.data;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError('Failed to confirm bulk payment', 0, error);
        }
    }
}