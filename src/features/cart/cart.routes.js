import express from 'express';
import {
    getCart,
    updateCart,
    addToCart,
    removeFromCart,
    clearCart,
    getAllCarts,
    adminDeleteCart,
} from './cart.controller.js';
import { protect, customerOnly, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, adminOnly, getAllCarts);
router.delete('/admin/:customerId', protect, adminOnly, adminDeleteCart);

router.route('/')
    .get(protect, customerOnly, getCart)
    .post(protect, customerOnly, updateCart)
    .delete(protect, customerOnly, clearCart);

router.post('/items', protect, customerOnly, addToCart);
router.delete('/items/:foodItemId', protect, customerOnly, removeFromCart);

export default router;
