git# Finance Dashboard Backend

A backend API built for managing financial records with role-based access. Different users get different levels of access depending on their role — admins can do everything, analysts can manage records, and viewers can only look at data.

Built with Node.js, Express, and SQLite. JWT handles authentication.

---

## Why these tools

I went with Node and Express because I'm comfortable with them and Express doesn't force you into any specific pattern — you structure things the way that makes sense for the project. SQLite was an easy call here, no server setup, no config headaches, just a file on disk. It works perfectly for this kind of project. If this needed to scale up I'd move to Postgres but for now SQLite does the job cleanly.

JWT made sense for auth because it's stateless — the server doesn't need to track sessions anywhere. Passwords go through bcrypt before touching the database, so even if the DB gets compromised the actual passwords are safe.

---

## Project layout

```
finance-dashboard/
├── src/
│   ├── app.js                        entry point, sets up express + routes
│   ├── config/
│   │   ├── database.js               opens sqlite, creates tables on first run
│   │   └── seed.js                   loads demo users + transactions
│   ├── middleware/
│   │   ├── auth.js                   checks JWT on every protected route
│   │   └── roleCheck.js              blocks request if role isn't allowed
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   └── dashboardController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   └── dashboard.js
│   └── validators/
│       └── index.js                  all validation rules in one place
├── .env
├── package.json
└── README.md
```

Routes just wire up which middleware and controller handles a URL. Business logic stays in controllers. Middleware handles auth and role checks before anything else runs. It's a clean split and makes debugging straightforward.

---

## Getting it running

You'll need Node 18 or above. Check with `node -v` if unsure.

```bash
# install everything
npm install

# create the database and load demo data
npm run seed

# start in dev mode (auto restarts on changes)
npm run dev
```

Once it starts you'll see:

```
🚀  Finance Dashboard API running on http://localhost:3000
```

That's it. The SQLite database file gets created automatically the first time the server starts. Nothing else to configure.

---

## Demo accounts

These get created when you run the seed command:

```
admin@demo.com    →  admin123
analyst@demo.com  →  analyst123
viewer@demo.com   →  viewer123
```

---

## Roles and what they can do

Three roles in the system:

**Admin** — full access. Can manage users, create/edit/delete transactions, view all dashboard data.

**Analyst** — can create and update transactions, view everything. Can't delete transactions or touch user management.

**Viewer** — read only. Dashboard and transaction list, nothing else.

If a viewer tries to create a transaction or an analyst tries to delete one, they get a 403 back immediately. The role check runs as middleware before the controller even fires.

---

## Endpoints

### Auth (no token needed)

```
POST  /api/auth/register    create an account, role defaults to viewer
POST  /api/auth/login       returns a JWT token
GET   /api/auth/me          your own profile info
```

### Users (admin only)

```
GET    /api/users                 list users — filter by ?role= or ?status=
GET    /api/users/:id             single user
POST   /api/users                 create user
PUT    /api/users/:id             update name, email, or role
PATCH  /api/users/:id/status      flip between active and inactive
DELETE /api/users/:id             remove user
```

Supports pagination: `?page=1&limit=20`

### Transactions

```
GET    /api/transactions          all roles can read
GET    /api/transactions/:id      all roles
POST   /api/transactions          admin and analyst only
PUT    /api/transactions/:id      admin and analyst only
DELETE /api/transactions/:id      admin only
```

Filtering on the list endpoint:
```
?type=income
?type=expense
?category=Rent
?from=2024-01-01&to=2024-03-31
?page=2&limit=10
```

Deletes are soft — the record stays in the database with `is_deleted = 1`. Financial data shouldn't get permanently wiped, you might need it later for reconciliation.

### Dashboard (all roles)

```
GET /api/dashboard/summary        total income, expenses, net balance
GET /api/dashboard/categories     per-category totals, filter with ?type=expense
GET /api/dashboard/trends         month by month for the last 12 months
GET /api/dashboard/recent         latest transactions, ?limit=10 (max 50)
```

---

## How auth actually works

You hit `/api/auth/login` with email and password. Server finds the user, runs bcrypt compare against the stored hash. If it matches, creates a JWT signed with the secret from `.env` and sends it back.

For every protected route after that you send the token in the header:

```
Authorization: Bearer your-token-here
```

The `auth.js` middleware intercepts it, verifies the signature, then pulls the full user record from the database and attaches it to `req.user`. If the token is expired, tampered with, or the account got deactivated, the request stops right there.

---

## Validation

Every POST and PUT runs through express-validator before hitting any business logic. A few examples of what gets checked:

- amount must be a positive number
- type must be exactly `income` or `expense`
- date must be a proper ISO date like `2024-06-01`
- email must be valid format
- password at least 6 characters

Bad input returns a 400 with a list of what failed. The error format is consistent across all endpoints.

---

## Environment variables

The `.env` file is already included with defaults that work out of the box:

```
PORT=3000
JWT_SECRET=finance_super_secret_key_2024
JWT_EXPIRES_IN=7d
DB_PATH=./finance.db
```

Change `JWT_SECRET` to something stronger if deploying anywhere real.

---

## Database

Two tables — `users` and `transactions`. Foreign key from transactions to users tracks who created each record. Indexes are on `type`, `category`, `date`, and `is_deleted` since those are the columns queries filter on most.

Schema gets created automatically when the app starts for the first time so no manual SQL setup needed.

---

## Assumptions I made

- Open registration is allowed for easy testing. In a real product you'd probably want invite-only or restrict who can assign the admin role.
- Soft delete on transactions because financial records should be kept even after removal. Nothing gets permanently deleted from that table.
- Role is stored in the JWT payload for convenience, but the middleware still fetches the user from the database on every request. This way if someone's role changes or account gets deactivated mid-session it takes effect on the next request, not when their token expires.
- SQLite is fine for this scope. Production would want Postgres — that's a one file change in `database.js`, nothing else in the codebase would need to touch.

---

## Quick test to verify everything works

```bash
# login and grab token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# use the token
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer paste-token-here"
```

Or use Thunder Client inside VS Code — way easier than curl for testing a whole API.
