const { validationResult } = require("express-validator");
const { getDb } = require("../config/database");

function listTransactions(req, res) {
  const db = getDb();
  const { type, category, from, to, page = 1, limit = 20 } = req.query;

  let where  = "WHERE is_deleted = 0";
  const args = [];

  if (type) {
    where += " AND type = ?";
    args.push(type);
  }
  if (category) {
    where += " AND category LIKE ?";
    args.push(`%${category}%`);
  }
  if (from) {
    where += " AND date >= ?";
    args.push(from);
  }
  if (to) {
    where += " AND date <= ?";
    args.push(to);
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const total  = db.prepare(`SELECT COUNT(*) as cnt FROM transactions ${where}`).get(...args).cnt;
  const rows   = db.prepare(
    `SELECT t.*, u.name as created_by_name FROM transactions t
     JOIN users u ON u.id = t.created_by
     ${where} ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?`
  ).all(...args, parseInt(limit), offset);

  return res.json({
    data: rows,
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
}

function getTransaction(req, res) {
  const db = getDb();
  const tx = db.prepare(`
    SELECT t.*, u.name as created_by_name FROM transactions t
    JOIN users u ON u.id = t.created_by
    WHERE t.id = ? AND t.is_deleted = 0
  `).get(req.params.id);

  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  return res.json({ transaction: tx });
}

function createTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { amount, type, category, date, notes } = req.body;
  const db = getDb();

  const result = db.prepare(`
    INSERT INTO transactions (amount, type, category, date, notes, created_by)
    VALUES (@amount, @type, @category, @date, @notes, @created_by)
  `).run({ amount, type, category, date, notes: notes || null, created_by: req.user.id });

  const tx = db.prepare("SELECT * FROM transactions WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json({ message: "Transaction created", transaction: tx });
}

function updateTransaction(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const tx = db.prepare("SELECT * FROM transactions WHERE id = ? AND is_deleted = 0").get(req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  const { amount, type, category, date, notes } = req.body;

  db.prepare(`
    UPDATE transactions SET
      amount     = COALESCE(@amount, amount),
      type       = COALESCE(@type, type),
      category   = COALESCE(@category, category),
      date       = COALESCE(@date, date),
      notes      = COALESCE(@notes, notes),
      updated_at = datetime('now')
    WHERE id = @id
  `).run({ amount: amount || null, type: type || null, category: category || null, date: date || null, notes: notes || null, id: tx.id });

  const updated = db.prepare("SELECT * FROM transactions WHERE id = ?").get(tx.id);
  return res.json({ message: "Transaction updated", transaction: updated });
}

function deleteTransaction(req, res) {
  const db = getDb();
  const tx = db.prepare("SELECT id FROM transactions WHERE id = ? AND is_deleted = 0").get(req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });

  // soft delete
  db.prepare("UPDATE transactions SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?").run(tx.id);
  return res.json({ message: "Transaction deleted" });
}

module.exports = { listTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
