const express = require("express");
const controller = require("../controllers/account.controller")
const router = express.Router();

router.get("/settings", controller.accountView);
router.post("/settings", controller.setData);

module.exports = router;