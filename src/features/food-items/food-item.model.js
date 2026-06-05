import mongoose from 'mongoose';

// Naqshadda xogta Cuntada (FoodItem Schema definition)
const foodItemSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
export default FoodItem;
