import User from './user.model.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
    registerSchema,
    loginSchema,
    adminCreateUserSchema,
    adminUserUpdateSchema,
    profileUpdateSchema,
    updateUserRoleSchema,
} from '../../utils/validators.js';
import { ROLES } from '../../constants/roles.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const formatUserResponse = (user, token = null) => {
    const response = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
    if (token) response.token = token;
    return response;
};

// @desc    Register a new customer (public — always customer role)
export const registerUser = async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                message: error.details.map((d) => d.message).join('. '),
                hint: 'Use role "customer" or omit role. For admin accounts: POST /api/auth/login as admin, then POST /api/users with Bearer token.',
            });
        }

        const { name, email, password, phone } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(409).json({
                message: 'Email already registered',
                hint: 'Use POST /api/auth/login with this email, or register with a different email.',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: ROLES.CUSTOMER,
            phone,
        });

        res.status(201).json(formatUserResponse(user, generateToken(user._id)));
    } catch (error) {
        next(error);
    }
};

// @desc    Authenticate user (admin or customer)
export const loginUser = async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json(formatUserResponse(user, generateToken(user._id)));
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get logged-in user profile
export const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json(profileFields(user));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

const profileFields = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    addresses: user.addresses,
});

// @desc    Update logged-in user profile
export const updateUserProfile = async (req, res, next) => {
    try {
        const { error } = profileUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (req.body.name) user.name = req.body.name.trim();
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.addresses !== undefined) user.addresses = req.body.addresses;
        if (req.body.email) {
            const normalizedEmail = req.body.email.trim().toLowerCase();
            const existing = await User.findOne({ email: normalizedEmail });
            if (existing && existing._id.toString() !== user._id.toString()) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            user.email = normalizedEmail;
        }
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json(profileFields(user));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete logged-in user account
export const deleteUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.deleteOne();
        res.json({ message: 'Account deleted' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — list all users
export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — create user (customer or admin)
export const createUser = async (req, res, next) => {
    try {
        const { error } = adminCreateUserSchema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({ message: error.details.map((d) => d.message).join('. ') });
        }

        const { name, email, password, role, phone } = req.body;
        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(409).json({
                message: 'Email already in use',
                hint: 'This email is already registered. Use login instead or pick another email.',
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: role || ROLES.CUSTOMER,
            phone,
        });

        res.status(201).json(formatUserResponse(user));
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — get user by id
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) res.json(user);
        else res.status(404).json({ message: 'User not found' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — update user fields
export const updateUser = async (req, res, next) => {
    try {
        const { error } = adminUserUpdateSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (
            user._id.toString() === req.user._id.toString() &&
            req.body.role &&
            req.body.role !== ROLES.ADMIN
        ) {
            return res.status(400).json({ message: 'You cannot remove your own admin role' });
        }

        if (req.body.name) user.name = req.body.name.trim();
        if (req.body.phone !== undefined) user.phone = req.body.phone;
        if (req.body.role) user.role = req.body.role;
        if (req.body.email) {
            const normalizedEmail = req.body.email.trim().toLowerCase();
            const existing = await User.findOne({ email: normalizedEmail });
            if (existing && existing._id.toString() !== user._id.toString()) {
                return res.status(409).json({ message: 'Email already in use' });
            }
            user.email = normalizedEmail;
        }
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        await user.save();
        res.json(formatUserResponse(user));
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — delete user
export const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account' });
        }

        await user.deleteOne();
        res.json({ message: 'User removed' });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — change a user's role (e.g. promote customer → admin)
export const updateUserRole = async (req, res, next) => {
    try {
        const { error } = updateUserRoleSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user._id.toString() === req.user._id.toString() && req.body.role !== ROLES.ADMIN) {
            return res.status(400).json({ message: 'You cannot remove your own admin role' });
        }

        user.role = req.body.role;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: `Role updated to "${user.role}"`,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Admin — find user by email and set role (convenience)
export const updateUserRoleByEmail = async (req, res, next) => {
    try {
        const { error } = updateUserRoleSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const email = req.params.email.trim().toLowerCase();
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: `No user found with email ${email}` });
        }

        user.role = req.body.role;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: `Role updated to "${user.role}". User can login and access admin routes.`,
        });
    } catch (error) {
        next(error);
    }
};
