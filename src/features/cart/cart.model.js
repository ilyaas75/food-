import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
        quantity: { type: Number, default: 1 }
    }],
    updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
