const { body } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "analyst", "viewer"]).withMessage("Invalid role"),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const createUserRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["admin", "analyst", "viewer"]).withMessage("Invalid role"),
];

const updateUserRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email required"),
  body("role").optional().isIn(["admin", "analyst", "viewer"]).withMessage("Invalid role"),
];

const transactionRules = [
  body("amount").isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
  body("type").isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("date").isISO8601().withMessage("Date must be a valid ISO date (YYYY-MM-DD)"),
  body("notes").optional().trim(),
];

const updateTransactionRules = [
  body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be a positive number"),
  body("type").optional().isIn(["income", "expense"]).withMessage("Type must be 'income' or 'expense'"),
  body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
  body("date").optional().isISO8601().withMessage("Invalid date format"),
  body("notes").optional().trim(),
];

module.exports = {
  registerRules,
  loginRules,
  createUserRules,
  updateUserRules,
  transactionRules,
  updateTransactionRules,
};
