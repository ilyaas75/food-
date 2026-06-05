import mongoose from 'mongoose';

// Naqshadda xogta Isticmaalaha (User Schema definition)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer',
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

const User = mongoose.model('User', userSchema);
export default User;
