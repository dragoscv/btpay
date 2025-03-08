import { useCallback, useEffect, useState } from 'react';
import { useBTPayContext } from './context';
import {
    PaymentInitiationResponse,
    PaymentStatusResponse,
    CreatePaymentParams
} from '../types';
import { ApiError } from '../errors';

/**
 * Hook for using BTPay client in Lynx applications
 */
export const useBTPay = () => {
    const {
        isInitialized,
        isAuthenticated,
        isLoading,
        error,
        paymentResponse,
        paymentStatus,
        authenticate,
        initiatePayment,
        getStatus,
        reset
    } = useBTPayContext();

    return {
        isInitialized,
        isAuthenticated,
        isLoading,
        error,
        paymentResponse,
        paymentStatus,
        authenticate,
        initiatePayment,
        getPaymentStatus: getStatus,
        reset
    };
};

/**
 * Hook for payment initiation with automatic status polling
 */
export const usePayment = (
    pollingIntervalMs: number = 3000,
    maxPolls: number = 10
) => {
    const {
        isLoading,
        error,
        initiatePayment,
        getStatus,
        paymentResponse,
        paymentStatus,
        reset
    } = useBTPayContext();

    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [pollingCount, setPollingCount] = useState(0);
    const [isPolling, setIsPolling] = useState(false);

    // Function to initiate a payment
    const createPayment = useCallback(async (
        params: Omit<CreatePaymentParams, 'paymentService'>
    ) => {
        reset();
        setPollingCount(0);

        try {
            const response = await initiatePayment(params);
            if (response && response.paymentId) {
                setPaymentId(response.paymentId);
                return response;
            }
            return null;
        } catch (err) {
            console.error('Payment initiation failed:', err);
            return null;
        }
    }, [initiatePayment, reset]);

    // Function to check payment status once
    const checkStatus = useCallback(async (id?: string) => {
        const payId = id || paymentId;
        if (!payId) return null;

        try {
            return await getStatus(payId);
        } catch (err) {
            console.error('Status check failed:', err);
            return null;
        }
    }, [paymentId, getStatus]);

    // Effect for automatic polling of payment status
    useEffect(() => {
        let pollTimer: NodeJS.Timeout | null = null;

        const pollStatus = async () => {
            if (!paymentId || pollingCount >= maxPolls || !isPolling) {
                setIsPolling(false);
                return;
            }

            try {
                await checkStatus();
                setPollingCount(prev => prev + 1);

                // If we have a final status, stop polling
                if (paymentStatus && ['ACSC', 'RJCT', 'CANC'].includes(paymentStatus.transactionStatus as string)) {
                    setIsPolling(false);
                    return;
                }

                // Schedule the next poll
                pollTimer = setTimeout(pollStatus, pollingIntervalMs);
            } catch (err) {
                console.error('Polling error:', err);
                setIsPolling(false);
            }
        };

        // Start polling if we have a payment ID and we're not already polling
        if (paymentId && !isPolling && pollingCount < maxPolls) {
            setIsPolling(true);
            pollStatus();
        }

        // Clean up the timer on unmount or when dependencies change
        return () => {
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [paymentId, isPolling, pollingCount, maxPolls, pollingIntervalMs, checkStatus, paymentStatus]);

    // Function to start or restart status polling
    const startPolling = useCallback(() => {
        if (paymentId) {
            setPollingCount(0);
            setIsPolling(true);
        }
    }, [paymentId]);

    // Function to stop status polling
    const stopPolling = useCallback(() => {
        setIsPolling(false);
    }, []);

    return {
        createPayment,
        checkStatus,
        startPolling,
        stopPolling,
        paymentId,
        paymentResponse,
        paymentStatus,
        isLoading,
        isPolling,
        error,
        reset
    };
};

/**
 * Hook for managing payment errors
 */
export const usePaymentError = () => {
    const { error } = useBTPayContext();
    const [errorDetails, setErrorDetails] = useState<{
        message: string;
        code?: string;
        isRecoverable: boolean;
    } | null>(null);

    useEffect(() => {
        if (!error) {
            setErrorDetails(null);
            return;
        }

        let isRecoverable = false;
        let errorCode: string | undefined = undefined;

        // Handle ApiError specifically
        if (error instanceof ApiError) {
            const { status, data } = error;

            // Recoverable errors are typically 4xx status codes except 401, 403
            isRecoverable = status >= 400 && status < 500 && status !== 401 && status !== 403;

            // Extract error code if available in the response data
            if (data && typeof data === 'object') {
                if (Array.isArray(data.tppMessages) && data.tppMessages.length > 0) {
                    errorCode = data.tppMessages[0].code;
                }
            }
        } else {
            // For other errors, generic handling
            isRecoverable = false;
        }

        setErrorDetails({
            message: error.message,
            code: errorCode,
            isRecoverable
        });
    }, [error]);

    return {
        error,
        errorDetails,
        hasError: !!error
    };
};