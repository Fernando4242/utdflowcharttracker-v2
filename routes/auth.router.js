const express = require("express");
const controller = require("../controllers/auth.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const isNotAuthenticated = require("../middleware/isNotAuthenticated");
const router = express.Router();

// login and logout
router.get("/sign-in", isNotAuthenticated, controller.signInView);
router.post("/sign-in", isNotAuthenticated, controller.signIn);
router.get("/sign-out", controller.signOut);

// create account
router.get("/create-account", isNotAuthenticated, controller.createAccountView);
router.post("/create-account", isNotAuthenticated, controller.createAccount);

// verify email address
router.get("/verify/resend-verification", isNotAuthenticated, controller.resendVerification);
router.get("/verify/:token", isNotAuthenticated, controller.verifyEmail);

// reset password
router.get("/forgot-password", isNotAuthenticated, controller.forgotPasswordView)
router.post("/forgot-password", isNotAuthenticated, controller.sendResetPasswordLink)
router.get("/reset-password/:token", isNotAuthenticated, controller.handleResetPasswordLink)
router.post("/reset-password/:token", isNotAuthenticated, controller.updatePassword);
router.post("/reset-password", (req, res) => {
    res.status(404).send("Invalid request. Missing token.")
})

module.exports = router;