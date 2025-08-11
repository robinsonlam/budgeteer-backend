# Budgeteer Backend

A simple NestJS service with MongoDB and authentication flows (local email/password and Google OAuth).

## Features

- **Authentication**: Email/password registration and login
- **Google OAuth**: Sign in with Google
- **MongoDB**: Native MongoDB driver (no Mongoose)
- **JWT**: JWT-based authentication
- **TypeScript**: Full TypeScript support

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

### Health Check

- `GET /` - Basic health check
- `GET /health` - Detailed health status

## Example Usage

### Register a new user
```bash
curl -X POST http://localhost:3000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Access protected route
```bash
curl -X GET http://localhost:3000/auth/profile \\
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
├── database/            # Database module
│   ├── database.service.ts
│   └── database.module.ts
├── users/               # Users module
│   ├── dto/            # Data transfer objects
│   ├── interfaces/     # TypeScript interfaces
│   ├── users.service.ts
│   └── users.module.ts
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
