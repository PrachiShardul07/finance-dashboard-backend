const router = require("express").Router();
const ctrl   = require("../controllers/dashboardController");
const { authenticate }  = require("../middleware/auth");
const { allRoles }      = require("../middleware/roleCheck");

router.use(authenticate);
router.use(allRoles);  // all authenticated roles can view the dashboard

router.get("/summary",    ctrl.summary);
router.get("/categories", ctrl.categoryBreakdown);
router.get("/trends",     ctrl.monthlyTrends);
router.get("/recent",     ctrl.recentActivity);

module.exports = router;
