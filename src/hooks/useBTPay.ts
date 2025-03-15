import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { BTPay } from '../btpay';
import {
    BTPayOptions,
    CreatePaymentParams,
    PaymentInitiationResponse,
    PaymentType,
    PaymentStatusResponse
} from '../types';
import { ApiError } from '../errors';

export interface UseBTPayHookResult {
    client: BTPay | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: Error | null;
    initiatePayment: (params: CreatePaymentParams) => Promise<PaymentInitiationResponse>;
    getPaymentStatus: (
        paymentId: string,
        paymentService?: PaymentType,
        paymentProduct?: string
    ) => Promise<PaymentStatusResponse>;
    getPaymentDetails: (
        paymentId: string,
        paymentService?: PaymentType,
        paymentProduct?: string
    ) => Promise<any>;
    confirmBulkPayment: (
        bulkPaymentId: string,
        paymentProduct?: string
    ) => Promise<any>;
}

export const useBTPay = (
    options: BTPayOptions,
    autoAuthenticate = true
): UseBTPayHookResult => {
    const isMountedRef = useRef(true);
    const btpayClientRef = useRef<BTPay | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initialize client only once
    useEffect(() => {
        btpayClientRef.current = new BTPay(options);

        return () => {
            if (btpayClientRef.current) {
                btpayClientRef.current.dispose();
                btpayClientRef.current = null;
            }
        };
    }, [options]);

    // Handle authentication
    useEffect(() => {
        if (!btpayClientRef.current || !autoAuthenticate) return;

        let isSubscribed = true;
        setIsLoading(true);
        setError(null);

        btpayClientRef.current
            .authenticate()
            .then((success) => {
                if (isSubscribed && isMountedRef.current) {
                    setIsAuthenticated(success);
                    if (!success) {
                        setError(new Error('Authentication failed'));
                    }
                }
            })
            .catch((err) => {
                if (isSubscribed && isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setIsAuthenticated(false);
                }
            })
            .finally(() => {
                if (isSubscribed && isMountedRef.current) {
                    setIsLoading(false);
                }
            });

        return () => {
            isSubscribed = false;
        };
    }, [autoAuthenticate]);

    // Cleanup mounted ref on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const initiatePayment = useCallback(
        async (params: CreatePaymentParams): Promise<PaymentInitiationResponse> => {
            if (!btpayClientRef.current) {
                throw new Error('BTPay client not initialized');
            }

            try {
                setIsLoading(true);
                const result = await btpayClientRef.current.createPayment(params);
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
                return result;
            } catch (err) {
                if (isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setIsLoading(false);
                }
                throw err;
            }
        },
        []
    );

    const getPaymentStatus = useCallback(
        async (
            paymentId: string,
            paymentService?: PaymentType,
            paymentProduct?: string
        ): Promise<PaymentStatusResponse> => {
            if (!btpayClientRef.current) {
                throw new Error('BTPay client not initialized');
            }

            try {
                setIsLoading(true);
                const result = await btpayClientRef.current.getPaymentStatus(
                    paymentId,
                    paymentService,
                    paymentProduct
                );
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
                return result;
            } catch (err) {
                if (isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setIsLoading(false);
                }
                throw err;
            }
        },
        []
    );

    const getPaymentDetails = useCallback(
        async (
            paymentId: string,
            paymentService?: PaymentType,
            paymentProduct?: string
        ): Promise<any> => {
            if (!btpayClientRef.current) {
                throw new Error('BTPay client not initialized');
            }

            try {
                setIsLoading(true);
                const result = await btpayClientRef.current.getPaymentDetails(
                    paymentId,
                    paymentService,
                    paymentProduct
                );
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
                return result;
            } catch (err) {
                if (isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setIsLoading(false);
                }
                throw err;
            }
        },
        []
    );

    const confirmBulkPayment = useCallback(
        async (bulkPaymentId: string, paymentProduct?: string): Promise<any> => {
            if (!btpayClientRef.current) {
                throw new Error('BTPay client not initialized');
            }

            try {
                setIsLoading(true);
                const result = await btpayClientRef.current.confirmBulkPayment(
                    bulkPaymentId,
                    paymentProduct
                );
                if (isMountedRef.current) {
                    setIsLoading(false);
                }
                return result;
            } catch (err) {
                if (isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setIsLoading(false);
                }
                throw err;
            }
        },
        []
    );

    return {
        client: btpayClientRef.current,
        isAuthenticated,
        isLoading,
        error,
        initiatePayment,
        getPaymentStatus,
        getPaymentDetails,
        confirmBulkPayment,
    };
};
