require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getDb } = require("./database");

function runSeed() {
  const db = getDb();

  // INSERT OR IGNORE means this is safe to run on every boot
  // even if users already exist, nothing gets duplicated
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, email, password, role)
    VALUES (@name, @email, @password, @role)
  `);

  const users = [
    { name: "Alice Admin",   email: "admin@demo.com",   password: "admin123",   role: "admin"   },
    { name: "Ana Analyst",   email: "analyst@demo.com", password: "analyst123", role: "analyst" },
    { name: "Victor Viewer", email: "viewer@demo.com",  password: "viewer123",  role: "viewer"  },
  ];

  for (const u of users) {
    const hash = bcrypt.hashSync(u.password, 10);
    insertUser.run({ ...u, password: hash });
  }

  const adminRow = db.prepare("SELECT id FROM users WHERE email = 'admin@demo.com'").get();
  const adminId  = adminRow.id;

  const insertTx = db.prepare(`
    INSERT OR IGNORE INTO transactions (id, amount, type, category, date, notes, created_by)
    VALUES (@id, @amount, @type, @category, @date, @notes, @created_by)
  `);

  const sampleTx = [
    { id:1,  amount: 5000, type: "income",  category: "Salary",        date: "2024-03-01", notes: "March salary"      },
    { id:2,  amount: 1200, type: "expense", category: "Rent",           date: "2024-03-02", notes: "Monthly rent"      },
    { id:3,  amount:  300, type: "expense", category: "Groceries",      date: "2024-03-05", notes: "Weekly groceries"  },
    { id:4,  amount:  800, type: "income",  category: "Freelance",      date: "2024-03-10", notes: "Design project"    },
    { id:5,  amount:  150, type: "expense", category: "Utilities",      date: "2024-03-12", notes: "Electricity bill"  },
    { id:6,  amount: 5000, type: "income",  category: "Salary",         date: "2024-04-01", notes: "April salary"      },
    { id:7,  amount: 1200, type: "expense", category: "Rent",           date: "2024-04-02", notes: "Monthly rent"      },
    { id:8,  amount:  450, type: "expense", category: "Travel",         date: "2024-04-08", notes: "Client visit"      },
    { id:9,  amount:  600, type: "income",  category: "Freelance",      date: "2024-04-15", notes: "Logo design"       },
    { id:10, amount:  200, type: "expense", category: "Groceries",      date: "2024-04-18", notes: "Groceries"         },
    { id:11, amount: 5000, type: "income",  category: "Salary",         date: "2024-05-01", notes: "May salary"        },
    { id:12, amount:  900, type: "expense", category: "Rent",           date: "2024-05-02", notes: "Reduced rent"      },
    { id:13, amount:  100, type: "expense", category: "Utilities",      date: "2024-05-10", notes: "Water bill"        },
    { id:14, amount: 1500, type: "income",  category: "Investment",     date: "2024-05-20", notes: "Dividend payout"   },
    { id:15, amount:  250, type: "expense", category: "Entertainment",  date: "2024-05-25", notes: "Concert tickets"   },
  ];

  for (const tx of sampleTx) {
    insertTx.run({ ...tx, created_by: adminId });
  }

  console.log("✅  Seed complete — demo accounts ready");
}

if (require.main === module) {
  runSeed();
}

module.exports = { runSeed };