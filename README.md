Finance Dashboard Backend
A backend REST API for a role-based finance dashboard. Admins manage everything, analysts handle records, viewers just read. Built with Node.js, Express, and SQLite.

Live Deployment
GitHubhttps://github.com/PrachiShardul07/finance-dashboard-backendLive APIhttps://finance-dashboard-backend-production-84cf.up.railway.appHealth Checkhttps://finance-dashboard-backend-production-84cf.up.railway.app/health
Deployed on Railway. Database persists across deployments.
Try it right now
Health check — open in browser:
https://finance-dashboard-backend-production-84cf.up.railway.app/health
Login:
POST https://finance-dashboard-backend-production-84cf.up.railway.app/api/auth/login

{
  "email": "admin@demo.com",
  "password": "admin123"
}
Dashboard summary (use token from login):
GET https://finance-dashboard-backend-production-84cf.up.railway.app/api/dashboard/summary
Authorization: Bearer your-token-here
Demo accounts
admin@demo.com    /  admin123    (full access)
analyst@demo.com  /  analyst123  (create and edit transactions)
viewer@demo.com   /  viewer123   (read only)

Why these tools
Node and Express because I know them well and Express doesn't impose structure — you design it the way that fits the problem. SQLite because there's no server to configure, it's just a file, and it's more than capable here. If this needed to go to production I'd move to Postgres, but that's only a change in database.js, nothing else would need to touch.
JWT for auth because it's stateless — no session store needed. Passwords through bcrypt, so the hash in the database is useless without the original. Rate limiting on login and register to slow down brute-force attempts.

Project structure
finance-dashboard/
├── src/
│   ├── app.js                       server setup, middleware, routes
│   ├── config/
│   │   ├── database.js              sqlite connection, auto-creates schema
│   │   └── seed.js                  demo users and sample transactions
│   ├── services/                    all database logic lives here
│   │   ├── transactionService.js
│   │   ├── userService.js
│   │   └── dashboardService.js
│   ├── controllers/                 http handling only, delegates to services
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── transactionController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js                  jwt verification
│   │   ├── roleCheck.js             role-based access guards
│   │   └── rateLimiter.js           api + auth rate limits
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── transactions.js
│   │   └── dashboard.js
│   ├── validators/
│   │   └── index.js                 all validation rule sets
│   └── utils/
│       ├── response.js              consistent response formatting
│       └── pagination.js            pagination helpers
├── .env.example
├── package.json
└── README.md
The separation is intentional. Controllers only deal with the HTTP side — parsing the request and sending back a response. All the actual data work happens in services. This keeps business logic away from Express and makes it straightforward to test or swap either layer independently.

Running locally
Node 18 or above required.
bashnpm install
npm run seed
npm run dev
Server starts at http://localhost:3000. The SQLite database is created automatically on first boot, no manual setup needed.

Roles
Admin — full access, user management, all transactions including delete.
Analyst — can create and update transactions, read everything. No deletes, no user management.
Viewer — read only. Dashboard and transaction list.
Role checks happen in middleware before the controller runs, so a forbidden request never touches business logic.

Endpoints
Auth
POST /api/auth/register     open — role defaults to viewer
POST /api/auth/login        returns jwt token
GET  /api/auth/me           current user profile
POST /api/auth/seed         loads demo data (run once after fresh deploy)
Users — admin only
GET    /api/users                   list, filter by ?role= ?status= ?page= ?limit=
GET    /api/users/:id               single user
POST   /api/users                   create
PUT    /api/users/:id               update name, email, role
PATCH  /api/users/:id/status        set active or inactive
DELETE /api/users/:id               remove
Transactions
GET    /api/transactions            all roles
GET    /api/transactions/:id        all roles
POST   /api/transactions            admin + analyst
PUT    /api/transactions/:id        admin + analyst
DELETE /api/transactions/:id        admin only
Filtering on the list:
?type=income
?type=expense
?category=Rent
?search=bonus          searches category and notes
?from=2024-03-01&to=2024-03-31
?page=2&limit=10
Deletes are soft — is_deleted = 1, record stays in the database for audit purposes.
Dashboard — all roles
GET /api/dashboard/summary          income, expenses, net balance, transaction count
GET /api/dashboard/categories       totals per category — ?type=expense to filter
GET /api/dashboard/trends           monthly breakdown for last 12 months
GET /api/dashboard/recent           latest N records — ?limit=10 (max 50)

Auth flow
Login returns a signed JWT. Include it on every protected request:
Authorization: Bearer your-token-here
The middleware verifies the signature, then fetches the live user record from the database. So if an account gets deactivated or a role changes, it takes effect immediately on the next request — not when the token expires.

Rate limiting
Two limits in place:

General API — 200 requests per IP per 15 minutes across all routes
Auth routes — 20 requests per IP per 15 minutes on login and register, to slow down brute-force attempts


Validation
Every POST and PUT validates the body before anything else runs. Query params on the transaction list are also validated. Errors come back as a 400 with an array of what failed, consistent across all endpoints.
Things that get checked: amount is a positive number, type is exactly income or expense, date is ISO format, email is valid, password is at least 6 characters, pagination params are integers in range.

Environment variables
Copy .env.example to .env and fill in:
PORT=3000
JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
DB_PATH=./finance.db

Assumptions and tradeoffs
SQLite over Postgres — zero setup makes it easy to run immediately. Services layer is fully decoupled from the database driver, so swapping is one file.
Soft delete on transactions — financial records need an audit trail. Hard deleting a transaction would make reconciliation impossible. The is_deleted flag keeps it present in the database but invisible to all queries.
Open registration — kept open so demo accounts are easy to create. In a real product, self-registration for analyst or admin roles would be locked down.
JWT over sessions — stateless, no Redis or session store needed. Re-fetching the user on every request costs one indexed DB lookup but means role or status changes take effect immediately.
Services layer — controllers are intentionally thin. They parse the request and call the service. All database interaction, filtering logic, and business rules live in the service layer. This makes the code easier to follow and easier to change.
Seed endpoint — POST /api/auth/seed loads demo data on demand. Useful after a fresh deployment where the database is empty.
**Auto-seed on boot** — the app checks if the database is empty on startup and seeds it automatically. This means no manual step needed after deploying to a fresh server.

