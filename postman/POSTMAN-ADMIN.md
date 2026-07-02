# Postman — Admin Testing Guide

## Fix your errors

| Error | Cause | Fix |
|-------|--------|-----|
| `401` on `POST /api/users` | No JWT token | Run **Login Admin** first → use **Bearer Token** |
| `400` on `POST /api/auth/register` | `role: "admin"` or bad data | Use `"role": "customer"` only |
| `409` on register | Email already exists | Use **Login** or a **new email** |

### Correct order (always)

```
1. POST /api/auth/login     (admin@food.com)  → copy token
2. POST /api/users          (Bearer token)    → create ila@gmail.com admin
3. POST /api/auth/login     (ila@gmail.com)   → login as your admin
```

**Do NOT skip step 1** before `POST /api/users`.

## Import files

1. Open Postman → **Import**
2. Select both files in the `postman/` folder:
   - `FoodExpress-Local.postman_environment.json`
   - `FoodExpress-Admin.postman_collection.json`
3. Choose environment **FoodExpress Local** (top-right)

## Before testing

```bash
npm run seed
npm run dev
```

Server must run on `http://localhost:5000`.

## Common errors

### `404` on `/api/v1/auth/register`

Wrong URL. This API has **no** `/api/v1` prefix. Use:

```text
http://localhost:5000/api/auth/register
```

### `400` — role error on register

On **`POST /api/auth/register`**, `role` must be **`"customer"`** or omitted (defaults to customer).

- `"role": "admin"` on register → **400** (use `POST /api/users` instead)
- `"role": "customer"` or no role → **201** success

## Admin account (seed)

| Email | Password |
|-------|----------|
| admin@food.com | password123 |

## Correct order in Postman

| Step | Request | Purpose |
|------|---------|---------|
| 1 | `00 Setup` → Health Check | API is running |
| 2 | `01 Auth` → **Login Admin** | Saves `adminToken` automatically |
| 3 | `02 Orders` → Get All Orders | Admin sees every order |
| 4 | `02 Orders` → Update Order Status | Set `confirmed`, etc. |
| 5 | `03 Payments` → Get All Payments | Admin-only |
| 6 | `04 Categories` → Create Category | Admin-only |
| 7 | `05 Restaurants` → Create Restaurant | Admin-only |
| 8 | `06 Food Items` → Create Food Item | Needs `restaurantId` + `categoryId` |
| 9 | `07 Users` → Get All Users | Admin-only |
| 10 | `99 Verify` → Customer GET Payments | Should return **403** |

## Authorization

After **Login Admin**, all requests use:

```
Authorization: Bearer {{adminToken}}
```

The collection is configured at folder level. **Login Admin** has no auth.

## Variables (auto-filled by tests)

| Variable | Set by |
|----------|--------|
| `adminToken` | Login Admin |
| `orderId` | Get All Orders |
| `restaurantId` | Get Restaurants |
| `categoryId` | Get Categories |
| `foodItemId` | Get Food Items |

## Promote existing account to Admin (`ila@gmail.com`)

If the account registered as **customer**, promote it:

**Terminal:**
```bash
npm run promote-admin -- ila@gmail.com
```

**Postman** (after Login Admin):
```http
PATCH {{baseUrl}}/api/users/email/ila@gmail.com/role
Authorization: Bearer {{adminToken}}

{ "role": "admin" }
```

Then login as `ila@gmail.com` — response shows `"role": "admin"`.

## Create your own admin (`ila@gmail.com`)

1. **Login Admin** → `admin@food.com` / `password123`
2. **POST** `{{baseUrl}}/api/users` with Bearer `{{adminToken}}`:

```json
{
  "name": "Ila Admin",
  "email": "ila@gmail.com",
  "password": "123456",
  "role": "admin",
  "phone": "6899788"
}
```

3. **Login** with `ila@gmail.com` / `123456`

## Register as customer only

**POST** `{{baseUrl}}/api/auth/register` — `role` must be **`customer`** (or omit it):

```json
{
  "name": "Ila Customer",
  "email": "ila@gmail.com",
  "password": "123456",
  "role": "customer",
  "phone": "6899788"
}
```

## Quick manual login (if no script)

**POST** `http://localhost:5000/api/auth/login`

```json
{
  "email": "admin@food.com",
  "password": "password123"
}
```

Copy `token` → Environment → `adminToken`.

## Profile (any logged-in user)

| Method | URL | Notes |
|--------|-----|--------|
| GET | `/api/users/profile` | Read your profile |
| PUT | `/api/users/profile` | Update name, email, phone, password, addresses |
| DELETE | `/api/users/profile` | Delete your own account |
| POST | `/api/auth/register` | Create account (customer only) |

**PUT** body example:

```json
{
  "name": "Ila",
  "email": "ila@gmail.com",
  "phone": "6899788"
}
```

After updating your name on the profile page, the admin sidebar and navbar will show the new name on next save (session refreshes automatically).

## WaafiPay checkout (customer)

**POST** `{{baseUrl}}/api/orders/checkout` with Bearer token (customer login):

```json
{
  "deliveryAddress": {
    "street": "Wadada 1",
    "city": "Mogadishu",
    "state": "Banaadir",
    "zipCode": "001",
    "country": "Somalia"
  },
  "paymentMethod": "waafi",
  "accountNo": "252611111111"
}
```

Success: `responseCode` 2001 + `params.state` APPROVED → order `paymentStatus: paid`.

Sandbox wallets: `252611111111`, `252631111111`, `252901111111`, `25377111111`, `9715111111111` (PIN 1212).

Use full international format only: digits, no `+`, no leading zero. Success means `responseCode` is `2001` and WaafiPay state is `APPROVED` / `approved`.

**Refund (admin):** `POST /api/payments/:id/refund`

## Offline payments (cash / bank transfer)

Cash and bank transfer checkouts create a payment with:

- `status: "pending"`
- `verificationStatus: "pending"`
- order `paymentStatus: "pending"`

### Cash checkout

**POST** `{{baseUrl}}/api/orders/checkout` with customer Bearer token:

```json
{
  "deliveryAddress": {
    "street": "Wadada 1",
    "city": "Mogadishu",
    "state": "Banaadir",
    "zipCode": "001",
    "country": "Somalia"
  },
  "paymentMethod": "cash_on_delivery",
  "offlineDetails": {
    "notes": "Customer will pay cash on delivery"
  }
}
```

### Bank transfer checkout

```json
{
  "deliveryAddress": {
    "street": "Wadada 1",
    "city": "Mogadishu",
    "state": "Banaadir",
    "zipCode": "001",
    "country": "Somalia"
  },
  "paymentMethod": "bank_transfer",
  "offlineDetails": {
    "bankName": "Salaam Bank",
    "accountName": "Ila Customer",
    "transferReference": "BANK-REF-12345",
    "proofUrl": "https://example.com/receipt.png"
  }
}
```

### Verify or reject offline payment (admin)

**POST** `{{baseUrl}}/api/payments/:id/verify`

```json
{
  "verificationStatus": "verified",
  "verificationNote": "Transfer matched bank statement"
}
```

Use `"rejected"` to reject the payment. Verified payments confirm the order; rejected payments cancel it.

## Admin endpoints summary

| Method | URL | Admin only |
|--------|-----|------------|
| GET | `/api/orders` | Sees all orders |
| PUT/DELETE | `/api/orders/:id` | Update / delete |
| GET/POST/PUT/DELETE | `/api/payments` | Yes |
| POST | `/api/payments/:id/verify` | Verify/reject offline payment |
| GET/POST/PUT/DELETE | `/api/categories` | Yes |
| GET/POST/PUT/DELETE | `/api/restaurants` | Yes |
| GET/POST/PUT/DELETE | `/api/food-items` | Yes |
| GET/POST/PUT/DELETE | `/api/users` | Yes |
| GET/POST/PUT/DELETE | `/api/delivery` | Yes |
| GET | `/api/cart/admin/all` | List all carts |
| DELETE | `/api/cart/admin/:customerId` | Clear a cart |

## Submit assignment

Export collection: **⋯** → Export → Collection v2.1  
Attach screenshots of Login Admin + Get All Orders + Get All Payments (status 200).
