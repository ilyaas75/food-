import crypto from 'crypto';

const WAAFI_BASE_URL =
    process.env.WAAFI_BASE_URL || 'https://sandbox.waafipay.com/asm';

const waafiTimestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 23);
const isProduction = process.env.NODE_ENV === 'production';

const buildWaafiPayload = (serviceName, serviceParams) => ({
    schemaVersion: '1.0',
    requestId: crypto.randomUUID(),
    timestamp: waafiTimestamp(),
    channelName: 'WEB',
    serviceName,
    serviceParams: {
        merchantUid: process.env.WAAFI_MERCHANT_UID,
        apiUserId: process.env.WAAFI_API_USER_ID,
        apiKey: process.env.WAAFI_API_KEY,
        ...serviceParams,
    },
});

export const isWaafiConfigured = () =>
    Boolean(
        process.env.WAAFI_MERCHANT_UID &&
            process.env.WAAFI_API_USER_ID &&
            process.env.WAAFI_API_KEY
    );

export const isWaafiDemoMode = () =>
    !isProduction && process.env.WAAFI_DEMO_MODE !== 'false';

export const isWaafiAvailable = () => isWaafiConfigured() || isWaafiDemoMode();

export const isWaafiPurchaseApproved = (waafiResponse) =>
    String(waafiResponse?.responseCode) === '2001' &&
    String(waafiResponse?.params?.state).toUpperCase() === 'APPROVED';

export const initiatePurchase = async ({
    accountNo,
    amount,
    currency = 'USD',
    referenceId,
    description,
}) => {
    if (!isWaafiConfigured()) {
        if (isWaafiDemoMode()) {
            return {
                schemaVersion: '1.0',
                timestamp: waafiTimestamp(),
                responseCode: '2001',
                errorCode: '0',
                responseMsg: 'RCS_SUCCESS_DEMO',
                params: {
                    accountNo: `${accountNo.slice(0, 6)}****${accountNo.slice(-4)}`,
                    accountType: 'MWALLET_ACCOUNT',
                    state: 'APPROVED',
                    referenceId,
                    transactionId: `DEMO-${Date.now()}`,
                    txAmount: Number(amount).toFixed(2),
                },
            };
        }

        throw new Error(
            'WaafiPay is not configured. Add WAAFI_MERCHANT_UID, WAAFI_API_USER_ID, and WAAFI_API_KEY to .env'
        );
    }

    const payload = buildWaafiPayload('API_PURCHASE', {
        paymentMethod: 'MWALLET_ACCOUNT',
        payerInfo: { accountNo },
        transactionInfo: {
            referenceId,
            invoiceId: referenceId,
            amount: Number(amount).toFixed(2),
            currency,
            description,
        },
    });

    const response = await fetch(WAAFI_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.responseMsg || data.message || `WaafiPay HTTP ${response.status}`);
    }

    return data;
};

export const reversePurchase = async ({ transactionId, description = 'Order cancelled' }) => {
    if (!isWaafiConfigured()) {
        if (isWaafiDemoMode() && transactionId?.startsWith('DEMO-')) {
            return {
                schemaVersion: '1.0',
                timestamp: waafiTimestamp(),
                responseCode: '2001',
                errorCode: '0',
                responseMsg: 'RCS_SUCCESS_DEMO',
                params: {
                    description,
                    state: 'approved',
                    transactionId: `REV-${Date.now()}`,
                },
            };
        }

        throw new Error('WaafiPay is not configured');
    }

    const payload = buildWaafiPayload('API_REVERSAL', {
        transactionId,
        description,
    });

    const response = await fetch(WAAFI_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    return response.json();
};
