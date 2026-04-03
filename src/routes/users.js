const router = require("express").Router();
const ctrl   = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const { adminOnly }    = require("../middleware/roleCheck");
const { createUserRules, updateUserRules } = require("../validators");

// All user routes require authentication
router.use(authenticate);

router.get("/",        adminOnly, ctrl.listUsers);
router.get("/:id",     adminOnly, ctrl.getUser);
router.post("/",       adminOnly, createUserRules, ctrl.createUser);
router.put("/:id",     adminOnly, updateUserRules, ctrl.updateUser);
router.patch("/:id/status", adminOnly, ctrl.setStatus);
router.delete("/:id",  adminOnly, ctrl.deleteUser);

module.exports = router;
