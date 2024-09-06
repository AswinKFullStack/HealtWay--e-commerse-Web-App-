const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");


router.get("/pageNotFound",userController.pageNotFound);

router.get("/",userController.loadHomepage);
router.get("/signup",userController.loadSignup);





module.exports = router

