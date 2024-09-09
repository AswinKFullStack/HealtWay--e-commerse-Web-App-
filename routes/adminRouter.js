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
router.get("/",adminAuth,adminController1.loadDashboard);

//Custermer management


router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked);
router.get("/unblockCustomer",adminAuth,customerController.customerUnblocked);

//Catogory management

router.get("/categories",adminAuth,categoryController.categoryInfo); // Route to list categories with pagination and search
router.post('/category/offer/add/:id',adminAuth,categoryController.addCategoryOffer);// Route to add offer to a category
router.get('/category/offer/remove/:id',adminAuth,categoryController.removeCategoryOffer);// Route to remove offer from a category
                      // Add new category
router.get('/addCategory', adminAuth, categoryController.getAddCategory);
router.post('/addCategory', adminAuth, categoryController.postAddCategory);
                      // Edit category
router.get('/category/edit/:id', adminAuth, categoryController.getEditCategory);
router.post('/category/edit/:id', adminAuth, categoryController.postEditCategory);
                      //Deleting Category
router.get('/category/delete/:id', adminAuth, categoryController.deleteCategory);
                    //Viewing Single Category
router.get('/category/view/:id', adminAuth, categoryController.viewCategoryDetails);

// aList and unlist
router.get('/category/list/:id', adminAuth, categoryController.listCategory);
router.get('/category/unlist/:id', adminAuth, categoryController.unlistCategory);

module.exports = router