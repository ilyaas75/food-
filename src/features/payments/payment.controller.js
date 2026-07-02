import Payment from './payment.model.js';
import Order from '../orders/order.model.js';
import { paymentSchema, paymentUpdateSchema, verifyPaymentSchema } from '../../utils/validators.js';
import { isWaafiAvailable, isWaafiConfigured, isWaafiDemoMode, reversePurchase } from './waafi.service.js';

const OFFLINE_PAYMENT_METHODS = ['cash_on_delivery', 'cash', 'bank_transfer'];

export const getPaymentConfig = (req, res) => {
    res.json({
        waafiConfigured: isWaafiAvailable(),
        waafiMode: isWaafiConfigured() ? 'live_or_sandbox' : isWaafiDemoMode() ? 'demo' : 'disabled',
    });
};

const syncOrderWithPayment = async (payment) => {
    if (!payment) return null;

    const orderId = payment.orderId?._id || payment.orderId;
    const isOffline = OFFLINE_PAYMENT_METHODS.includes(payment.paymentMethod);
    const update = {};

    if (['completed', 'approved'].includes(payment.status)) {
        update.paymentStatus = 'paid';
        update.status = 'confirmed';

        if (isOffline && payment.verificationStatus !== 'verified') {
            payment.verificationStatus = 'verified';
            payment.verifiedAt = payment.verifiedAt || new Date();
            await payment.save();
        }

        if (!isOffline && payment.verificationStatus !== 'not_required') {
            payment.verificationStatus = 'not_required';
            await payment.save();
        }
    } else if (payment.status === 'failed') {
        update.paymentStatus = 'failed';
        update.status = 'cancelled';
    } else if (payment.status === 'refunded') {
        update.paymentStatus = 'refunded';
        update.status = 'cancelled';
    } else if (payment.status === 'pending') {
        update.paymentStatus = 'pending';
    }

    if (!Object.keys(update).length) return null;
    return Order.findByIdAndUpdate(orderId, update, { new: true });
};

export const createPayment = async (req, res, next) => {
    try {
        const { error } = paymentSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const payment = await Payment.create(req.body);
        await syncOrderWithPayment(payment);
        const populated = await Payment.findById(payment._id).populate('orderId');
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

export const getPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find({}).populate('orderId').sort({ createdAt: -1 });
        res.json(payments);
    } catch (error) {
        next(error);
    }
};

export const getMyPayments = async (req, res, next) => {
    try {
        const orders = await Order.find({ customerId: req.user._id }).select('_id');
        const orderIds = orders.map((order) => order._id);
        const payments = await Payment.find({ orderId: { $in: orderIds } })
            .populate('orderId', 'referenceId totalAmount status paymentStatus createdAt')
            .sort({ createdAt: -1 });

        res.json(payments);
    } catch (error) {
        next(error);
    }
};

export const getPaymentById = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id).populate('orderId');
        if (payment) res.json(payment);
        else res.status(404).json({ message: 'Payment not found' });
    } catch (error) {
        next(error);
    }
};

export const updatePayment = async (req, res, next) => {
    try {
        const { error } = paymentUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
            'orderId'
        );
        if (payment) {
            await syncOrderWithPayment(payment);
            const populated = await Payment.findById(payment._id).populate('orderId');
            res.json(populated);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const deletePayment = async (req, res, next) => {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (payment) res.json({ message: 'Payment removed' });
        else res.status(404).json({ message: 'Payment not found' });
    } catch (error) {
        next(error);
    }
};

export const refundPayment = async (req, res, next) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (!payment.transactionId) {
            return res.status(400).json({ message: 'No WaafiPay transaction to refund' });
        }

        if (payment.status === 'refunded') {
            return res.status(400).json({ message: 'Payment already refunded' });
        }

        const waafiResponse = await reversePurchase({
            transactionId: payment.transactionId,
            description: req.body?.description || `Refund for ${payment.referenceId}`,
        });

        const reversed =
            String(waafiResponse.responseCode) === '2001' ||
            String(waafiResponse.params?.state).toUpperCase() === 'APPROVED';

        if (!reversed) {
            return res.status(400).json({
                message: waafiResponse.responseMsg || 'Refund failed',
                waafiResponse,
            });
        }

        payment.status = 'refunded';
        payment.waafiResponse = { ...payment.waafiResponse, reversal: waafiResponse };
        await payment.save();

        await Order.findByIdAndUpdate(payment.orderId, {
            paymentStatus: 'refunded',
            status: 'cancelled',
        });

        res.json({
            message: 'Payment refunded',
            payment,
            waafiResponse,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOfflinePayment = async (req, res, next) => {
    try {
        const { error } = verifyPaymentSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const payment = await Payment.findById(req.params.id).populate('orderId');
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        if (!OFFLINE_PAYMENT_METHODS.includes(payment.paymentMethod)) {
            return res.status(400).json({ message: 'Only offline payments require verification' });
        }

        payment.verificationStatus = req.body.verificationStatus;
        payment.verificationNote = req.body.verificationNote || '';
        payment.verifiedBy = req.user._id;
        payment.verifiedAt = new Date();
        payment.status = req.body.verificationStatus === 'verified' ? 'completed' : 'failed';
        await payment.save();

        const orderUpdate =
            req.body.verificationStatus === 'verified'
                ? { paymentStatus: 'paid', status: 'confirmed' }
                : { paymentStatus: 'failed', status: 'cancelled' };

        const order = await Order.findByIdAndUpdate(payment.orderId, orderUpdate, {
            new: true,
        });

        res.json({
            message:
                req.body.verificationStatus === 'verified'
                    ? 'Offline payment verified'
                    : 'Offline payment rejected',
            payment,
            order,
        });
    } catch (error) {
        next(error);
    }
};
