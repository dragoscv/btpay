# BTPay - BG PSD2 PISP API Client Library

A utility library for integrating with the BT - BG PSD2 PISP (Payment Initiation Service Provider) API in Lynx framework projects.

## Overview

BTPay provides a simple, efficient way to interact with the NextGenPSD2 Framework banking API. This library handles authentication, request formatting, and response parsing for payment initiation services.

## Features

- Simple API client for BT-BG PSD2 PISP API integration
- Support for RON and other currency payments
- Handles single payments, periodic payments, and bulk payments
- OAuth2 authentication flow integration
- Type-safe interfaces aligned with API specifications
- First-class support for Lynx framework projects
- Comprehensive error handling

## Installation

```bash
npm install btpay
```

## Usage

### Basic Payment Initiation

```javascript
import { BTPay, PaymentType, Currency } from "btpay";

// Initialize client
const btpay = new BTPay({
  apiKey: "YOUR_API_KEY",
  environment: "sandbox", // or 'production'
});

// Create a payment
const payment = await btpay.createPayment({
  paymentService: PaymentType.SINGLE,
  paymentProduct: "ron-payment",
  payment: {
    debtorAccount: {
      iban: "RO98BTRLRONCRT0ABCDEFGHI",
    },
    instructedAmount: {
      currency: Currency.RON,
      amount: "50",
    },
    creditorAccount: {
      iban: "RO98BTRLEURCRT0ABCDEFGHI",
    },
    creditorName: "Dan Popescu",
    debtorId: "RO12345",
    endToEndIdentification: "Test",
    remittanceInformationUnstructured: "explicatii",
  },
});

// Get payment status
const status = await btpay.getPaymentStatus(payment.paymentId);
```

### Integration with Lynx Framework

```javascript
import { useBTPay } from "btpay/lynx";

function PaymentComponent() {
  const { initiatePayment, paymentStatus, isLoading, error } = useBTPay();

  const handlePaymentSubmit = async () => {
    await initiatePayment({
      paymentProduct: "ron-payment",
      payment: {
        // payment details
      },
    });
  };

  return (
    <div>
      {isLoading ? <LoadingIndicator /> : null}
      {error ? <ErrorMessage message={error.message} /> : null}
      {paymentStatus ? <StatusDisplay status={paymentStatus} /> : null}
      <Button onClick={handlePaymentSubmit}>Make Payment</Button>
    </div>
  );
}
```

## API Reference

See [API Documentation](./docs/api.md) for complete reference.

## License

MIT
