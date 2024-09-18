const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController1 = require("../controllers/user/userController1");
const userController2 = require("../controllers/user/userController2");
const productController = require("../controllers/user/productController");
const profileController = require("../controllers/user/profileController");
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
     
      res.redirect('/');
  }
);


//login routes

router.get("/login",userController2.loadLogin);
router.post("/login",userController2.login);


//logout
router.get("/logout",userController2.logout);

///Product 

///view Product
router.get('/product/view/:id', productController.getProductView);

  //profile view 
router.get('/profileview/:id',userAuth, profileController.getProfileView);
router.get('/editUser/:id',userAuth,profileController.getEditUser);
router.post('/editUser/:id',userAuth,profileController.postEditUser);


module.exports = router

