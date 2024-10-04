const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require("../../models/wishlistSchema")
const Offer = require('../../models/offerSchema');
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const { render } = require("ejs");
const env = require("dotenv").config();

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Load homepage
const loadHomepage = async (req, res) => {
    try {
        

        const productPage = parseInt(req.query.productPage) || 1;

        const productLimit = 3; 
        const searchTerm = req.query.search || '';

        let productQuery = { isDeleted: false };
        if (searchTerm) {
            productQuery = {
                productName: { $regex: searchTerm, $options: 'i' },
                isDeleted: false,
            };
        }

        const totalProducts = await Product.countDocuments(productQuery);
        const products = await Product.find(productQuery)
            .populate('category')
            .populate('brand')
            .skip((productPage - 1) * productLimit)
            .limit(productLimit);

        const categories = await Category.find();
        const categoryProducts = {};

        const categoryPromises = categories.map(async (category) => {
            const categoryPage = parseInt(req.query[`categoryPage_${category._id}`]) || 1;
            const categoryLimit = 3;
            const categoryQuery = { category: category._id, isDeleted: false };

            const productsInCategory = await Product.find(categoryQuery)
                .populate('category')
                .populate('brand')
                .skip((categoryPage - 1) * categoryLimit)
                .limit(categoryLimit);

            categoryProducts[category._id] = {
                products: productsInCategory,
                currentPage: categoryPage,
                totalPages: Math.ceil(await Product.countDocuments(categoryQuery) / categoryLimit),
            };
        });

        await Promise.all(categoryPromises);
       const user = req.session.user 
                  ? await User.findById(req.session.user) 
                  : req.user 
                  ? await User.findById(req.user._id) 
                  : null;


                  
                  
                  let cartProductIds = []; 
                  let wishlistProductIds = [];
                  if (user) {
                      const userCart = await Cart.findOne({ userId: user._id }).lean();
                      if (userCart && userCart.items) {
                          cartProductIds = userCart.items.map(item => item.productId.toString());
          
                          
                          
                          
                      } else {
                          console.log("Cart is empty.");
                      }
                      //wishlist
                      const userWishlist = await Wishlist.findOne({ userId: user._id }).lean();
                      if (userWishlist && userWishlist.products.length > 0) {
                          wishlistProductIds = userWishlist.products.map(productId => productId.toString());
                          
                      }
          
          
                  } else {
                      console.log("No user found.");
                  }


                  const offers = await Offer.find({});


        res.render("home", {
            user,
            products, 
            productCurrentPage: productPage,
            productTotalPages: Math.ceil(totalProducts / productLimit),
            searchTerm,
            categories,
            categoryProducts,
            title: 'Home Page'  ,
            cartProductIds: cartProductIds, 
            wishlistProductIds: wishlistProductIds,
            offers
        });
    } catch (error) {
        console.error("Error loading homepage", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the homepage.", req.headers.referer || '/');
    }
};

const loadSignup = async (req, res) => {
    try {
        res.render("signup", { title: 'SignUp Page' });
    } catch (error) {
        console.error("Error loading signup page", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the signup page.", req.headers.referer || '/');
    }
};

// Generate OTP
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification email with OTP
async function sendVerificationEmail(email, otp) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        });

        const info = await transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is ${otp}. This OTP will expire in 90 seconds.`,
            html: `<b>Your OTP: ${otp}</b><br><small>This OTP will expire in 90 seconds.</small>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

// Signup logic
const signup = async (req, res) => {
    try {
        const { name, email, phone, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.render("signup", {
                message: "Passwords do not match",
                title: 'SignUp Page'
            });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("signup", {
                message: "User with this email already exists",
                title: 'SignUp Page'
            });
        }

        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000; // OTP expires in 90 seconds
        const emailSent = await sendVerificationEmail(email, otp);
       
        
        if (!emailSent) {
            return res.render("signup", {
                message: "Error sending OTP",
                title: 'SignUp Page'
            });
        }
        
        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt;
        req.session.userData = { name, phone, email, password };
        res.render("verify-otp");
        console.log("OTP Sent ",otp);
    } catch (error) {
        console.error("Signup error", error);
        renderErrorPage(res, 500, "Signup Error", "An unexpected error occurred during signup.", '/signup');
    }
};

// Hash password securely
const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error("Error hashing password", error);
        throw new Error("Password hashing failed");
    }
};

// Verify OTP
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const currentTime = Date.now();
        if (currentTime > req.session.otpExpiresAt) {
            // OTP has expired
            return res.status(400).json({
                success: false,
                message: "OTP Expired",
                description: "The OTP has expired. Please request a new one."
            });
        }

        if (otp === req.session.userOtp) {
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            const newUser = new User({
                name: user.name,
                email: user.email,
                phone: user.phone,
                password: passwordHash
            });

            await newUser.save();
            req.session.user = newUser._id;
            res.status(200).json({ success: true, redirectUrl: "/" });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid OTP",
                description: "The OTP entered is incorrect. Please try again."
            });
        }
    } catch (error) {
        console.error("Error verifying OTP", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            description: "An unexpected error occurred while verifying OTP."
        });
    }
};

// Resend OTP
const resendOtp = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
                description: "Email not found in session."
            });
        }

        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000; // Reset expiration time
        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt; // Store new expiration time
        const emailSent = await sendVerificationEmail(email, otp);
        console.log("OTP RE-Sent ",otp)
      
        if (emailSent) {
            res.status(200).json({ success: true });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to resend OTP",
                description: "Please try again."
            });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            description: "An unexpected error occurred while resending OTP."
        });
    }
};

// 404 - Page not found
const pageNotFound = async (req, res) => {
    try {
        res.render("error-page", { title: "Page Not Found" });
    } catch (error) {
        console.error("Error rendering error page", error);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp
};
