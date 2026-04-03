const jwt  = require("jsonwebtoken");
const { getDb } = require("../config/database");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const db   = getDb();
  const user = db.prepare("SELECT id, name, email, role, status FROM users WHERE id = ?").get(payload.id);

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Account is deactivated" });
  }

  req.user = user;
  next();
}

module.exports = { authenticate };
