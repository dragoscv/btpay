import { renderHook, act } from '@testing-library/react';
import { useBTPay } from '../../src/hooks/useBTPay';
import { BTPay } from '../../src/btpay';
import { PaymentType, PaymentProduct, Currency } from '../../src/types';

// Create mock functions
const mockAuthenticate = jest.fn();
const mockCreatePayment = jest.fn();
const mockGetPaymentStatus = jest.fn();
const mockDispose = jest.fn();

// Mock the BTPay class
jest.mock('../../src/btpay', () => ({
    BTPay: jest.fn().mockImplementation(() => ({
        authenticate: mockAuthenticate,
        createPayment: mockCreatePayment,
        getPaymentStatus: mockGetPaymentStatus,
        dispose: mockDispose
    }))
}));

describe('useBTPay', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        mockAuthenticate.mockResolvedValue(true);
        mockCreatePayment.mockResolvedValue({
            paymentId: 'test-payment-id',
            transactionStatus: 'RCVD'
        });
        mockGetPaymentStatus.mockResolvedValue({
            transactionStatus: 'ACSC'
        });
    });

    afterEach(() => {
        // Ensure no timers or async operations are pending
        jest.clearAllTimers();
    });

    it('should initialize the BTPay client and auto authenticate', async () => {
        const { result, unmount } = renderHook(() =>
            useBTPay({ apiKey: 'test-api-key', environment: 'sandbox' }, true)
        );

        // Initially should be loading
        expect(result.current.isLoading).toBe(true);

        // Wait for authentication to complete
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve(); // Second resolve for state updates
        });

        // Check final state
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.isLoading).toBe(false);
        expect(mockAuthenticate).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('should not auto authenticate when disabled', () => {
        const { result, unmount } = renderHook(() =>
            useBTPay({ apiKey: 'test-api-key', environment: 'sandbox' }, false)
        );

        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(mockAuthenticate).not.toHaveBeenCalled();

        unmount();
    });

    it('should handle initiate payment', async () => {
        const { result, unmount } = renderHook(() =>
            useBTPay({ apiKey: 'test-api-key', environment: 'sandbox' }, true)
        );

        // Wait for authentication
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Perform payment
        let paymentResult;
        await act(async () => {
            paymentResult = await result.current.initiatePayment({
                paymentService: PaymentType.SINGLE,
                paymentProduct: PaymentProduct.RON,
                payment: {
                    instructedAmount: {
                        currency: Currency.RON,
                        amount: '100'
                    },
                    creditorAccount: {
                        iban: 'RO98BTRLEURCRT0ABCDEFGHI'
                    },
                    creditorName: 'Test Recipient'
                }
            });
        });

        expect(paymentResult).toEqual({
            paymentId: 'test-payment-id',
            transactionStatus: 'RCVD'
        });
        expect(mockCreatePayment).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('should handle get payment status', async () => {
        const { result, unmount } = renderHook(() =>
            useBTPay({ apiKey: 'test-api-key', environment: 'sandbox' }, true)
        );

        // Wait for authentication
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Get payment status
        let statusResult;
        await act(async () => {
            statusResult = await result.current.getPaymentStatus('test-payment-id');
        });

        expect(statusResult).toEqual({
            transactionStatus: 'ACSC'
        });
        expect(mockGetPaymentStatus).toHaveBeenCalledTimes(1);

        unmount();
    });

    it('should handle errors', async () => {
        mockAuthenticate.mockRejectedValueOnce(new Error('Authentication failed'));

        const { result, unmount } = renderHook(() =>
            useBTPay({ apiKey: 'test-api-key', environment: 'sandbox' }, true)
        );

        // Initially should be loading
        expect(result.current.isLoading).toBe(true);

        // Wait for authentication to fail
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Check error state
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Authentication failed');
        expect(result.current.isLoading).toBe(false);

        unmount();
    });
});
