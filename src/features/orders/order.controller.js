import Order from './order.model.js';
import Cart from '../cart/cart.model.js';
import Payment from '../payments/payment.model.js';
import { orderSchema, checkoutSchema, orderUpdateSchema } from '../../utils/validators.js';
import { ROLES } from '../../constants/roles.js';

export const createOrder = async (req, res, next) => {
    try {
        const { error } = orderSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const order = await Order.create({
            ...req.body,
            customerId: req.user._id,
        });
        res.status(201).json(order);
    } catch (error) {
        next(error);
    }
};

export const checkoutFromCart = async (req, res, next) => {
    try {
        const { error } = checkoutSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const cart = await Cart.findOne({ customerId: req.user._id }).populate('items.foodItemId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const restaurantId = cart.items[0].foodItemId.restaurantId.toString();
        const orderItems = [];

        for (const item of cart.items) {
            const food = item.foodItemId;
            if (!food || !food.isAvailable) {
                return res.status(400).json({ message: `${food?.name || 'Item'} is not available` });
            }
            if (food.restaurantId.toString() !== restaurantId) {
                return res.status(400).json({ message: 'All items must be from the same restaurant' });
            }
            orderItems.push({
                foodItemId: food._id,
                quantity: item.quantity,
                price: food.price,
            });
        }

        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const order = await Order.create({
            customerId: req.user._id,
            restaurantId,
            items: orderItems,
            totalAmount,
            deliveryAddress: req.body.deliveryAddress,
        });

        await Payment.create({
            orderId: order._id,
            paymentMethod: req.body.paymentMethod,
            amount: totalAmount,
            status: req.body.paymentMethod === 'cash_on_delivery' ? 'pending' : 'completed',
        });

        cart.items = [];
        await cart.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('customerId', 'name')
            .populate('restaurantId', 'name')
            .populate('items.foodItemId', 'name');

        res.status(201).json(populatedOrder);
    } catch (error) {
        next(error);
    }
};

export const getOrders = async (req, res, next) => {
    try {
        const filter = {};

        if (req.user.role === ROLES.CUSTOMER) {
            filter.customerId = req.user._id;
        }

        const orders = await Order.find(filter)
            .populate('customerId', 'name')
            .populate('restaurantId', 'name')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

export const getOrderById = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name')
            .populate('restaurantId', 'name')
            .populate('items.foodItemId', 'name');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (
            req.user.role === ROLES.CUSTOMER &&
            order.customerId._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: 'Not authorized to view this order' });
        }

        res.json(order);
    } catch (error) {
        next(error);
    }
};

export const updateOrder = async (req, res, next) => {
    try {
        const { error } = orderUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('customerId', 'name')
            .populate('restaurantId', 'name')
            .populate('items.foodItemId', 'name');

        if (order) res.json(order);
        else res.status(404).json({ message: 'Order not found' });
    } catch (error) {
        next(error);
    }
};

export const deleteOrder = async (req, res, next) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (order) res.json({ message: 'Order removed' });
        else res.status(404).json({ message: 'Order not found' });
    } catch (error) {
        next(error);
    }
};
