const router = require("express").Router();
const ctrl   = require("../controllers/transactionController");
const { authenticate }              = require("../middleware/auth");
const { adminOnly, analystPlus, allRoles } = require("../middleware/roleCheck");
const { transactionRules, updateTransactionRules } = require("../validators");

router.use(authenticate);

// Anyone logged in can read
router.get("/",    allRoles,    ctrl.listTransactions);
router.get("/:id", allRoles,    ctrl.getTransaction);

// Admin and Analyst can create / update
router.post("/",   analystPlus, transactionRules,       ctrl.createTransaction);
router.put("/:id", analystPlus, updateTransactionRules, ctrl.updateTransaction);

// Only Admin can delete
router.delete("/:id", adminOnly, ctrl.deleteTransaction);

module.exports = router;
