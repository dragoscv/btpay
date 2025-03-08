import axios from 'axios';
import { BTPay } from '../src/btpay';
import { PaymentType, PaymentProduct, Currency } from '../src/types';
import { ApiError } from '../src/errors';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BTPay', () => {
    beforeEach(() => {
        // Setup axios mocks
        mockedAxios.create.mockReturnValue(mockedAxios as any);
        mockedAxios.interceptors = {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        } as any;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a BTPay instance with correct options', () => {
        const btpay = new BTPay({
            apiKey: 'test-api-key',
            environment: 'sandbox'
        });

        expect(btpay).toBeDefined();
        expect(mockedAxios.create).toHaveBeenCalledWith(expect.objectContaining({
            baseURL: 'https://api.apistorebt.ro/bt/sb/bt-psd2',
            headers: expect.objectContaining({
                'Content-Type': 'application/json',
            }),
        }));
    });

    it('should authenticate with the API successfully', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { access_token: 'mock-token' }
        });

        const btpay = new BTPay({
            apiKey: 'test-api-key',
            environment: 'sandbox'
        });

        const result = await btpay.authenticate();

        expect(result).toBe(true);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            '/oauth2/token',
            expect.objectContaining({
                grant_type: 'client_credentials',
                client_id: 'test-api-key'
            })
        );
    });

    it('should handle authentication failure', async () => {
        mockedAxios.post.mockRejectedValueOnce(new Error('Authentication failed'));

        const btpay = new BTPay({
            apiKey: 'test-api-key',
            environment: 'sandbox'
        });

        await expect(btpay.authenticate()).rejects.toThrow(ApiError);
    });

    it('should create a payment successfully', async () => {
        const mockPaymentResponse = {
            paymentId: 'mock-payment-id',
            transactionStatus: 'RCVD'
        };

        mockedAxios.post.mockResolvedValueOnce({ data: mockPaymentResponse });

        const btpay = new BTPay({
            apiKey: 'test-api-key',
            environment: 'sandbox'
        });

        const result = await btpay.createPayment({
            paymentService: PaymentType.SINGLE,
            paymentProduct: PaymentProduct.RON,
            payment: {
                instructedAmount: {
                    currency: Currency.RON, // Changed from string "RON" to Currency.RON enum
                    amount: '100'
                },
                creditorAccount: {
                    iban: 'RO98BTRLEURCRT0ABCDEFGHI'
                },
                creditorName: 'Test Recipient'
            }
        });

        expect(result).toEqual(mockPaymentResponse);
        expect(mockedAxios.post).toHaveBeenCalledWith(
            `/v2/${PaymentType.SINGLE}/${PaymentProduct.RON}`,
            expect.anything(),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Request-ID': expect.any(String),
                    'PSU-IP-Address': '127.0.0.1'
                })
            })
        );
    });

    it('should get payment status successfully', async () => {
        const mockStatusResponse = {
            transactionStatus: 'ACSC'
        };

        mockedAxios.get.mockResolvedValueOnce({ data: mockStatusResponse });

        const btpay = new BTPay({
            apiKey: 'test-api-key',
            environment: 'sandbox'
        });

        const result = await btpay.getPaymentStatus('mock-payment-id');

        expect(result).toEqual(mockStatusResponse);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/v2/${PaymentType.SINGLE}/ron-payment/mock-payment-id/status`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Request-ID': expect.any(String)
                })
            })
        );
    });
});