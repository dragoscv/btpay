import React from 'react';
import { BTPayOptions, PaymentProduct } from '../types';
import { BTPayProvider, useBTPayContext } from './context';
import { useBTPay, usePayment, usePaymentError } from './hooks';

/**
 * Props for BTPayInitializer component
 */
interface BTPayInitializerProps {
    apiKey: string;
    environment?: 'sandbox' | 'production';
    children: React.ReactNode;
}

/**
 * Component that initializes the BTPay API client
 */
export const BTPayInitializer: React.FC<BTPayInitializerProps> = ({
    apiKey,
    environment = 'sandbox',
    children
}) => {
    const options: BTPayOptions = {
        apiKey,
        environment
    };

    return (
        <BTPayProvider options={options}>
            {children}
        </BTPayProvider>
    );
};

/**
 * Props for PaymentButton component
 */
interface PaymentButtonProps {
    paymentProduct: PaymentProduct | string;
    paymentData: any;
    onSuccess?: (response: any) => void;
    onError?: (error: Error) => void;
    onStatusChange?: (status: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

/**
 * Button component that initiates a payment when clicked
 */
export const PaymentButton: React.FC<PaymentButtonProps> = ({
    paymentProduct,
    paymentData,
    onSuccess,
    onError,
    onStatusChange,
    disabled = false,
    children,
    style,
    className
}) => {
    const { isLoading, error, initiatePayment } = useBTPay();

    const handleClick = async () => {
        try {
            const response = await initiatePayment({
                paymentProduct,
                payment: paymentData
            });

            if (response && onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            if (onError && err instanceof Error) {
                onError(err);
            }
        }
    };

    // Call onError when error changes
    React.useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    return (
        <button
            onClick={handleClick}
            disabled={disabled || isLoading}
            style={style}
            className={className}
        >
            {isLoading ? 'Processing...' : children || 'Pay Now'}
        </button>
    );
};

/**
 * Props for PaymentStatus component
 */
interface PaymentStatusProps {
    paymentId?: string;
    pollingInterval?: number;
    pollingAttempts?: number;
    onStatusChange?: (status: string) => void;
    renderStatus?: (status: string | null, isLoading: boolean) => React.ReactNode;
}

/**
 * Component that displays and manages the payment status
 */
export const PaymentStatus: React.FC<PaymentStatusProps> = ({
    paymentId,
    pollingInterval = 3000,
    pollingAttempts = 10,
    onStatusChange,
    renderStatus
}) => {
    const {
        checkStatus,
        startPolling,
        paymentStatus,
        isLoading,
        isPolling
    } = usePayment(pollingInterval, pollingAttempts);

    // Start polling or check status once if paymentId is provided
    React.useEffect(() => {
        if (paymentId) {
            // Just check once if we're not already polling
            if (!isPolling) {
                checkStatus(paymentId);
                startPolling();
            }
        }
    }, [paymentId, checkStatus, startPolling, isPolling]);

    // Call onStatusChange when status changes
    React.useEffect(() => {
        if (paymentStatus && onStatusChange) {
            onStatusChange(paymentStatus.transactionStatus.toString());
        }
    }, [paymentStatus, onStatusChange]);

    // Default renderer for the status
    const defaultRender = (status: string | null, loading: boolean) => {
        if (loading) return <div>Checking payment status...</div>;
        if (!status) return <div>No status available</div>;

        return <div>Payment Status: {status}</div>;
    };

    const statusToShow = paymentStatus ? paymentStatus.transactionStatus.toString() : null;
    const render = renderStatus || defaultRender;

    return <>{render(statusToShow, isLoading)}</>;
};

/**
 * Props for ErrorDisplay component
 */
interface ErrorDisplayProps {
    renderError?: (errorMessage: string, errorCode?: string) => React.ReactNode;
}

/**
 * Component that displays payment errors
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    renderError
}) => {
    const { errorDetails, hasError } = usePaymentError();

    // Default renderer for errors
    const defaultRender = (message: string, code?: string) => {
        return (
            <div style={{ color: 'red', margin: '10px 0' }}>
                <strong>Error{code ? ` (${code})` : ''}:</strong> {message}
            </div>
        );
    };

    if (!hasError || !errorDetails) {
        return null;
    }

    const render = renderError || defaultRender;
    return <>{render(errorDetails.message, errorDetails.code)}</>;
};