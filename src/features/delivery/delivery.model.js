import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['assigned', 'picked-up', 'delivered'], default: 'assigned' },
    vehicleDetails: { type: String },
    estimatedDeliveryTime: { type: Date },
    actualDeliveryTime: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
