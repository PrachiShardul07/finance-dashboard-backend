const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const { getDb } = require("../config/database");

function listUsers(req, res) {
  const db = getDb();
  const { role, status, page = 1, limit = 20 } = req.query;

  let where  = "WHERE 1=1";
  const args = [];

  if (role) {
    where += " AND role = ?";
    args.push(role);
  }
  if (status) {
    where += " AND status = ?";
    args.push(status);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total  = db.prepare(`SELECT COUNT(*) as cnt FROM users ${where}`).get(...args).cnt;
  const rows   = db.prepare(
    `SELECT id, name, email, role, status, created_at FROM users ${where}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...args, parseInt(limit), offset);

  return res.json({
    data: rows,
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
}

function getUser(req, res) {
  const db   = getDb();
  const user = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?").get(req.params.id);

  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user });
}

function createUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role = "viewer" } = req.body;
  const db = getDb();

  if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const hash   = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO users (name, email, password, role) VALUES (@name, @email, @password, @role)"
  ).run({ name, email, password: hash, role });

  const user = db.prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ message: "User created", user });
}

function updateUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db   = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, email, role } = req.body;

  // prevent non-admin from editing another user
  if (req.user.role !== "admin" && req.user.id !== user.id) {
    return res.status(403).json({ error: "Cannot modify another user's profile" });
  }

  if (email && email !== user.email) {
    const conflict = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
    if (conflict) return res.status(409).json({ error: "Email already taken" });
  }

  db.prepare(`
    UPDATE users SET
      name       = COALESCE(@name, name),
      email      = COALESCE(@email, email),
      role       = COALESCE(@role, role),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ name: name || null, email: email || null, role: role || null, id: user.id });

  const updated = db.prepare("SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?").get(user.id);
  return res.json({ message: "User updated", user: updated });
}

function setStatus(req, res) {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'active' or 'inactive'" });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // admins cannot deactivate themselves
  if (user.id === req.user.id && status === "inactive") {
    return res.status(400).json({ error: "You cannot deactivate your own account" });
  }

  db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, user.id);
  return res.json({ message: `User marked as ${status}` });
}

function deleteUser(req, res) {
  const db   = getDb();
  const user = db.prepare("SELECT id FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.id === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  return res.json({ message: "User deleted" });
}

module.exports = { listUsers, getUser, createUser, updateUser, setStatus, deleteUser };
