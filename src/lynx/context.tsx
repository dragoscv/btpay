import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BTPay } from '../btpay';
import {
    BTPayOptions,
    PaymentInitiationResponse,
    PaymentStatusResponse,
    CreatePaymentParams,
    PaymentType
} from '../types';
import { ApiError } from '../errors';

interface BTPayContextValue {
    client: BTPay | null;
    isInitialized: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: ApiError | Error | null;
    paymentResponse: PaymentInitiationResponse | null;
    paymentStatus: PaymentStatusResponse | null;
    initialize: (options: BTPayOptions) => void;
    authenticate: () => Promise<boolean>;
    initiatePayment: (params: Omit<CreatePaymentParams, 'paymentService'>) => Promise<PaymentInitiationResponse | null>;
    getStatus: (paymentId: string) => Promise<PaymentStatusResponse | null>;
    reset: () => void;
}

const BTPayContext = createContext<BTPayContextValue | null>(null);

interface BTPayProviderProps {
    children: ReactNode;
    options?: BTPayOptions;
}

export const BTPayProvider: React.FC<BTPayProviderProps> = ({
    children,
    options
}) => {
    const [client, setClient] = useState<BTPay | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<ApiError | Error | null>(null);
    const [paymentResponse, setPaymentResponse] = useState<PaymentInitiationResponse | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);

    // Initialize client if options are provided
    useEffect(() => {
        if (options) {
            initialize(options);
        }
    }, [options]);

    const initialize = (btpayOptions: BTPayOptions) => {
        try {
            const btpayClient = new BTPay(btpayOptions);
            setClient(btpayClient);
            setIsInitialized(true);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to initialize BTPay client'));
            setIsInitialized(false);
        }
    };

    const authenticate = async (): Promise<boolean> => {
        if (!client) {
            setError(new Error('BTPay client not initialized'));
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const authenticated = await client.authenticate();
            setIsAuthenticated(authenticated);
            return authenticated;
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Authentication failed'));
            setIsAuthenticated(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const initiatePayment = async (
        params: Omit<CreatePaymentParams, 'paymentService'>
    ): Promise<PaymentInitiationResponse | null> => {
        if (!client) {
            setError(new Error('BTPay client not initialized'));
            return null;
        }

        if (!isAuthenticated) {
            try {
                const authenticated = await authenticate();
                if (!authenticated) {
                    setError(new Error('Authentication required before initiating payment'));
                    return null;
                }
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Authentication failed'));
                return null;
            }
        }

        setIsLoading(true);
        setError(null);
        setPaymentResponse(null);

        try {
            const fullParams: CreatePaymentParams = {
                ...params,
                paymentService: PaymentType.SINGLE, // Default to single payments
            };

            const response = await client.createPayment(fullParams);
            setPaymentResponse(response);
            return response;
        } catch (err) {
            setError(err instanceof ApiError ? err : new Error('Failed to initiate payment'));
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const getStatus = async (
        paymentId: string
    ): Promise<PaymentStatusResponse | null> => {
        if (!client) {
            setError(new Error('BTPay client not initialized'));
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const status = await client.getPaymentStatus(paymentId);
            setPaymentStatus(status);
            return status;
        } catch (err) {
            setError(err instanceof ApiError ? err : new Error('Failed to get payment status'));
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setPaymentResponse(null);
        setPaymentStatus(null);
        setError(null);
    };

    const contextValue: BTPayContextValue = {
        client,
        isInitialized,
        isAuthenticated,
        isLoading,
        error,
        paymentResponse,
        paymentStatus,
        initialize,
        authenticate,
        initiatePayment,
        getStatus,
        reset
    };

    return (
        <BTPayContext.Provider value={contextValue}>
            {children}
        </BTPayContext.Provider>
    );
};

export const useBTPayContext = (): BTPayContextValue => {
    const context = useContext(BTPayContext);

    if (!context) {
        throw new Error('useBTPayContext must be used within a BTPayProvider');
    }

    return context;
};