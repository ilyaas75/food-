import express from 'express';
import {
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    updateUserRoleByEmail,
} from './user.controller.js';
import { protect, authorize } from '../../middlewares/authMiddleware.js';
import { ROLES } from '../../constants/roles.js';

const router = express.Router();

router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)
    .delete(protect, deleteUserProfile);
router.get('/', protect, authorize(ROLES.ADMIN), getUsers);
router.post('/', protect, authorize(ROLES.ADMIN), createUser);
router.patch('/email/:email/role', protect, authorize(ROLES.ADMIN), updateUserRoleByEmail);
router.patch('/:id/role', protect, authorize(ROLES.ADMIN), updateUserRole);
router
    .route('/:id')
    .get(protect, authorize(ROLES.ADMIN), getUserById)
    .put(protect, authorize(ROLES.ADMIN), updateUser)
    .delete(protect, authorize(ROLES.ADMIN), deleteUser);

export default router;
