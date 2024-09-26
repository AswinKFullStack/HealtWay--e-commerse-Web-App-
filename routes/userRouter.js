const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController1 = require("../controllers/user/userController1");
const userController2 = require("../controllers/user/userController2");
const productController = require("../controllers/user/productController");
const profileController = require("../controllers/user/profileController");
const passwordController = require("../controllers/user/passwordController");
const addressController = require("../controllers/user/addressController");
const cartController = require("../controllers/user/cartController");  
const shopController = require("../controllers/user/shopController");  
const checkoutController = require("../controllers/user/checkoutController");  
const {userAuth,adminAuth} = require("../middlewares/auth")




//signup management 
router.get("/",userController1.loadHomepage);
router.get("/signup",userController1.loadSignup);
router.post("/signup",userController1.signup);
router.post("/verify-otp",userController1.verifyOtp);
router.post("/resend-otp",userController1.resendOtp); 


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/signup', failureFlash: true }), 
  (req, res) => {
      req.session.user = req.user._id;
      console.log("User session established after login/signup:", req.session.user);
      res.redirect('/');
  }
);


//login routes

router.get("/login",userController2.loadLogin);
router.post("/login",userController2.login);

//forgot password

router.get("/forgot-password", passwordController.getForgotPassword);
router.post("/forgot-password", passwordController.postForgotPassword);
router.post("/forgotPasswordVerify-otp",passwordController.forgotPasswordVerify);
router.post("/resendforgotPasswordVerify-otp",passwordController.resendOtpForgotPasswordVerify);
router.get("/resetPassword",userAuth,passwordController.getResetPassword);
router.post("/resetPassword",userAuth,passwordController.postResetPassword);
//logout
router.get("/logout",userController2.logout);

///Product 

///view Product
router.get('/product/view/:productId', productController.getProductView);


  //profile view 
router.get('/profileview/:id',userAuth, profileController.getProfileView);
router.get('/editUser/:id',userAuth,profileController.getEditUser);
router.post('/editUser/:id',userAuth,profileController.postEditUser);



//address managment
router.get('/addAddress',userAuth,addressController.getAddAddress);
router.post('/addAddress',userAuth,addressController.postAddAddress);
                //view all address
router.get('/addresses/:userId',userAuth, addressController.getAddressesView);
router.get('/addressEdit/:addressId',userAuth, addressController.getEditAddress);
router.post('/addressEdit/:addressId',userAuth, addressController.postEditAddress);
router.post('/addressDelete/:addressId',userAuth, addressController.deleteAddress);




//CART SECTION
router.get('/product/addCart/:productId',userAuth,cartController.addCart);
router.get('/cartView',userAuth,cartController.LoadCartPage);
               //Cart Quantity updation
router.post('/cart/update/:productId/:cartItemId',userAuth,cartController.cartUpdate);
router.get('/cart/update/:productId',userAuth,cartController.LoadCartPage);
router.post('/cartView/remove/:productId/:cartItemId',userAuth,cartController.removeCartItem);
router.post('/checkout/cart/update/:productId/:cartItemId',userAuth,cartController.cartUpdate);



///SHOP SECTION

router.get('/shop',shopController.viewAllProducts);




//CHECK OUT

router.get('/checkout',userAuth,checkoutController.checkoutLoad);
router.post('/checkout/addAddress',userAuth,addressController.postAddAddress);
router.post('/checkout/editAddress/:addressId' ,userAuth,addressController.postEditAddress);
//router.get('/wishlist/:id',userAuth, profileController.getWishlistView);
//router.get('/cart/:id',userAuth, profileController.getCartView);
//router.get('/orders/:id',userAuth, profileController.getOrdersView);

module.exports = router

