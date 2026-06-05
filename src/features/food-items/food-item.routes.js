import express from 'express';
import {
    createFoodItem,
    getFoodItems,
    getFoodItemById,
    updateFoodItem,
    deleteFoodItem,
    uploadFoodItemImage,
} from './food-item.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';
import { uploadFoodImage as uploadMiddleware } from '../../middlewares/uploadMiddleware.js';

const router = express.Router();

router.post(
    '/upload-image',
    protect,
    adminOnly,
    uploadMiddleware.single('image'),
    uploadFoodItemImage
);

router.route('/')
    .get(getFoodItems)
    .post(protect, adminOnly, createFoodItem);

router.route('/:id')
    .get(getFoodItemById)
    .put(protect, adminOnly, updateFoodItem)
    .delete(protect, adminOnly, deleteFoodItem);

export default router;
