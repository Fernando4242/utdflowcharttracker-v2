const express = require("express");
const controller = require("../controllers/flowchart.controller")
const router = express.Router();

router.get("/", controller.view);
router.get("/getData", controller.getSimplifiedFlowchartData);
router.post("/setData", controller.setFlowchartData);

module.exports = router;
