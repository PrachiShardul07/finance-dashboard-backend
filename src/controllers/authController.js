const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { getDb } = require("../config/database");

function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role = "viewer" } = req.body;
  const db = getDb();

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`
    INSERT INTO users (name, email, password, role)
    VALUES (@name, @email, @password, @role)
  `);

  const result = stmt.run({ name, email, password: hash, role });
  const user   = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?").get(result.lastInsertRowid);

  return res.status(201).json({ message: "Account created", user });
}

function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const db   = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Account is deactivated. Contact an admin." });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

function me(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, me };
