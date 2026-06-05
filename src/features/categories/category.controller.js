import Category from './category.model.js';
import { categorySchema, categoryUpdateSchema } from '../../utils/validators.js';

export const createCategory = async (req, res, next) => {
    try {
        const { error } = categorySchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
};

export const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find({});
        res.json(categories);
    } catch (error) {
        next(error);
    }
};

export const getCategoryById = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (category) res.json(category);
        else res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (req, res, next) => {
    try {
        const { error } = categoryUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (category) res.json(category);
        else res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        next(error);
    }
};

export const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (category) res.json({ message: 'Category removed' });
        else res.status(404).json({ message: 'Category not found' });
    } catch (error) {
        next(error);
    }
};
