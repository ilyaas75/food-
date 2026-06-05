import mongoose from 'mongoose';

// Shaqada isku xirka Database-ka (Database connection function)
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Cillad: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
