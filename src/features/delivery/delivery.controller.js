import Delivery from './delivery.model.js';
import Order from '../orders/order.model.js';
import { deliverySchema, deliveryUpdateSchema } from '../../utils/validators.js';

const populateDelivery = (query) =>
    query
        .populate({
            path: 'orderId',
            populate: [
                { path: 'customerId', select: 'name email' },
                { path: 'restaurantId', select: 'name' },
            ],
        })
        .populate('deliveryStaffId', 'name email');

export const createDelivery = async (req, res, next) => {
    try {
        const { error } = deliverySchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const order = await Order.findById(req.body.orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.paymentStatus !== 'paid') {
            return res.status(400).json({ message: 'Only paid orders can be assigned for delivery' });
        }

        const delivery = await Delivery.create({
            ...req.body,
            deliveryStaffId: req.body.deliveryStaffId || req.user._id,
        });

        await Order.findByIdAndUpdate(req.body.orderId, {
            status: req.body.status === 'delivered' ? 'delivered' : 'out-for-delivery',
        });

        const populated = await populateDelivery(Delivery.findById(delivery._id));
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

export const getDeliveries = async (req, res, next) => {
    try {
        const deliveries = await populateDelivery(Delivery.find({}).sort({ createdAt: -1 }));
        res.json(deliveries);
    } catch (error) {
        next(error);
    }
};

export const getDeliveryById = async (req, res, next) => {
    try {
        const delivery = await populateDelivery(Delivery.findById(req.params.id));
        if (delivery) res.json(delivery);
        else res.status(404).json({ message: 'Delivery not found' });
    } catch (error) {
        next(error);
    }
};

export const updateDelivery = async (req, res, next) => {
    try {
        const { error } = deliveryUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const delivery = await populateDelivery(
            Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true })
        );
        if (delivery) {
            if (req.body.status) {
                await Order.findByIdAndUpdate(delivery.orderId?._id || delivery.orderId, {
                    status: req.body.status === 'delivered' ? 'delivered' : 'out-for-delivery',
                });
            }
            res.json(delivery);
        } else {
            res.status(404).json({ message: 'Delivery not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const deleteDelivery = async (req, res, next) => {
    try {
        const delivery = await Delivery.findByIdAndDelete(req.params.id);
        if (delivery) res.json({ message: 'Delivery removed' });
        else res.status(404).json({ message: 'Delivery not found' });
    } catch (error) {
        next(error);
    }
};
