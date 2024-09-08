const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController1 = require("../controllers/userController1");
const userController2 = require("../controllers/userController2");


//page not found routes
router.get("/pageNotFound",userController1.pageNotFound);

//signup management 
router.get("/",userController1.loadHomepage);
router.get("/signup",userController1.loadSignup);
router.post("/signup",userController1.signup);
router.post("/verify-otp",userController1.verifyOtp);
router.post("/resend-otp",userController1.resendOtp); 


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/signup' }), 
    (req, res) => {
      res.redirect('/');
  });


//login routes

router.get("/login",userController2.loadLogin);
router.post("/login",userController2.login);


//logout
router.get("/logout",userController2.logout);

module.exports = router

