import express from 'express';
import {
    getPaymentConfig,
    createPayment,
    getPayments,
    getMyPayments,
    getPaymentById,
    updatePayment,
    deletePayment,
    refundPayment,
    verifyOfflinePayment,
} from './payment.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);

router
    .route('/')
    .get(protect, adminOnly, getPayments)
    .post(protect, adminOnly, createPayment);

router.get('/my-history', protect, getMyPayments);

router
    .route('/:id')
    .get(protect, adminOnly, getPaymentById)
    .put(protect, adminOnly, updatePayment)
    .delete(protect, adminOnly, deletePayment);

router.post('/:id/refund', protect, adminOnly, refundPayment);
router.post('/:id/verify', protect, adminOnly, verifyOfflinePayment);

export default router;
