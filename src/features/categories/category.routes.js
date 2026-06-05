import express from 'express';
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
} from './category.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getCategories)
    .post(protect, adminOnly, createCategory);

router.route('/:id')
    .get(getCategoryById)
    .put(protect, adminOnly, updateCategory)
    .delete(protect, adminOnly, deleteCategory);

export default router;
