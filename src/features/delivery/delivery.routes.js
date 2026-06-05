import express from 'express';
import {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    updateDelivery,
    deleteDelivery,
} from './delivery.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router
    .route('/')
    .get(protect, adminOnly, getDeliveries)
    .post(protect, adminOnly, createDelivery);

router
    .route('/:id')
    .get(protect, adminOnly, getDeliveryById)
    .put(protect, adminOnly, updateDelivery)
    .delete(protect, adminOnly, deleteDelivery);

export default router;
