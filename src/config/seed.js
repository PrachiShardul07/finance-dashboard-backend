require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getDb } = require("./database");

const db = getDb();

// ── seed users ──────────────────────────────────────────────────────────────
const users = [
  { name: "Alice Admin",    email: "admin@demo.com",   password: "admin123",   role: "admin"   },
  { name: "Ana Analyst",    email: "analyst@demo.com", password: "analyst123", role: "analyst" },
  { name: "Victor Viewer",  email: "viewer@demo.com",  password: "viewer123",  role: "viewer"  },
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role)
  VALUES (@name, @email, @password, @role)
`);

for (const u of users) {
  const hash = bcrypt.hashSync(u.password, 10);
  insertUser.run({ ...u, password: hash });
}

// ── seed transactions ────────────────────────────────────────────────────────
const adminRow = db.prepare("SELECT id FROM users WHERE email = 'admin@demo.com'").get();
const adminId  = adminRow.id;

const sampleTx = [
  { amount: 5000, type: "income",  category: "Salary",      date: "2024-03-01", notes: "March salary"       },
  { amount: 1200, type: "expense", category: "Rent",         date: "2024-03-02", notes: "Monthly rent"       },
  { amount:  300, type: "expense", category: "Groceries",    date: "2024-03-05", notes: "Weekly groceries"   },
  { amount:  800, type: "income",  category: "Freelance",    date: "2024-03-10", notes: "Design project"     },
  { amount:  150, type: "expense", category: "Utilities",    date: "2024-03-12", notes: "Electricity bill"   },
  { amount: 5000, type: "income",  category: "Salary",       date: "2024-04-01", notes: "April salary"       },
  { amount: 1200, type: "expense", category: "Rent",         date: "2024-04-02", notes: "Monthly rent"       },
  { amount:  450, type: "expense", category: "Travel",       date: "2024-04-08", notes: "Client visit"       },
  { amount:  600, type: "income",  category: "Freelance",    date: "2024-04-15", notes: "Logo design"        },
  { amount:  200, type: "expense", category: "Groceries",    date: "2024-04-18", notes: "Groceries"          },
  { amount: 5000, type: "income",  category: "Salary",       date: "2024-05-01", notes: "May salary"         },
  { amount:  900, type: "expense", category: "Rent",         date: "2024-05-02", notes: "Reduced rent"       },
  { amount:  100, type: "expense", category: "Utilities",    date: "2024-05-10", notes: "Water bill"         },
  { amount: 1500, type: "income",  category: "Investment",   date: "2024-05-20", notes: "Dividend payout"    },
  { amount:  250, type: "expense", category: "Entertainment",date: "2024-05-25", notes: "Concert tickets"    },
];

const insertTx = db.prepare(`
  INSERT OR IGNORE INTO transactions (amount, type, category, date, notes, created_by)
  VALUES (@amount, @type, @category, @date, @notes, @created_by)
`);

for (const tx of sampleTx) {
  insertTx.run({ ...tx, created_by: adminId });
}

console.log("✅  Seed complete. Demo accounts:");
console.log("   admin@demo.com   / admin123");
console.log("   analyst@demo.com / analyst123");
console.log("   viewer@demo.com  / viewer123");
