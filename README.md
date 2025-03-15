# BTPay

A utility library for integrating with the BT - BG PSD2 PISP (Payment Initiation Service Provider) API in React or vanilla JavaScript projects.

## Overview

BTPay provides a simple, efficient way to interact with the NextGenPSD2 Framework banking API. This library handles authentication, request formatting, and response parsing for payment initiation services.

## Features

- Simple API for integrating BT-BG PSD2 PISP services
- Secure payment flow implementation
- Comprehensive TypeScript support
- React hooks for easier integration
- Zero dependencies except for axios
- Built with TypeScript for better developer experience

## Installation

```bash
npm install @dragoscatalin/btpay
```

## Usage

### Basic Payment Initiation

```javascript
import { BTPay, PaymentType, Currency } from '@dragoscatalin/btpay';

// Initialize client
const btpay = new BTPay({
  apiKey: 'YOUR_API_KEY',
  environment: 'sandbox', // or 'production'
});

// Create a payment
const payment = await btpay.createPayment({
  paymentService: PaymentType.SINGLE,
  paymentProduct: 'ron-payment',
  payment: {
    debtorAccount: {
      iban: 'RO98BTRLRONCRT0ABCDEFGHI',
    },
    instructedAmount: {
      currency: Currency.RON,
      amount: '50',
    },
    creditorAccount: {
      iban: 'RO98BTRLEURCRT0ABCDEFGHI',
    },
    creditorName: 'Dan Popescu',
    debtorId: 'RO12345',
    endToEndIdentification: 'Test',
    remittanceInformationUnstructured: 'explicatii',
  },
});

// Get payment status
const status = await btpay.getPaymentStatus(payment.paymentId);
```

### With React Hooks

```typescript
import { useBTPay } from '@dragoscatalin/btpay';

function PaymentComponent() {
  const { initiatePayment } = useBTPay({
    // configuration options
  });

  // Use the hook methods
}
```

### Vanilla JavaScript

```typescript
import { BTPay } from '@dragoscatalin/btpay';

const btpay = new BTPay({
  // configuration options
});

// Use the instance methods
```

## API Reference

See [API Documentation](./docs/api.md) for complete reference.

## License

MIT
