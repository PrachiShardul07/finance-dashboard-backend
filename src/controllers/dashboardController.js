const { getDb } = require("../config/database");

function summary(req, res) {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
      COUNT(*) AS total_transactions
    FROM transactions
    WHERE is_deleted = 0
  `).get();

  return res.json({
    total_income:       totals.total_income      || 0,
    total_expenses:     totals.total_expenses    || 0,
    net_balance:        (totals.total_income || 0) - (totals.total_expenses || 0),
    total_transactions: totals.total_transactions || 0,
  });
}

function categoryBreakdown(req, res) {
  const db  = getDb();
  const { type } = req.query;   // optional: filter by 'income' or 'expense'

  let where = "WHERE is_deleted = 0";
  const args = [];

  if (type && ["income", "expense"].includes(type)) {
    where += " AND type = ?";
    args.push(type);
  }

  const rows = db.prepare(`
    SELECT category, type,
           SUM(amount)  AS total,
           COUNT(*)     AS count
    FROM transactions
    ${where}
    GROUP BY category, type
    ORDER BY total DESC
  `).all(...args);

  return res.json({ data: rows });
}

function monthlyTrends(req, res) {
  const db = getDb();

  // last 12 months by default
  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', date) AS month,
      SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
    FROM transactions
    WHERE is_deleted = 0
      AND date >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  // compute net for each row
  const data = rows.map(r => ({
    month:    r.month,
    income:   r.income   || 0,
    expenses: r.expenses || 0,
    net:      (r.income || 0) - (r.expenses || 0),
  }));

  return res.json({ data });
}

function recentActivity(req, res) {
  const db    = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);

  const rows = db.prepare(`
    SELECT t.id, t.amount, t.type, t.category, t.date, t.notes,
           u.name AS created_by_name
    FROM transactions t
    JOIN users u ON u.id = t.created_by
    WHERE t.is_deleted = 0
    ORDER BY t.date DESC, t.id DESC
    LIMIT ?
  `).all(limit);

  return res.json({ data: rows });
}

module.exports = { summary, categoryBreakdown, monthlyTrends, recentActivity };
