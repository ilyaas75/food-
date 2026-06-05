# FoodExpress — Full-Stack Food Delivery App

A complete food delivery application with a **Node.js / Express / MongoDB** backend and a **React (Vite)** frontend.

## Features

- User registration & JWT authentication
- Browse restaurants and menus
- Shopping cart (single-restaurant orders)
- Checkout with delivery address & payment method
- Order history and order details
- Two roles: **Admin** and **Customer** (role-based API + UI)

## Project structure

```
food/
├── src/                 # Backend (Express API)
│   ├── features/        # Feature modules (users, restaurants, cart, orders, …)
│   ├── middlewares/
│   ├── config/
│   └── scripts/seed.js  # Demo data
├── client/              # Frontend (React + Vite)
└── .env.example
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or MongoDB Atlas

## Setup

### 1. Backend

```bash
# From project root
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET

npm install
npm run seed    # Optional: load demo restaurants & menu
npm run dev     # API at http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev     # App at http://localhost:3000
```

The Vite dev server proxies `/api` requests to the backend on port 5000.

## Demo accounts

After running `npm run seed`:

| Email              | Password     | Role       | After login        |
|--------------------|--------------|------------|--------------------|
| customer@food.com  | password123  | Customer   | Browse, cart, order |
| admin@food.com     | password123  | Admin      | `/admin` dashboard |

**Fixed roles:** `customer` and `admin` only.

- **Register** (`POST /api/auth/register`): `role` must be `"customer"` or omitted.
- **Create admin**: login as admin → `POST /api/users` with `"role": "admin"`.

## API overview

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | /api/auth/register    | Register                 |
| POST   | /api/auth/login       | Login                    |
| GET    | /api/users/profile    | User profile (auth)      |
| GET    | /api/restaurants      | List restaurants         |
| GET    | /api/food-items       | List menu items          |
| POST   | /api/cart/items       | Add to cart (auth)       |
| POST   | /api/orders/checkout  | Checkout from cart       |
| GET    | /api/orders           | Customer: own orders; Admin: all |
| PUT    | /api/orders/:id       | Admin: update order status |
| GET    | /api/users            | Admin: list users        |
| POST   | /api/users            | Admin: create user       |

## Postman (Admin)

Import from the `postman/` folder:

- `FoodExpress-Admin.postman_collection.json`
- `FoodExpress-Local.postman_environment.json`

See [postman/POSTMAN-ADMIN.md](postman/POSTMAN-ADMIN.md) for step-by-step admin testing.

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start backend (nodemon)    |
| `npm run seed` | Seed demo data             |
| `npm start`    | Start backend (production) |

In `client/`:

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start frontend dev server  |
| `npm run build`| Build for production       |

## Tech stack

**Backend:** Express 5, Mongoose, JWT, bcrypt, Joi, CORS  
**Frontend:** React 19, React Router, Vite
