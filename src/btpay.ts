import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
    BTPayOptions,
    CreatePaymentParams,
    PaymentInitiationResponse,
    PaymentStatusResponse,
    PaymentType
} from './types';
import { ApiError, AuthenticationError, PaymentInitiationError, NetworkError } from './errors';
import { createLogger, Logger, LogLevel } from './utils/logger';

/**
 * Extended options for BTPay including authentication and logging
 */
export interface ExtendedBTPayOptions extends BTPayOptions {
    tokenRefreshIntervalMs?: number;
    autoRefreshToken?: boolean;
    logLevel?: LogLevel;
    logger?: Partial<Logger>;
}

/**
 * Main BTPay API client for interacting with BT-BG PSD2 PISP API
 */
export class BTPay {
    private readonly apiKey: string;
    private readonly environment: 'sandbox' | 'production';
    private readonly client: AxiosInstance;
    private accessToken: string | null = null;
    private tokenExpiry: number | null = null;
    private refreshTokenTimeout: NodeJS.Timeout | null = null;
    private readonly tokenRefreshIntervalMs: number;
    private readonly autoRefreshToken: boolean;
    private readonly logger: Logger;

    /**
     * Creates a new BTPay client instance
     * @param options Configuration options for the API client
     */
    constructor(options: ExtendedBTPayOptions) {
        this.apiKey = options.apiKey;
        this.environment = options.environment || 'sandbox';
        this.tokenRefreshIntervalMs = options.tokenRefreshIntervalMs || 3540000; // Default to 59 minutes (tokens usually expire in 1 hour)
        this.autoRefreshToken = options.autoRefreshToken !== false; // Default to true

        // Initialize logger
        this.logger = createLogger({
            level: options.logLevel || LogLevel.INFO,
            prefix: '[BTPay]',
            customLogger: options.logger
        });

        this.logger.debug('Initializing BTPay client', { environment: this.environment });

        // Create Axios instance with base configuration
        this.client = axios.create({
            baseURL: this.getBaseUrl(),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add request interceptor to handle common headers and authentication
        this.client.interceptors.request.use(async (config) => {
            // Check if token is about to expire and refresh if needed
            if (this.accessToken && this.tokenExpiry && Date.now() >= this.tokenExpiry) {
                this.logger.debug('Token expired or about to expire, refreshing...');
                await this.authenticate();
            }

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
                    if (error.response.status === 401) {
                        this.logger.warn('Authentication error', { status: error.response.status });
                        throw new AuthenticationError(
                            `Authentication Error: ${error.response.status}`,
                            error.response.status,
                            error.response.data
                        );
                    } else if (error.response.status >= 400 && error.response.status < 500) {
                        this.logger.warn('API client error', {
                            status: error.response.status,
                            data: error.response.data
                        });
                        throw new ApiError(
                            `API Error: ${error.response.status}`,
                            error.response.status,
                            error.response.data
                        );
                    } else {
                        this.logger.error('API server error', {
                            status: error.response.status,
                            data: error.response.data
                        });
                        throw new ApiError(
                            `API Server Error: ${error.response.status}`,
                            error.response.status,
                            error.response.data
                        );
                    }
                } else if (error.request) {
                    this.logger.error('Network error, no response received', { request: error.request });
                    throw new NetworkError('No response received from server');
                } else {
                    this.logger.error('Request setup error', { message: error.message });
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
     * Set up automatic token refresh
     * @param expiresIn Token expiration time in seconds
     */
    private setupTokenRefresh(expiresIn: number): void {
        // Clear any existing timeout
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = null;
        }

        if (!this.autoRefreshToken) {
            return;
        }

        // Calculate when to refresh (usually 1 minute before expiration)
        const refreshTime = Math.max(100, (expiresIn - 60) * 1000);
        this.tokenExpiry = Date.now() + (expiresIn * 1000);

        this.logger.debug(`Setting up token refresh in ${refreshTime}ms`);

        // Set up the refresh timeout
        this.refreshTokenTimeout = setTimeout(() => {
            this.logger.info('Refreshing authentication token');
            this.authenticate().catch(error => {
                this.logger.error('Failed to refresh token', { error });
            });
        }, refreshTime);
    }

    /**
     * Authenticate with the API using OAuth2
     * @returns Promise resolving to the authentication success status
     */
    async authenticate(): Promise<boolean> {
        try {
            this.logger.info('Authenticating with API');
            // Note: This is a simplified version - actual implementation would need to follow
            // the specific OAuth flow required by the BT API
            const response = await this.client.post('/oauth2/token', {
                grant_type: 'client_credentials',
                client_id: this.apiKey,
            });

            if (response.data?.access_token) {
                this.accessToken = response.data.access_token;

                // Setup token refresh if expiry information is available
                if (response.data.expires_in) {
                    this.setupTokenRefresh(response.data.expires_in);
                } else {
                    // Default to 1 hour if no expiry provided
                    this.setupTokenRefresh(3600);
                }

                this.logger.info('Authentication successful');
                return true;
            }

            this.logger.warn('Authentication failed: No access token in response');
            return false;
        } catch (error) {
            this.logger.error('Authentication failed', { error });
            throw new AuthenticationError('Authentication failed', 401, error);
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

        this.logger.info('Creating payment', {
            paymentService,
            paymentProduct,
            requestId
        });
        this.logger.debug('Payment details', { payment });

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

            this.logger.info('Payment created successfully', {
                paymentId: response.data.paymentId,
                status: response.data.transactionStatus
            });

            return response.data as PaymentInitiationResponse;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new PaymentInitiationError('Failed to create payment', 0, error);
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

    /**
     * Clean up resources used by the client
     */
    dispose(): void {
        if (this.refreshTokenTimeout) {
            clearTimeout(this.refreshTokenTimeout);
            this.refreshTokenTimeout = null;
        }
        this.logger.debug('BTPay client resources disposed');
    }
}