const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    status: { 
        type: String, 
        enum: ['pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'], 
        default: 'pending' 
    },
    paymentStatus: { 
        type: String, 
        enum: ['pending', 'completed', 'failed'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
