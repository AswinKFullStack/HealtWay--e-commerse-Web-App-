const express = require("express");
const router = express.Router();
const adminController1 = require("../controllers/adminController1");
const { route } = require("./userRouter");


router.get("/login",adminController1.loadLogin);
router.post("/login",adminController1.login);

//Dashboard 
router.get("/",adminController1.loadDashboard);








module.exports = router