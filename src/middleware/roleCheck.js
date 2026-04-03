// Role hierarchy: admin > analyst > viewer
// Pass one or more allowed roles; the request proceeds only if the user's role is included.

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }

    next();
  };
}

// Convenience shorthands used across routes
const adminOnly    = requireRole("admin");
const analystPlus  = requireRole("admin", "analyst");   // analyst or above
const allRoles     = requireRole("admin", "analyst", "viewer");

module.exports = { requireRole, adminOnly, analystPlus, allRoles };
