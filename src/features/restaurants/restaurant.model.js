import mongoose from 'mongoose';

// Naqshadda xogta Maqaayadda (Restaurant Schema definition)
const restaurantSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    contactInfo: {
        phone: String,
        email: String
    },
    isOpen: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
export default Restaurant;
