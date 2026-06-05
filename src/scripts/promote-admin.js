import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../features/users/user.model.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
    console.error('Usage: npm run promote-admin -- <email>');
    console.error('Example: npm run promote-admin -- ila@gmail.com');
    process.exit(1);
}

const run = async () => {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
        console.error(`No user found with email: ${email}`);
        console.error('Register first: POST /api/auth/register');
        process.exit(1);
    }

    const previousRole = user.role;
    user.role = ROLES.ADMIN;
    await user.save();

    console.log(`✓ ${email} promoted: ${previousRole} → ${ROLES.ADMIN}`);
    console.log('Login with this email — response will include role: "admin"');
    console.log('Web: http://localhost:3000/login → redirects to /admin');

    await mongoose.connection.close();
    process.exit(0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
