import Order from './order.model.js';
import Cart from '../cart/cart.model.js';
import Payment from '../payments/payment.model.js';
import FoodItem from '../food-items/food-item.model.js';
import { initiatePurchase, isWaafiPurchaseApproved } from '../payments/waafi.service.js';
import { orderSchema, adminOrderSchema, checkoutSchema, orderUpdateSchema } from '../../utils/validators.js';
import { ROLES } from '../../constants/roles.js';

const DELIVERY_FEE = 2.99;
const OFFLINE_PAYMENT_METHODS = ['cash_on_delivery', 'cash', 'bank_transfer'];

const populateOrder = (orderId) =>
    Order.findById(orderId)
        .populate('customerId', 'name')
        .populate('restaurantId', 'name')
        .populate('items.foodItemId', 'name');

const buildCartOrderItems = async (cart) => {
    const restaurantId = cart.items[0].foodItemId.restaurantId.toString();
    const orderItems = [];

    for (const item of cart.items) {
        const food = item.foodItemId;
        if (!food || !food.isAvailable) {
            throw Object.assign(new Error(`${food?.name || 'Item'} is not available`), { statusCode: 400 });
        }
        if (food.restaurantId.toString() !== restaurantId) {
            throw Object.assign(
                new Error('All items must be from the same restaurant'),
                { statusCode: 400 }
            );
        }
        orderItems.push({
            foodItemId: food._id,
            quantity: item.quantity,
            price: food.price,
        });
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { restaurantId, orderItems, totalAmount };
};

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

export const adminCreateOrder = async (req, res, next) => {
    try {
        const { error } = adminOrderSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const orderItems = [];

        for (const item of req.body.items) {
            const foodItem = await FoodItem.findById(item.foodItemId);
            if (!foodItem) {
                return res.status(404).json({ message: 'Food item not found' });
            }
            if (foodItem.restaurantId.toString() !== req.body.restaurantId) {
                return res.status(400).json({
                    message: 'All order items must belong to the selected restaurant',
                });
            }

            orderItems.push({
                foodItemId: foodItem._id,
                quantity: item.quantity,
                price: foodItem.price,
            });
        }

        const itemsTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalAmount = Math.round((itemsTotal + DELIVERY_FEE) * 100) / 100;

        const order = await Order.create({
            customerId: req.body.customerId,
            restaurantId: req.body.restaurantId,
            items: orderItems,
            totalAmount,
            status: req.body.status,
            paymentStatus: req.body.paymentStatus,
            deliveryAddress: req.body.deliveryAddress,
            referenceId: `ORD-${Date.now()}`,
        });

        const populatedOrder = await populateOrder(order._id);
        res.status(201).json(populatedOrder);
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

        const { restaurantId, orderItems, totalAmount: itemsTotal } = await buildCartOrderItems(cart);
        const totalAmount = Math.round((itemsTotal + DELIVERY_FEE) * 100) / 100;
        const referenceId = `ORD-${Date.now()}`;
        const paymentMethod = req.body.paymentMethod;

        const order = await Order.create({
            customerId: req.user._id,
            restaurantId,
            items: orderItems,
            totalAmount,
            deliveryAddress: req.body.deliveryAddress,
            referenceId,
            paymentStatus: 'pending',
            status: 'pending',
        });

        let payment;
        let paymentMessage = 'Order placed';

        if (paymentMethod === 'waafi') {
            const accountNo = req.body.accountNo.replace(/\s+/g, '');
            const waafiResponse = await initiatePurchase({
                accountNo,
                amount: totalAmount,
                currency: 'USD',
                referenceId,
                description: `FoodExpress order ${referenceId}`,
            });

            const isApproved = isWaafiPurchaseApproved(waafiResponse);

            payment = await Payment.create({
                orderId: order._id,
                paymentMethod: 'waafi',
                amount: totalAmount,
                currency: 'USD',
                referenceId,
                transactionId: waafiResponse.params?.transactionId || null,
                status: isApproved ? 'approved' : 'failed',
                waafiResponse,
            });

            order.paymentStatus = isApproved ? 'paid' : 'failed';
            order.status = isApproved ? 'confirmed' : 'cancelled';
            await order.save();

            if (!isApproved) {
                const populatedOrder = await populateOrder(order._id);
                return res.status(400).json({
                    status: false,
                    message: waafiResponse.responseMsg || 'Payment failed',
                    data: { order: populatedOrder, payment },
                });
            }

            paymentMessage = 'Payment successful';
        } else if (OFFLINE_PAYMENT_METHODS.includes(paymentMethod)) {
            payment = await Payment.create({
                orderId: order._id,
                paymentMethod,
                amount: totalAmount,
                currency: 'USD',
                referenceId,
                status: 'pending',
                verificationStatus: 'pending',
                offlineDetails: req.body.offlineDetails || {},
            });
            order.paymentStatus = 'pending';
            await order.save();
            paymentMessage =
                paymentMethod === 'bank_transfer'
                    ? 'Bank transfer submitted for verification'
                    : 'Cash payment will be verified by admin';
        } else {
            payment = await Payment.create({
                orderId: order._id,
                paymentMethod,
                amount: totalAmount,
                currency: 'USD',
                referenceId,
                status: 'completed',
                verificationStatus: 'not_required',
            });
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            await order.save();
        }

        cart.items = [];
        await cart.save();

        const populatedOrder = await populateOrder(order._id);

        res.status(201).json({
            status: true,
            message: paymentMessage,
            data: { order: populatedOrder, payment },
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
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
