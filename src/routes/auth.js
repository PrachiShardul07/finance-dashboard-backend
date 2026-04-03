const router = require("express").Router();
const { register, login, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { registerRules, loginRules } = require("../validators");
const { runSeed } = require("../config/seed");

router.post("/register", registerRules, register);
router.post("/login",    loginRules,    login);
router.get("/me",        authenticate,  me);

// one-time seed endpoint
router.post("/seed", (_req, res) => {
  try {
    runSeed();
    res.json({ success: true, message: "Seed complete" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;