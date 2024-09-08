const express = require("express");
const router = express.Router();
const adminController1 = require("../controllers/adminController1");
const { route } = require("./userRouter");


router.get("/login",adminController1.loadLogin);









module.exports = router