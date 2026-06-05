import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// Soo rar isbedelayaasha deegaanka (Load env vars)
dotenv.config();

// Ku xir database-ka (Connect to database)
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server-ka wuxuu ku shaqeynayaa ${process.env.NODE_ENV} mode, port-ga ${PORT}`);
});

// Xalinta khaladaadka aan la mahadin (Handle unhandled promise rejections)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Cillad: ${err.message}`);
    // Xir server-ka oo jooji shaqada (Close server & exit process)
    server.close(() => process.exit(1));
});
