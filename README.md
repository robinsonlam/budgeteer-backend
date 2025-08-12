# Budgeteer Backend

A simple NestJS service with MongoDB and authentication flows (local email/password and Google OAuth).

## Features

- **Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google
- **Budget Management**: Create, read, update, delete budgets
- **Transaction Tracking**: Record income and expenses
- **Budget-Transaction Relationship**: Link transactions to specific budgets
- **Real-time Budget Updates**: Automatically update budget spent amounts
- **MongoDB**: Native MongoDB driver (no Mongoose)
- **JWT**: JWT-based authentication
- **TypeScript**: Full TypeScript support

## Data Models

### User
- Basic user information (email, name, password)
- Authentication provider (local or Google)
- Relationships: Can have multiple budgets

### Budget
- Budget details (name, description, total amount)
- Financial tracking (spent amount, remaining amount)
- Time period management (start/end dates, period type)
- Categories and currency support
- Relationships: Belongs to a user, can have multiple transactions

### Transaction
- Transaction details (amount, type, description)
- Categorization (category, subcategory)
- Payment tracking (payment method)
- Date and recurring transaction support
- Relationships: Belongs to a user and a budget

## Prerequisites

- Node.js (>= 20)
- MongoDB running locally or MongoDB Atlas connection
- Google OAuth credentials (for Google SSO)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables**:
   Copy `.env` file and update the values:
   ```bash
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/budgeteer
   
   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   
   # Google OAuth (get from Google Cloud Console)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

3. **Google OAuth Setup**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/auth/google/callback` to authorized redirect URIs

4. **Start MongoDB**:
   ```bash
   # If using local MongoDB
   mongod
   ```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/profile` - Get user profile (requires JWT token)

### Budgets
- `POST /budgets` - Create a new budget
- `GET /budgets` - Get all user's budgets
- `GET /budgets?active=true` - Get only active budgets
- `GET /budgets/summary` - Get budget summary with totals
- `GET /budgets/:id` - Get specific budget
- `PATCH /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

### Transactions
- `POST /transactions` - Create a new transaction
- `GET /transactions` - Get all user's transactions
- `GET /transactions?budgetId=:id` - Get transactions for specific budget
- `GET /transactions?startDate=:date&endDate=:date` - Get transactions by date range
- `GET /transactions/summary` - Get transaction summary
- `GET /transactions/budget/:budgetId` - Get transactions for specific budget
- `GET /transactions/:id` - Get specific transaction
- `PATCH /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Constants
- `GET /constants/budget-categories` - Get predefined budget categories
- `GET /constants/transaction-categories` - Get predefined transaction categories
- `GET /constants/currencies` - Get supported currencies
- `GET /constants/payment-methods` - Get payment methods
- `GET /constants/all` - Get all constants

### Health Check
- `GET /` - Basic health check
- `GET /health` - Detailed health status

## Example Usage

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create a budget
```bash
curl -X POST http://localhost:3000/budgets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Groceries",
    "description": "Budget for monthly grocery shopping",
    "totalAmount": 500,
    "currency": "USD",
    "category": "Food & Dining",
    "period": "monthly",
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }'
```

### Create a transaction
```bash
curl -X POST http://localhost:3000/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgetId": "BUDGET_ID_HERE",
    "amount": 75.50,
    "currency": "USD",
    "type": "expense",
    "category": "Groceries",
    "description": "Weekly grocery shopping",
    "date": "2025-01-15",
    "paymentMethod": "credit_card",
    "merchant": "Local Supermarket"
  }'
```

### Access protected route
```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Google OAuth
Visit `http://localhost:3000/auth/google` in your browser to start Google OAuth flow.

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── guards/          # Auth guards
│   ├── strategies/      # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── budgets/             # Budget management module
│   ├── dto/            # Data transfer objects
│   ├── interfaces/     # TypeScript interfaces
│   ├── budgets.controller.ts
│   ├── budgets.service.ts
│   └── budgets.module.ts
├── transactions/        # Transaction management module
│   ├── dto/            # Data transfer objects
│   ├── interfaces/     # TypeScript interfaces
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   └── transactions.module.ts
├── database/            # Database module
│   ├── database.service.ts
│   └── database.module.ts
├── users/               # Users module
│   ├── dto/            # Data transfer objects
│   ├── interfaces/     # TypeScript interfaces
│   ├── users.service.ts
│   └── users.module.ts
├── common/              # Shared constants and utilities
│   ├── constants.ts
│   └── constants.controller.ts
├── app.controller.ts    # Main app controller
├── app.module.ts        # Root module
└── main.ts             # Application entry point
```

## Technologies Used

- **NestJS**: Node.js framework
- **MongoDB**: Native MongoDB driver
- **Passport**: Authentication middleware
- **JWT**: JSON Web Tokens
- **bcryptjs**: Password hashing
- **class-validator**: Request validation
