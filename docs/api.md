# BTPay API Reference

This document describes the key components and usage of the BTPay library.

## Table of Contents

- [Core Client](#core-client)
- [Data Types](#data-types)
- [Lynx Integration](#lynx-integration)
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

## Lynx Integration

The BTPay library includes React hooks and components for easier integration with the Lynx framework.

### Hooks

#### useBTPay

```typescript
const useBTPay = () => {
  // Returns the BTPay context with methods and state
};
```

Provides access to the BTPay client methods and state.

**Returns**:

- `isInitialized`: Whether the client is initialized
- `isAuthenticated`: Whether the client is authenticated
- `isLoading`: Whether an operation is in progress
- `error`: Any error that occurred
- `paymentResponse`: The last payment initiation response
- `paymentStatus`: The last payment status
- `authenticate`: Function to authenticate
- `initiatePayment`: Function to initiate a payment
- `getPaymentStatus`: Function to get payment status
- `reset`: Function to reset state

**Example**:

```typescript
const { initiatePayment, paymentStatus, isLoading, error } = useBTPay();
```

#### usePayment

```typescript
const usePayment = (pollingIntervalMs?: number, maxPolls?: number) => {
  // Returns payment functionality with automatic status polling
};
```

Provides payment functionality with automatic status polling.

**Parameters**:

- `pollingIntervalMs` (optional): Interval between status polls in ms (default: 3000)
- `maxPolls` (optional): Maximum number of status polls (default: 10)

**Returns**:

- `createPayment`: Function to create a payment
- `checkStatus`: Function to check payment status once
- `startPolling`: Function to start status polling
- `stopPolling`: Function to stop status polling
- `paymentId`: The current payment ID
- `paymentResponse`: The payment initiation response
- `paymentStatus`: The payment status
- `isLoading`: Whether an operation is in progress
- `isPolling`: Whether status polling is active
- `error`: Any error that occurred
- `reset`: Function to reset state

**Example**:

```typescript
const { createPayment, paymentStatus, isPolling } = usePayment(2000, 5);
```

#### usePaymentError

```typescript
const usePaymentError = () => {
  // Returns payment error handling functionality
};
```

Provides payment error handling functionality.

**Returns**:

- `error`: The raw error
- `errorDetails`: Structured error details
- `hasError`: Whether an error exists

**Example**:

```typescript
const { errorDetails, hasError } = usePaymentError();
```

### Components

#### BTPayInitializer

```typescript
<BTPayInitializer apiKey="YOUR_API_KEY" environment="sandbox">
  {/* Your app content */}
</BTPayInitializer>
```

Initializes the BTPay client.

**Props**:

- `apiKey`: Your API key for authentication
- `environment` (optional): Either 'sandbox' or 'production' (default: 'sandbox')
- `children`: Your app content

#### PaymentButton

```typescript
<PaymentButton
  paymentProduct="ron-payment"
  paymentData={paymentData}
  onSuccess={handleSuccess}
  onError={handleError}
>
  Make Payment
</PaymentButton>
```

Button that initiates a payment when clicked.

**Props**:

- `paymentProduct`: Payment product
- `paymentData`: Payment data
- `onSuccess` (optional): Callback for successful payment
- `onError` (optional): Callback for payment error
- `onStatusChange` (optional): Callback for status changes
- `disabled` (optional): Whether the button is disabled
- `children` (optional): Button content (default: 'Pay Now')
- `style` (optional): Button style
- `className` (optional): Button class name

#### PaymentStatus

```typescript
<PaymentStatus
  paymentId={paymentId}
  pollingInterval={3000}
  pollingAttempts={10}
  onStatusChange={handleStatusChange}
  renderStatus={(status, isLoading) => (
    <div>{isLoading ? 'Loading...' : `Status: ${status}`}</div>
  )}
/>
```

Component that displays and manages payment status.

**Props**:

- `paymentId` (optional): Payment ID to check
- `pollingInterval` (optional): Interval between status polls in ms (default: 3000)
- `pollingAttempts` (optional): Maximum number of status polls (default: 10)
- `onStatusChange` (optional): Callback for status changes
- `renderStatus` (optional): Custom renderer for status display

#### ErrorDisplay

```typescript
<ErrorDisplay
  renderError={(message, code) => (
    <div className="error">Error {code}: {message}</div>
  )}
/>
```

Component that displays payment errors.

**Props**:

- `renderError` (optional): Custom renderer for error display

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
