const express = require("express");
const router = express.Router();
const adminController1 = require("../controllers/admin/adminController1");
const customerController = require("../controllers/admin/customerController");
const { route } = require("./userRouter");
const {userAuth,adminAuth} = require("../middlewares/auth")


//Errorpage
router.get("/pageerror",adminController1.pageError);


//Admin loging mnagment 
router.get("/login",adminController1.loadLogin);
router.post("/login",adminController1.login);

router.get("/logout",adminController1.logout)

//Dashboard 
router.get("/",adminController1.loadDashboard);

//Custermer management


router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);





module.exports = router