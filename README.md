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

## WaafiPay (local mobile wallet)

FoodExpress supports **WaafiPay** for EVC / ZAAD / SAHAL wallets (Week 6 integration).

### 1. Add credentials to `.env`

```env
WAAFI_MERCHANT_UID=your_merchant_uid
WAAFI_API_USER_ID=your_api_user_id
WAAFI_API_KEY=your_api_key
WAAFI_BASE_URL=https://sandbox.waafipay.com/asm
```

Never commit `.env`. Use sandbox first; production URL is `https://api.waafipay.net/asm`.

### 2. Checkout flow

```
Customer → Checkout UI → POST /api/orders/checkout → WaafiPay API_PURCHASE → Order PAID/FAILED
```

- Frontend sends `accountNo` (wallet) only — **API keys stay on the server**
- Backend recalculates total from database prices
- On `responseCode: 2001` and `state: APPROVED` → order `paymentStatus: paid`

### 3. Sandbox test wallets

| Wallet             | Number          | PIN  |
|--------------------|-----------------|------|
| EVCPlus            | 252611111111    | 1212 |
| ZAAD               | 252631111111    | 1212 |
| SAHAL              | 252901111111    | 1212 |
| WAAFI Djibouti     | 25377111111     | 1212 |
| WAAFI International| 9715111111111   | 1212 |

Wallet numbers must be full international format: digits only, no `+`, no leading zero. The backend accepts 10-20 digit wallet numbers and checks WaafiPay success using `responseCode: 2001` plus `state: APPROVED` (case-insensitive).

### 4. API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/checkout` | Checkout + WaafiPay when `paymentMethod: "waafi"` |
| GET | `/api/payments/my-history` | Customer payment history |
| POST | `/api/payments/:id/refund` | Admin — WaafiPay API_REVERSAL |
| POST | `/api/payments/:id/verify` | Admin — verify/reject cash or bank transfer |

## Offline payments

FoodExpress also supports **cash** and **bank transfer** checkout. These payments are tracked as pending until an admin verifies them.

### Cash checkout

```json
{
  "paymentMethod": "cash_on_delivery",
  "offlineDetails": {
    "notes": "Customer will pay cash on delivery"
  }
}
```

### Bank transfer checkout

```json
{
  "paymentMethod": "bank_transfer",
  "offlineDetails": {
    "bankName": "Salaam Bank",
    "accountName": "Customer Name",
    "transferReference": "BANK-REF-12345",
    "proofUrl": "https://example.com/receipt.png"
  }
}
```

Admin verification:

```json
{
  "verificationStatus": "verified",
  "verificationNote": "Transfer matched bank statement"
}
```

When verified, the linked order moves to `paymentStatus: paid` and `status: confirmed`. When rejected, the order moves to `paymentStatus: failed` and `status: cancelled`.

Customers can review payment method, payment status, verification status, and transaction/reference confirmations from their order history and order detail pages.

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
