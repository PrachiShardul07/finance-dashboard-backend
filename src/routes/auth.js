const router = require("express").Router();
const { register, login, me } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { registerRules, loginRules } = require("../validators");

router.post("/register", registerRules, register);
router.post("/login",    loginRules,    login);
router.get("/me",        authenticate,  me);

module.exports = router;
