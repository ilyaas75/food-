import express from 'express';
import {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
} from './payment.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(protect, adminOnly, getPayments)
    .post(protect, adminOnly, createPayment);

router
    .route('/:id')
    .get(protect, adminOnly, getPaymentById)
    .put(protect, adminOnly, updatePayment)
    .delete(protect, adminOnly, deletePayment);

export default router;
