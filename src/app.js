import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Soo rar jidadka (Load feature routes)
import authRoutes from './features/users/auth.routes.js';
import userRoutes from './features/users/user.routes.js';
import restaurantRoutes from './features/restaurants/restaurant.routes.js';
import categoryRoutes from './features/categories/category.routes.js';
import foodItemRoutes from './features/food-items/food-item.routes.js';
import orderRoutes from './features/orders/order.routes.js';
import paymentRoutes from './features/payments/payment.routes.js';
import deliveryRoutes from './features/delivery/delivery.routes.js';
import cartRoutes from './features/cart/cart.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Qalabka dhex-dhexaadiyaha (Middleware setup)
app.use(cors()); // Oggolow codsiyada dibadda (Allow CORS)
app.use(express.json()); // U fasir xogta JSON (Parse JSON requests)
app.use(morgan('dev')); // Diiwaangeli codsiyada (Log requests)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Jidka lagu hubiyo inuu server-ka shaqeynayo (Health check route)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'API-ga waa uu shaqeynayaa (API is running)' });
});

// Ku xir jidadka server-ka (Mounting Routes)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/cart', cartRoutes);

// Qalabka xalinta cilladaha (Error handling middleware)
app.use(notFound);
app.use(errorHandler);

export default app;
