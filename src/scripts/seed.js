import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../features/users/user.model.js';
import Restaurant from '../features/restaurants/restaurant.model.js';
import Category from '../features/categories/category.model.js';
import FoodItem from '../features/food-items/food-item.model.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const seed = async () => {
    await connectDB();

    await Promise.all([
        User.deleteMany(),
        Restaurant.deleteMany(),
        Category.deleteMany(),
        FoodItem.deleteMany(),
    ]);

    const password = await bcrypt.hash('password123', 10);

    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@food.com',
        password,
        role: ROLES.ADMIN,
        phone: '+1234567890',
    });

    await User.create({
        name: 'John Customer',
        email: 'customer@food.com',
        password,
        role: ROLES.CUSTOMER,
        phone: '+1234567892',
        addresses: [{
            street: '123 Main St',
            city: 'Mogadishu',
            state: 'Banaadir',
            zipCode: '001',
            country: 'Somalia',
        }],
    });

    const restaurant = await Restaurant.create({
        ownerId: admin._id,
        name: 'Somali Kitchen',
        description: 'Authentic Somali dishes delivered fresh to your door.',
        address: {
            street: '45 Food Street',
            city: 'Mogadishu',
            state: 'Banaadir',
            zipCode: '001',
            country: 'Somalia',
        },
        contactInfo: { phone: '+252611111111', email: 'kitchen@somali.com' },
        isOpen: true,
        rating: 4.8,
    });

    const categories = await Category.insertMany([
        { name: 'Main Dishes', description: 'Hearty traditional meals', image: '' },
        { name: 'Sides', description: 'Perfect accompaniments', image: '' },
        { name: 'Drinks', description: 'Refreshing beverages', image: '' },
    ]);

    await FoodItem.insertMany([
        {
            restaurantId: restaurant._id,
            categoryId: categories[0]._id,
            name: 'Bariis iyo Hilib',
            description: 'Rice with seasoned goat meat',
            price: 12.99,
            image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
            isAvailable: true,
        },
        {
            restaurantId: restaurant._id,
            categoryId: categories[0]._id,
            name: 'Suqaar',
            description: 'Diced beef sautéed with vegetables',
            price: 10.99,
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
            isAvailable: true,
        },
        {
            restaurantId: restaurant._id,
            categoryId: categories[1]._id,
            name: 'Sambusa (3 pcs)',
            description: 'Crispy pastry filled with spiced meat',
            price: 5.99,
            image: 'https://images.unsplash.com/photo-1601050690597-df0578fa5570?w=400',
            isAvailable: true,
        },
        {
            restaurantId: restaurant._id,
            categoryId: categories[2]._id,
            name: 'Shaah',
            description: 'Traditional spiced tea',
            price: 2.49,
            image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400',
            isAvailable: true,
        },
    ]);

    console.log('Database seeded successfully!');
    console.log('Roles: Admin + Customer only');
    console.log('Demo accounts (password: password123):');
    console.log('  admin@food.com    → Admin');
    console.log('  customer@food.com → Customer');

    await mongoose.connection.close();
    process.exit(0);
};

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
