import fs from 'fs';
import path from 'path';
import FoodItem from './food-item.model.js';
import { foodItemSchema, foodItemUpdateSchema } from '../../utils/validators.js';
import { uploadDirPath } from '../../middlewares/uploadMiddleware.js';

const removeLocalImage = (imagePath) => {
    if (!imagePath || !imagePath.startsWith('/uploads/')) return;
    const filePath = path.join(uploadDirPath, path.basename(imagePath));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

export const createFoodItem = async (req, res, next) => {
    try {
        const { error } = foodItemSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const foodItem = await FoodItem.create(req.body);
        res.status(201).json(foodItem);
    } catch (error) {
        next(error);
    }
};

export const getFoodItems = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
        if (req.query.categoryId) filter.categoryId = req.query.categoryId;
        if (req.query.available === 'true') filter.isAvailable = true;

        const foodItems = await FoodItem.find(filter).populate('restaurantId', 'name').populate('categoryId', 'name');
        res.json(foodItems);
    } catch (error) {
        next(error);
    }
};

export const getFoodItemById = async (req, res, next) => {
    try {
        const foodItem = await FoodItem.findById(req.params.id).populate('restaurantId', 'name').populate('categoryId', 'name');
        if (foodItem) res.json(foodItem);
        else res.status(404).json({ message: 'FoodItem not found' });
    } catch (error) {
        next(error);
    }
};

export const updateFoodItem = async (req, res, next) => {
    try {
        const { error } = foodItemUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const existing = await FoodItem.findById(req.params.id);
        if (!existing) return res.status(404).json({ message: 'FoodItem not found' });

        if (req.body.image === '' && existing.image) {
            removeLocalImage(existing.image);
        } else if (req.body.image && existing.image && req.body.image !== existing.image) {
            removeLocalImage(existing.image);
        }

        const foodItem = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('restaurantId', 'name')
            .populate('categoryId', 'name');

        res.json(foodItem);
    } catch (error) {
        next(error);
    }
};

export const deleteFoodItem = async (req, res, next) => {
    try {
        const foodItem = await FoodItem.findByIdAndDelete(req.params.id);
        if (foodItem) {
            removeLocalImage(foodItem.image);
            res.json({ message: 'FoodItem removed' });
        } else {
            res.status(404).json({ message: 'FoodItem not found' });
        }
    } catch (error) {
        next(error);
    }
};

export const uploadFoodItemImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded' });
        }
        const image = `/uploads/${req.file.filename}`;
        res.status(201).json({ image, message: 'Image uploaded successfully' });
    } catch (error) {
        next(error);
    }
};
