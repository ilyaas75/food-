const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { 
        type: String, 
        enum: ['customer', 'admin', 'restaurant', 'delivery'], 
        default: 'customer' 
    },
    addresses: [{
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
