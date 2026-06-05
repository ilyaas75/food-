import jwt from 'jsonwebtoken';
import User from '../features/users/user.model.js';
import { ROLES } from '../constants/roles.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({
            message: 'Not authorized, no token',
            hint: 'Call POST /api/auth/login first, copy the "token" from the response, then add header: Authorization: Bearer <token>',
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role "${req.user.role}" is not authorized to access this route`,
            });
        }
        next();
    };
};

export const customerOnly = authorize(ROLES.CUSTOMER);
export const adminOnly = authorize(ROLES.ADMIN);
