const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    deliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { 
        type: String, 
        enum: ['unassigned', 'assigned', 'picked_up', 'delivered'], 
        default: 'unassigned' 
    },
    estimatedDeliveryTime: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Delivery', deliverySchema);
