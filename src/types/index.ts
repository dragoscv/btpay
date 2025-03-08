/**
 * Types for BT-BG PSD2 PISP API
 */

export enum PaymentType {
    SINGLE = 'payments',
    PERIODIC = 'periodic-payments',
    BULK = 'bulk-payments',
}

export enum PaymentProduct {
    RON = 'ron-payment',
    OTHER_CURRENCY = 'other-currency-payment',
}

export enum Currency {
    RON = 'RON',
    EUR = 'EUR',
    USD = 'USD',
    GBP = 'GBP',
}

export enum TransactionStatus {
    RCVD = 'RCVD', // Received
    ACTC = 'ACTC', // AcceptedTechnicalValidation
    ACCP = 'ACCP', // AcceptedCustomerProfile
    ACWC = 'ACWC', // AcceptedWithChange
    ACFC = 'ACFC', // AcceptedFundsChecked
    ACSC = 'ACSC', // AcceptedSettlementCompleted
    RJCT = 'RJCT', // Rejected
    PDNG = 'PDNG', // Pending
    CANC = 'CANC', // Cancelled
}

export interface Account {
    iban: string;
}

export interface Amount {
    currency: Currency;
    amount: string;
}

export interface Address {
    country: string;
    city?: string;
    street?: string;
    buildingNumber?: string;
}

export interface BTPaymentInitiationRon {
    debtorAccount?: Account;
    instructedAmount: Amount;
    creditorAccount: Account;
    creditorName: string;
    debtorId?: string;
    endToEndIdentification?: string;
    remittanceInformationUnstructured?: string;
}

export interface BTPaymentInitiationVal {
    debtorAccount?: Account;
    instructedAmount: Amount;
    creditorAccount: Account;
    creditorAgent: string; // BIC/SWIFT
    creditorAgentName: string; // Creditor Bank Name
    creditorName: string;
    creditorAddress: Address;
    endToEndIdentification?: string;
    remittanceInformationUnstructured?: string;
}

export interface PaymentInitiationResponse {
    paymentId: string;
    transactionStatus: string;
    psuMessage?: string;
    tppMessages?: Array<{
        category: string;
        code: string;
        text: string;
    }>;
    _links?: {
        scaOAuth?: {
            href: string;
        };
        self?: {
            href: string;
        };
        status?: {
            href: string;
        };
        [key: string]: { href: string } | undefined;
    };
}

export interface PaymentStatusResponse {
    transactionStatus: TransactionStatus | string;
}

export interface BTPay {
    apiKey: string;
    environment: 'sandbox' | 'production';
}

export interface BTPayOptions {
    apiKey: string;
    environment: 'sandbox' | 'production';
}

export interface CreatePaymentParams {
    paymentService: PaymentType;
    paymentProduct: PaymentProduct | string;
    payment: BTPaymentInitiationRon | BTPaymentInitiationVal;
    requestId?: string;
    psuIpAddress?: string;
    psuGeoLocation?: string;
}

export interface BulkPayment {
    instructedAmount: Amount;
    creditorAccount: Account;
    creditorName: string;
    debtorId?: string;
    endToEndIdentification?: string;
    remittanceInformationUnstructured?: string;
}

export interface BTBulkPaymentInitiationRon {
    debtorAccount?: Account;
    payments: BulkPayment[];
}

export interface BTBulkPaymentConfirmation {
    paymentBulkId: string;
}