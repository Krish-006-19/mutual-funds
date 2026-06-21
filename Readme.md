# Mutual Funds API Documentation

## Overview

This project is a backend API for a mutual fund portfolio simulator. It allows users to register, authenticate, manage a virtual portfolio, execute buy and sell transactions, review trade history, and access mutual fund market data.

The application is built with:
- Node.js and Express
- MongoDB and Mongoose
- Redis caching
- JWT authentication
- Request throttling and security middleware
- Scheduled background jobs for data updates

---

## Architecture

The codebase follows a modular structure:

- Controllers handle business logic
- Routes define API endpoints
- Models manage database schemas
- Middleware provides authentication and request protection
- Services contain integrations and background processing
- Utilities provide reusable helper functions

---

## Core Features

- User registration and authentication
- Virtual portfolio management
- Buy and sell mutual fund units
- Trade history tracking
- Portfolio performance calculations
- Market data retrieval
- Historical NAV tracking
- Redis-based caching
- Automated data refresh jobs

---

## Technology Stack

- Express
- MongoDB + Mongoose
- Redis (Upstash)
- JWT
- bcrypt
- Axios
- node-cron
- Helmet
- CORS

---

## Environment Configuration

The application requires configuration values for:

- Database connectivity
- Authentication secrets
- Redis caching
- External market-data providers
- Application runtime settings

Sensitive values should be stored securely through environment variables and never committed to source control.

---

## Project Structure

| Folder | Purpose |
|----------|----------|
| controllers | Request handling and business logic |
| middleware | Authentication and request protection |
| models | Database schemas |
| router | API route definitions |
| service | External integrations and background jobs |
| utils | Reusable utility functions |

---

## Authentication

The API uses JWT-based authentication.

Protected endpoints require:

Authorization: Bearer <token>

Authenticated users can access portfolio, trade, and account-management features.

---

## API Endpoints

### User Endpoints

Base Path: `/user`

#### POST /user/register

Creates a new user account and automatically initializes a virtual portfolio.

#### POST /user/login

Authenticates a user and returns an access token.

#### PATCH /user/update

Updates the authenticated user's profile information.

#### DELETE /user/delete

Removes the user account, associated portfolio, and related trade records.

---

### Portfolio Endpoints

Base Path: `/portfolio`

#### GET /portfolio

Returns the authenticated user's portfolio including:

- Available balance
- Current holdings
- Performance metrics
- Profit and loss calculations

#### PATCH /portfolio/:schemeCode

Executes buy or sell operations for a specific mutual fund.

Supported transaction types:

- BUY
- SELL

Validation is performed for balance availability, ownership checks, and transaction integrity before processing.

---

### Trade Endpoints

Base Path: `/trade`

#### GET /trade

Returns the authenticated user's trade history ordered by recent activity.

---

### Leaderboard Endpoint

Base Path: `/leaderboard`

#### GET /leaderboard

Returns top-performing portfolios based on the current ranking logic.

---

### Market Data Endpoints

#### GET /

Returns the available mutual fund dataset used by the application.

#### GET /:schemeCode

Returns information for a specific fund.

#### GET /history/:schemeCode

Returns historical NAV data for a specific scheme.

---

## Data Models

### User

Stores:

- Username
- Email
- Password hash
- Timestamps

### Portfolio

Stores:

- User reference
- Available balance
- Fund holdings

The portfolio model includes concurrency controls to help prevent conflicting updates during simultaneous transactions.

### Trade

Stores:

- User reference
- Transaction type
- Quantity
- Executed price
- Timestamps

### History

Stores:

- Scheme code
- Historical NAV records

---

## Services

### Latest NAV Service

Responsible for:

- Retrieving latest fund data
- Filtering supported schemes
- Caching market data
- Reducing external API load

### Historical Data Service

Responsible for:

- Fetching NAV history
- Updating stored records
- Maintaining data freshness

### Redis Service

Provides:

- Market-data caching
- Portfolio caching
- Trade-history caching

---

## Request Lifecycle

### Registration

1. User submits registration details.
2. Password is hashed.
3. User record is created.
4. Portfolio is initialized automatically.

### Login

1. User submits credentials.
2. Credentials are validated.
3. JWT access token is issued.

### Portfolio Transaction

1. Authentication is verified.
2. Request validation is performed.
3. Portfolio is loaded.
4. Market data is retrieved.
5. Transaction is processed.
6. Trade record is created.
7. Cache is invalidated.
8. Updated data is returned.

---

## Caching Strategy

Redis is used to:

- Improve response times
- Reduce database load
- Reduce external API calls
- Cache frequently accessed portfolio and market information

Cached data is refreshed automatically when necessary to maintain consistency.

---

## Security Considerations

The application implements several security measures designed to protect user data and maintain API integrity:

- Passwords are hashed using bcrypt before storage.
- JWT-based authentication protects private resources.
- Protected routes require valid authentication tokens.
- Security headers are applied using Helmet.
- Cross-origin requests are restricted through CORS configuration.
- Request throttling is applied to sensitive operations to mitigate abuse.
- Database access is validated before processing business operations.
- Portfolio updates include concurrency safeguards to prevent inconsistent state during simultaneous transactions.
- Sensitive configuration values are stored using environment variables and are never committed to source control.

---

## Background Jobs

Scheduled jobs periodically refresh market and historical fund data to keep the application current while reducing request latency during normal usage.

---

## Conclusion

This project demonstrates practical backend engineering concepts including authentication, portfolio management, caching, background processing, request protection, and API design. It is structured to remain approachable for new developers while incorporating patterns commonly used in production systems.
