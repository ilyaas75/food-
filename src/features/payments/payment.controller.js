import Payment from './payment.model.js';
import { paymentSchema, paymentUpdateSchema } from '../../utils/validators.js';

export const createPayment = async (req, res, next) => {
    try {
        const { error } = paymentSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const payment = await Payment.create(req.body);
        res.status(201).json(payment);
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
        if (payment) res.json(payment);
        else res.status(404).json({ message: 'Payment not found' });
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
