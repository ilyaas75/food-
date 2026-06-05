import mongoose from 'mongoose';

// Naqshadda xogta Qeybta (Category Schema definition)
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
