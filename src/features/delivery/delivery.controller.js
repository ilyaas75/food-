import Delivery from './delivery.model.js';
import { deliverySchema, deliveryUpdateSchema } from '../../utils/validators.js';

export const createDelivery = async (req, res, next) => {
    try {
        const { error } = deliverySchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const delivery = await Delivery.create({
            ...req.body,
            deliveryStaffId: req.body.deliveryStaffId || req.user._id,
        });
        const populated = await Delivery.findById(delivery._id)
            .populate('orderId')
            .populate('deliveryStaffId', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

export const getDeliveries = async (req, res, next) => {
    try {
        const deliveries = await Delivery.find({})
            .populate('orderId')
            .populate('deliveryStaffId', 'name email')
            .sort({ createdAt: -1 });
        res.json(deliveries);
    } catch (error) {
        next(error);
    }
};

export const getDeliveryById = async (req, res, next) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('orderId')
            .populate('deliveryStaffId', 'name email');
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

        const delivery = await Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('orderId')
            .populate('deliveryStaffId', 'name email');
        if (delivery) res.json(delivery);
        else res.status(404).json({ message: 'Delivery not found' });
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
