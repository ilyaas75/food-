import Joi from 'joi';
import { ROLES, ROLE_LIST } from '../constants/roles.js';

// Public registration — customer role only
export const registerSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string()
        .valid(ROLES.CUSTOMER)
        .default(ROLES.CUSTOMER)
        .messages({
            'any.only': `Only role "${ROLES.CUSTOMER}" is allowed on register. Create admins via POST /api/users (admin login required).`,
        }),
    phone: Joi.string().allow('', null).optional(),
});

// Naqshadda gelitaanka isticmaalaha (User Login Schema)
export const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// Naqshadda Maqaayadda (Restaurant Schema)
export const restaurantSchema = Joi.object({
    ownerId: Joi.string().optional(),
    name: Joi.string().min(2).required(),
    description: Joi.string().allow('', null).optional(),
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        country: Joi.string().optional(),
    }).optional(),
    contactInfo: Joi.object({
        phone: Joi.string().optional(),
        email: Joi.string().email().optional(),
    }).optional(),
    isOpen: Joi.boolean().default(true),
});

// Naqshadda Qeybta (Category Schema)
export const categorySchema = Joi.object({
    name: Joi.string().min(2).required(),
    description: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
});

export const categoryUpdateSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    description: Joi.string().allow('', null).optional(),
    image: Joi.string().allow('', null).optional(),
}).min(1);

export const restaurantUpdateSchema = Joi.object({
    ownerId: Joi.string().optional(),
    name: Joi.string().min(2).optional(),
    description: Joi.string().allow('', null).optional(),
    address: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        country: Joi.string().optional(),
    }).optional(),
    contactInfo: Joi.object({
        phone: Joi.string().optional(),
        email: Joi.string().email().optional(),
    }).optional(),
    isOpen: Joi.boolean().optional(),
}).min(1);

// Naqshadda Cuntada (FoodItem Schema)
export const foodItemSchema = Joi.object({
    restaurantId: Joi.string().required(),
    categoryId: Joi.string().required(),
    name: Joi.string().min(2).required(),
    description: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).required(),
    image: Joi.string().allow('', null).optional(),
    isAvailable: Joi.boolean().default(true),
});

export const foodItemUpdateSchema = Joi.object({
    restaurantId: Joi.string().optional(),
    categoryId: Joi.string().optional(),
    name: Joi.string().min(2).optional(),
    description: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).optional(),
    image: Joi.string().allow('', null).optional(),
    isAvailable: Joi.boolean().optional(),
}).min(1);

// Naqshadda Dalabka (Order Schema)
export const orderSchema = Joi.object({
    customerId: Joi.string().optional(),
    restaurantId: Joi.string().required(),
    items: Joi.array().items(Joi.object({
        foodItemId: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
        price: Joi.number().min(0).required(),
    })).min(1).required(),
    totalAmount: Joi.number().min(0).required(),
    deliveryAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
    }).required(),
});

// Naqshadda Lacag-bixinta (Payment Schema)
export const paymentSchema = Joi.object({
    orderId: Joi.string().required(),
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cash_on_delivery').required(),
    amount: Joi.number().min(0).required(),
    status: Joi.string().valid('pending', 'completed', 'failed').optional(),
});

export const paymentUpdateSchema = Joi.object({
    orderId: Joi.string().optional(),
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cash_on_delivery').optional(),
    amount: Joi.number().min(0).optional(),
    status: Joi.string().valid('pending', 'completed', 'failed').optional(),
    transactionId: Joi.string().allow('', null).optional(),
}).min(1);

export const deliverySchema = Joi.object({
    orderId: Joi.string().required(),
    deliveryStaffId: Joi.string().optional(),
    status: Joi.string().valid('assigned', 'picked-up', 'delivered').optional(),
    vehicleDetails: Joi.string().allow('', null).optional(),
});

export const deliveryUpdateSchema = Joi.object({
    orderId: Joi.string().optional(),
    deliveryStaffId: Joi.string().optional(),
    status: Joi.string().valid('assigned', 'picked-up', 'delivered').optional(),
    vehicleDetails: Joi.string().allow('', null).optional(),
}).min(1);

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled')
        .required(),
});

export const orderUpdateSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled')
        .optional(),
    totalAmount: Joi.number().min(0).optional(),
    deliveryAddress: Joi.object({
        street: Joi.string().optional(),
        city: Joi.string().optional(),
        state: Joi.string().optional(),
        zipCode: Joi.string().optional(),
        country: Joi.string().optional(),
    }).optional(),
}).min(1);

export const adminUserUpdateSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null).optional(),
    role: Joi.string().valid(...ROLE_LIST).optional(),
    password: Joi.string().min(6).optional(),
}).min(1);

const addressEntrySchema = Joi.object({
    street: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    zipCode: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional(),
});

export const profileUpdateSchema = Joi.object({
    name: Joi.string().min(2).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().allow('', null).optional(),
    password: Joi.string().min(6).optional(),
    addresses: Joi.array().items(addressEntrySchema).optional(),
}).min(1);

export const updateUserRoleSchema = Joi.object({
    role: Joi.string()
        .valid(...ROLE_LIST)
        .required()
        .messages({
            'any.only': `Role must be "${ROLES.CUSTOMER}" or "${ROLES.ADMIN}"`,
        }),
});

export const adminCreateUserSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string()
        .valid(...ROLE_LIST)
        .default(ROLES.CUSTOMER)
        .messages({
            'any.only': `Role must be "${ROLES.CUSTOMER}" or "${ROLES.ADMIN}"`,
        }),
    phone: Joi.string().allow('', null).optional(),
});

// Naqshadda Gaadhiga (Cart Schema)
export const cartSchema = Joi.object({
    customerId: Joi.string().optional(),
    items: Joi.array().items(Joi.object({
        foodItemId: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
    })).optional(),
});

export const addCartItemSchema = Joi.object({
    foodItemId: Joi.string().required(),
    quantity: Joi.number().min(1).default(1),
});

export const checkoutSchema = Joi.object({
    deliveryAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zipCode: Joi.string().required(),
        country: Joi.string().required(),
    }).required(),
    paymentMethod: Joi.string().valid('credit_card', 'paypal', 'cash_on_delivery').default('cash_on_delivery'),
});
