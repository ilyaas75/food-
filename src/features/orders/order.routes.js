import express from 'express';
import {
    createOrder,
    adminCreateOrder,
    checkoutFromCart,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
} from './order.controller.js';
import { protect, customerOnly, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/checkout', protect, customerOnly, checkoutFromCart);

router.route('/')
    .get(protect, getOrders)
    .post(protect, customerOnly, createOrder);

router.post('/admin', protect, adminOnly, adminCreateOrder);

router.route('/:id')
    .get(protect, getOrderById)
    .put(protect, adminOnly, updateOrder)
    .delete(protect, adminOnly, deleteOrder);

export default router;
