import express from 'express';
import {
    createRestaurant,
    getRestaurants,
    getRestaurantById,
    updateRestaurant,
    deleteRestaurant
} from './restaurant.controller.js';
import { protect, adminOnly } from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getRestaurants)
    .post(protect, adminOnly, createRestaurant);

router.route('/:id')
    .get(getRestaurantById)
    .put(protect, adminOnly, updateRestaurant)
    .delete(protect, adminOnly, deleteRestaurant);

export default router;
