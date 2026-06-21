# Mutual Funds API Documentation

## Overview

This project is a backend API for a mutual fund portfolio simulator. It lets a user register, log in, manage a virtual portfolio, buy or sell mutual fund units, view trade history, and fetch fund data from external sources.

The application uses:
- Node.js and Express for the API server
- MongoDB for persistent storage
- Redis for caching
- JWT for authentication
- Upstash Rate Limit for trade request throttling
- node-cron for scheduled fund history updates

The codebase is organized in a simple and beginner-friendly way:
- `controllers` handle request logic
- `routes` map URLs to controllers
- `models` define MongoDB schemas
- `middleware` handles auth and request limits
- `service` contains external integrations and background logic
- `utils` stores small helper functions

---

## How the application works

A user first registers and gets a portfolio created automatically with an initial virtual balance of **10000**.

After login, the server returns a JWT access token. This token must be sent in the `Authorization` header for protected endpoints.

The portfolio tracks:
- available balance
- owned mutual fund units
- average buy price for each fund
- current value and profit/loss, calculated from the latest NAV data

The application also keeps a trade log so every buy and sell action can be reviewed later.

---

## Tech stack

- **Express**: HTTP server and routing
- **MongoDB + Mongoose**: database and schema management
- **Redis (Upstash)**: caching and rate limiting
- **JWT**: authentication
- **bcrypt**: password hashing
- **axios**: external API calls
- **node-cron**: scheduled background jobs
- **helmet**: security headers
- **cors**: cross-origin request handling

---

## Environment variables

These variables are used by the code:

| Variable | Purpose |
|---|---|
| `PORT` | Server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `UPSTASH_REDIS_REST_URL` | Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Redis REST token |
| `ALL_FUNDS_API` | API endpoint for the latest fund list |
| `FUND_HISTORY_API` | API endpoint for fund history data |
| `FIFTY_FUNDS` | JSON array of scheme codes used by the app |

---

## Project structure

| Folder/File | Purpose |
|---|---|
| `index.js` | Main Express app entry point |
| `cronjob.js` | Schedules the daily fund history update |
| `controllers/` | Route handlers |
| `middleware/` | Authentication and rate limiting |
| `models/` | MongoDB schemas |
| `router/` | API routes |
| `service/` | External API, Redis, cron, and rate limit logic |
| `utils/` | Small helper functions |

---

## Server setup and global behavior

### `index.js`

The server does the following:
- loads environment variables
- starts the cron job
- connects to MongoDB
- enables CORS for the frontend origin
- adds security headers using Helmet
- parses JSON and URL-encoded request bodies
- exposes a health check route
- mounts the API routers

### Health check

`GET /health`

Response:
```json
{ "message": "Welcome to Market for Dummies API" }
```

---

## Authentication

### Token creation

When a user logs in, the server creates a JWT token using the user's MongoDB `_id`.

### Token verification

Protected routes expect this header:

```http
Authorization: Bearer <token>
```

If the token is missing or invalid, the request is rejected.

### Protected routes

These endpoints require authentication:
- `GET /portfolio`
- `PATCH /portfolio/:schemeCode`
- `GET /trade`
- `PATCH /user/update`
- `DELETE /user/delete`

---

## API endpoints

## 1. User routes

Base path: `/user`

### `POST /user/register`

Creates a new user account.

Request body:
```json
{
  "username": "krish",
  "email": "krish@example.com",
  "password": "secret123"
}
```

Behavior:
- validates that all fields are present
- hashes the password with bcrypt
- saves the user in MongoDB
- creates a portfolio automatically with:
  - `remainingBalance: 10000`
  - empty `funds` array

Success response:
```json
{ "message": "User created successfully" }
```

### `POST /user/login`

Logs in a user and returns an access token.

Request body:
```json
{
  "email": "krish@example.com",
  "password": "secret123"
}
```

Success response:
```json
{
  "message": "Login successful",
  "userId": "mongo_user_id",
  "accessToken": "jwt_token"
}
```

### `PATCH /user/update`

Updates the authenticated user.

Headers:
```http
Authorization: Bearer <token>
```

Request body:
```json
{
  "username": "newname",
  "email": "newemail@example.com",
  "password": "newpassword"
}
```

Behavior:
- updates the current user's profile
- hashes the new password before saving

### `DELETE /user/delete`

Deletes the authenticated user.

Headers:
```http
Authorization: Bearer <token>
```

Behavior:
- deletes the user's portfolio
- deletes all trade records for that user
- deletes the user account

---

## 2. Portfolio routes

Base path: `/portfolio`

### `GET /portfolio`

Returns the authenticated user's portfolio.

Headers:
```http
Authorization: Bearer <token>
```

Behavior:
- checks Redis cache first
- loads the portfolio from MongoDB if not cached
- fetches the latest fund NAV data
- calculates for every holding:
  - current NAV
  - invested value
  - current value
  - profit or loss
  - profit or loss percentage

Returned portfolio data includes:
- `remainingBalance`
- `funds`
- calculated performance values for each fund

### `PATCH /portfolio/:schemeCode`

Buys or sells a mutual fund unit for the authenticated user.

Headers:
```http
Authorization: Bearer <token>
```

Request body:
```json
{
  "type": "BUY",
  "quantity": 2
}
```

or

```json
{
  "type": "SELL",
  "quantity": 1
}
```

Path parameter:
- `schemeCode`: the fund scheme code

Behavior for `BUY`:
- validates quantity and transaction type
- checks whether the user has enough remaining balance
- adds the fund to the portfolio or increases the existing quantity
- recalculates average buy price
- creates a trade entry

Behavior for `SELL`:
- checks whether the fund exists in the portfolio
- ensures the user has enough units to sell
- reduces quantity or removes the fund if quantity reaches zero
- adds the sale amount back to the balance
- creates a trade entry

Other behavior:
- uses a trade rate limit
- saves the updated portfolio
- clears related Redis cache

Error cases include:
- invalid input
- insufficient balance
- fund not found
- not enough units
- concurrent modification conflict

---

## 3. Trade routes

Base path: `/trade`

### `GET /trade`

Returns all trades for the authenticated user.

Headers:
```http
Authorization: Bearer <token>
```

Behavior:
- checks Redis cache first
- loads the user's trades from MongoDB if not cached
- sorts them by newest first

Trade records are returned without the internal MongoDB fields and without `userId`.

---

## 4. Leaderboard route

Base path: `/leaderboard`

### `GET /leaderboard`

Returns the top 10 portfolios sorted by `remainingBalance` in descending order.

Behavior:
- fetches all portfolios
- sorts them by balance
- limits the response to 10 records

Note:
This route does not require authentication in the current implementation.

---

## 5. Market data routes

Base path: `/`

These routes expose fund and history data.

### `GET /`

Returns the latest T50 fund list.

Behavior:
- fetches the latest fund data
- filters it to the funds listed in `FIFTY_FUNDS`
- caches the result in Redis for 6 hours

### `GET /:schemeCode`

Returns a single fund by its scheme code.

Path parameter:
- `schemeCode`

Behavior:
- checks Redis cache first
- loads the latest T50 fund list if needed
- finds the matching fund
- caches the individual fund in Redis for 6 hours

### `GET /history/:schemeCode`

Returns historical NAV data for a scheme code.

Path parameter:
- `schemeCode`

Behavior:
- checks Redis cache first
- looks up the fund history in MongoDB
- verifies the stored history date against the latest fund date
- refreshes the history if the data appears outdated
- caches the history in Redis for 6 hours

---

## Data models

## User model

Collection: `users`

Fields:
- `username` — required, unique
- `email` — required, unique, indexed
- `password` — required, stored as a bcrypt hash
- timestamps are enabled

## Portfolio model

Collection: `portfolios`

Fields:
- `userId` — required, unique, indexed, references `User`
- `remainingBalance` — number, default `0`
- `funds` — array of holdings

Each holding contains:
- `symbol`
- `quantity`
- `avgPrice`

Important detail:
- `optimisticConcurrency` is enabled, which helps detect conflicting updates

## Trade model

Collection: `trades`

Fields:
- `userId` — required, references `User`
- `symbol` — required
- `type` — either `BUY` or `SELL`
- `quantity` — required
- `price` — required
- timestamps are enabled

Additional index:
- `{ userId: 1, createdAt: -1 }`

## History model

Collection: `histories`

Fields:
- `schemeCode` — required, unique, indexed
- `data` — array of history records

Each history record contains:
- `date`
- `nav`

---

## Services

## `service/LatestNav.service.js`

This service fetches the latest fund list from the external API.

Behavior:
- checks Redis cache first
- fetches raw text data using Axios
- parses the semicolon-separated data
- filters it to the scheme codes from `FIFTY_FUNDS`
- caches the result for 6 hours

## `service/cronfunctionality.service.js`

This service refreshes historical NAV data for all scheme codes in `FIFTY_FUNDS`.

Behavior:
- loops through each scheme code
- fetches history data from the external API
- upserts the result into MongoDB
- logs progress and errors

## `service/rateLimit.service.js`

This service defines the trade rate limiter.

Current rule:
- 10 trade requests per 5 seconds per user

## `service/redisSetup.service.js`

This service creates the Redis client using Upstash credentials.

---

## Middleware

## `middleware/auth.middleware.js`

### `createToken(user)`
Creates a JWT token that contains the user's MongoDB `_id`.

### `verifyToken(req, res, next)`
Checks the `Authorization` header and rejects the request if:
- the token is missing
- the token is invalid

## `middleware/tradeRateLimit.middleware.js`

Applies the trade request limit before allowing portfolio updates.

---

## Utility functions

## `utils/parseData.util.js`

Converts the external fund data response into structured JavaScript objects.

The parser expects:
- semicolon-separated rows
- a header row
- exactly 6 columns per data row

## `utils/dateConverter.util.js`

Converts dates from the format:
- `dd-mon-yyyy`

to:
- `dd-mm-yyyy`

This is used when comparing dates in fund history records.

---

## Request flow summary

### Registration flow
1. User submits username, email, and password.
2. Password is hashed.
3. User is saved in MongoDB.
4. A portfolio is created automatically with 10000 virtual balance.

### Login flow
1. User submits email and password.
2. Credentials are verified.
3. JWT token is returned.

### Buy or sell flow
1. User sends a trade request with token.
2. Token is verified.
3. Rate limit is checked.
4. Portfolio is loaded.
5. Latest NAV is fetched.
6. Portfolio values are updated.
7. Trade is stored.
8. Related cache entries are cleared.

### Portfolio read flow
1. User requests portfolio with token.
2. Cache is checked.
3. Portfolio is loaded if cache is empty.
4. Latest NAV is fetched.
5. Profit/loss is calculated.
6. Result is returned.

---

## Caching strategy

Redis is used for performance and reduced database/API calls.

Cached keys used in the project:
- `t50_funds`
- `fund:<schemeCode>`
- `fund_history:<schemeCode>`
- `portfolio:<userId>`
- `trades:<userId>`

General behavior:
- fund and history data are cached for 6 hours
- portfolio cache is cleared after trades
- trade cache is cleared after portfolio updates

---

## Security notes

The project already includes several useful protections:
- password hashing with bcrypt
- JWT-based authentication
- Helmet for security headers
- CORS restricted to the deployed frontend origin
- rate limiting on trade actions
  
---

## Final note

This backend is a practical starter implementation for a mutual fund simulator. The code is structured cleanly enough that a beginner can follow the flow, but it still contains enough real-world pieces such as authentication, caching, rate limiting, and cron jobs to make it useful as a portfolio project.
