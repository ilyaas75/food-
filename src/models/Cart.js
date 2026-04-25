const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true } // Price at the time of adding
});

const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
