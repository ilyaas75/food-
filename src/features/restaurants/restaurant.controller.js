import Restaurant from './restaurant.model.js';
import { restaurantSchema, restaurantUpdateSchema } from '../../utils/validators.js';

export const createRestaurant = async (req, res, next) => {
    try {
        const { error } = restaurantSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const restaurant = await Restaurant.create({
            ...req.body,
            ownerId: req.body.ownerId || req.user._id,
        });
        res.status(201).json(restaurant);
    } catch (error) {
        next(error);
    }
};

export const getRestaurants = async (req, res, next) => {
    try {
        const restaurants = await Restaurant.find({}).populate('ownerId', 'name');
        res.json(restaurants);
    } catch (error) {
        next(error);
    }
};

export const getRestaurantById = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate('ownerId', 'name');
        if (restaurant) res.json(restaurant);
        else res.status(404).json({ message: 'Restaurant not found' });
    } catch (error) {
        next(error);
    }
};

export const updateRestaurant = async (req, res, next) => {
    try {
        const { error } = restaurantUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (restaurant) res.json(restaurant);
        else res.status(404).json({ message: 'Restaurant not found' });
    } catch (error) {
        next(error);
    }
};

export const deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
        if (restaurant) res.json({ message: 'Restaurant removed' });
        else res.status(404).json({ message: 'Restaurant not found' });
    } catch (error) {
        next(error);
    }
};
