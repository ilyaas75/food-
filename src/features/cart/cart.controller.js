import Cart from './cart.model.js';
import FoodItem from '../food-items/food-item.model.js';
import { cartSchema, addCartItemSchema } from '../../utils/validators.js';

const getOrCreateCart = async (customerId) => {
    let cart = await Cart.findOne({ customerId });
    if (!cart) {
        cart = await Cart.create({ customerId, items: [] });
    }
    return cart;
};

export const getCart = async (req, res, next) => {
    try {
        const cart = await getOrCreateCart(req.user._id);
        await cart.populate('items.foodItemId');
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const updateCart = async (req, res, next) => {
    try {
        const { error } = cartSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const cart = await Cart.findOneAndUpdate(
            { customerId: req.user._id },
            { items: req.body.items, updatedAt: Date.now() },
            { new: true, upsert: true }
        ).populate('items.foodItemId');
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const addToCart = async (req, res, next) => {
    try {
        const { error } = addCartItemSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const foodItem = await FoodItem.findById(req.body.foodItemId);
        if (!foodItem || !foodItem.isAvailable) {
            return res.status(404).json({ message: 'Food item not found or unavailable' });
        }

        const cart = await getOrCreateCart(req.user._id);
        const existingIndex = cart.items.findIndex(
            (item) => item.foodItemId.toString() === req.body.foodItemId
        );

        if (existingIndex >= 0) {
            cart.items[existingIndex].quantity += req.body.quantity || 1;
        } else {
            if (cart.items.length > 0) {
                const firstItem = await FoodItem.findById(cart.items[0].foodItemId);
                if (firstItem.restaurantId.toString() !== foodItem.restaurantId.toString()) {
                    return res.status(400).json({
                        message: 'You can only order from one restaurant at a time. Clear your cart first.',
                    });
                }
            }
            cart.items.push({ foodItemId: req.body.foodItemId, quantity: req.body.quantity || 1 });
        }

        cart.updatedAt = Date.now();
        await cart.save();
        await cart.populate('items.foodItemId');
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const removeFromCart = async (req, res, next) => {
    try {
        const cart = await getOrCreateCart(req.user._id);
        cart.items = cart.items.filter(
            (item) => item.foodItemId.toString() !== req.params.foodItemId
        );
        cart.updatedAt = Date.now();
        await cart.save();
        await cart.populate('items.foodItemId');
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const clearCart = async (req, res, next) => {
    try {
        const cart = await getOrCreateCart(req.user._id);
        cart.items = [];
        cart.updatedAt = Date.now();
        await cart.save();
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

export const getAllCarts = async (req, res, next) => {
    try {
        const carts = await Cart.find({})
            .populate('customerId', 'name email')
            .populate('items.foodItemId', 'name price')
            .sort({ updatedAt: -1 });
        res.json(carts);
    } catch (error) {
        next(error);
    }
};

export const adminDeleteCart = async (req, res, next) => {
    try {
        const cart = await Cart.findOneAndDelete({ customerId: req.params.customerId });
        if (cart) res.json({ message: 'Cart removed' });
        else res.status(404).json({ message: 'Cart not found' });
    } catch (error) {
        next(error);
    }
};
