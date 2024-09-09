const express = require("express");
const router = express.Router();
const adminController1 = require("../controllers/admin/adminController1");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController")
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

//Catogory management

router.get("/categories",adminAuth,categoryController.categoryInfo); // Route to list categories with pagination and search
router.post('/category/offer/add/:id',adminAuth, categoryController.addCategoryOffer);// Route to add offer to a category
router.post('/category/offer/remove/:id',adminAuth, categoryController.removeCategoryOffer);// Route to remove offer from a category


module.exports = router