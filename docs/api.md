# BTPay API Reference

This document describes the key components and usage of the BTPay library.

## Table of Contents

- [Core Client](#core-client)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Core Client

### BTPay

The main client for interacting with the BT-BG PSD2 PISP API.

#### Constructor

```typescript
constructor(options: BTPayOptions)
```

Creates a new BTPay client instance.

**Parameters**:

- `options`: Configuration options for the API client
  - `apiKey`: Your API key for authentication
  - `environment`: Either 'sandbox' or 'production'

**Example**:

```typescript
const btpay = new BTPay({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox',
});
```

#### Methods

##### authenticate

```typescript
async authenticate(): Promise<boolean>
```

Authenticates with the API using OAuth2.

**Returns**: A Promise resolving to a boolean indicating authentication success.

**Example**:

```typescript
const isAuthenticated = await btpay.authenticate();
```

##### createPayment

```typescript
async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResponse>
```

Initiates a payment transaction.

**Parameters**:

- `params`: Payment creation parameters
  - `paymentService`: Type of payment (single, periodic, bulk)
  - `paymentProduct`: Payment product (ron-payment, other-currency-payment)
  - `payment`: Payment details
  - `requestId` (optional): Custom request ID
  - `psuIpAddress` (optional): IP address of the end-user
  - `psuGeoLocation` (optional): Geolocation of the end-user

**Returns**: A Promise resolving to the payment initiation response.

**Example**:

```typescript
const payment = await btpay.createPayment({
  paymentService: PaymentType.SINGLE,
  paymentProduct: PaymentProduct.RON,
  payment: {
    debtorAccount: { iban: 'RO98BTRLRONCRT0ABCDEFGHI' },
    instructedAmount: { currency: Currency.RON, amount: '50' },
    creditorAccount: { iban: 'RO98BTRLEURCRT0ABCDEFGHI' },
    creditorName: 'Dan Popescu',
  },
});
```

##### getPaymentStatus

```typescript
async getPaymentStatus(
  paymentId: string,
  paymentService?: PaymentType,
  paymentProduct?: string
): Promise<PaymentStatusResponse>
```

Gets the status of a payment.

**Parameters**:

- `paymentId`: The ID of the payment
- `paymentService` (optional): The payment service type (default: PaymentType.SINGLE)
- `paymentProduct` (optional): The payment product type (default: 'ron-payment')

**Returns**: A Promise resolving to the payment status.

**Example**:

```typescript
const status = await btpay.getPaymentStatus(payment.paymentId);
```

##### getPaymentDetails

```typescript
async getPaymentDetails(
  paymentId: string,
  paymentService?: PaymentType,
  paymentProduct?: string
): Promise<any>
```

Gets the details of a payment.

**Parameters**:

- `paymentId`: The ID of the payment
- `paymentService` (optional): The payment service type (default: PaymentType.SINGLE)
- `paymentProduct` (optional): The payment product type (default: 'ron-payment')

**Returns**: A Promise resolving to the payment details.

**Example**:

```typescript
const details = await btpay.getPaymentDetails(payment.paymentId);
```

##### confirmBulkPayment

```typescript
async confirmBulkPayment(
  bulkPaymentId: string,
  paymentProduct?: string
): Promise<any>
```

Confirms a bulk payment.

**Parameters**:

- `bulkPaymentId`: The bulk payment ID to confirm
- `paymentProduct` (optional): The payment product (default: 'ron-payment')

**Returns**: A Promise resolving to the confirmation response.

**Example**:

```typescript
const confirmation = await btpay.confirmBulkPayment(bulkPaymentId);
```

## Data Types

### Enums

#### PaymentType

```typescript
enum PaymentType {
  SINGLE = 'payments',
  PERIODIC = 'periodic-payments',
  BULK = 'bulk-payments',
}
```

#### PaymentProduct

```typescript
enum PaymentProduct {
  RON = 'ron-payment',
  OTHER_CURRENCY = 'other-currency-payment',
}
```

#### Currency

```typescript
enum Currency {
  RON = 'RON',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
}
```

#### TransactionStatus

```typescript
enum TransactionStatus {
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
```

### Interfaces

#### Account

```typescript
interface Account {
  iban: string;
}
```

#### Amount

```typescript
interface Amount {
  currency: Currency;
  amount: string;
}
```

#### Address

```typescript
interface Address {
  country: string;
  city?: string;
  street?: string;
  buildingNumber?: string;
}
```

#### BTPaymentInitiationRon

```typescript
interface BTPaymentInitiationRon {
  debtorAccount?: Account;
  instructedAmount: Amount;
  creditorAccount: Account;
  creditorName: string;
  debtorId?: string;
  endToEndIdentification?: string;
  remittanceInformationUnstructured?: string;
}
```

#### BTPaymentInitiationVal

```typescript
interface BTPaymentInitiationVal {
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
```

## React Integration

The BTPay library includes React hooks for easier integration with React applications.

### useBTPay

A React hook that provides access to BTPay functionality.

```typescript
const {
  initiatePayment,
  getPaymentStatus,
  // ... other methods
} = useBTPay(config: BTPayConfig);
```

#### Parameters

- `config`: Configuration object (see [Configuration](#configuration))

#### Returns

An object containing all BTPay methods wrapped in React hooks.

## Error Handling

### ApiError

```typescript
class ApiError extends Error {
  status: number;
  data: any;
}
```

Custom error class for API errors.

**Properties**:

- `status`: HTTP status code
- `data`: Error data from API
- `message`: Error message

**Example**:

```typescript
try {
  await btpay.createPayment(params);
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.message}`);
    console.error(error.data);
  } else {
    console.error(`Error: ${error.message}`);
  }
}
```
