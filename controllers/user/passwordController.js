const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};
const getForgotPassword = async (req,res) => {
    try {
        res.render("forgot-password", { title: 'Forgot-password Page' });
    } catch (error) {
        console.error("Error loading forgot-password page", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the forgot-password page.", req.headers.referer || '/login');
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

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
            subject: "Forgot password",
            text: `Your OTP is ${otp}. This OTP will expire in 90 seconds.`,
            html: `<b>Your OTP: ${otp}</b><br><small>This OTP will expire in 90 seconds.</small>`
        });

        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email", error);
        return false;
    }
}

// Hash password securely
const securePassword = async (password) => {
    try {
        if (!password) throw new Error("Password not provided");
        return await bcrypt.hash(password, 10);
    } catch (error) {
        console.error("Error hashing password", error);
        throw new Error("Password hashing failed");
    }
};

// Handle forgot-password request
const postForgotPassword = async (req,res) => {
    try {
        const { email} = req.body;
        const findUser = await User.findOne({ email });
        if (!findUser) {
            return res.render("forgot-password", {
                message: "This email not registered",
                title: 'Forgot-password Page'
            });
        }
        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000; 
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.render("forgot-password", {
                message: "Error sending OTP",
                title: 'Forgot-password Page'
            });
        }
        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt;
        req.session.userEmail = email;
        res.render("forgot-verification");
        console.log("OTP Sent ",otp);
    } catch (error) {
        console.error("Error in postForgotPassword: ", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while processing the forgot password request.", '/forgotPassword');
    }
}

// Handle OTP verification
const forgotPasswordVerify = async (req,res) => {
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

            // Verify OTP
        if (otp === req.session.userOtp) {
            const email = req.session.userEmail;
            const findUser = await User.findOne({email});

            if(findUser){
                req.session.user = findUser._id;  
                res.status(200).json({ success: true, redirectUrl: "/resetPassword" });
            }else{
                return res.status(400).json({
                    success: false,
                    message: "User not found",
                    description: "This email with no user registered "
                }); 
            }


            
        }else {
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
}


// Handle OTP resend request
const resendOtpForgotPasswordVerify = async (req,res) => {
    try {
         const email = req.session.userEmail;
       
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Invalid email",
                description: "Email not found in session."
            });
        }

        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000;
        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt; // OTP expires in 90 seconds
        const emailSent = await sendVerificationEmail(email, otp);
        console.log("OTP RE-Sent for forgot-password ",otp);

        if (!emailSent) {
            return res.render("forgot-password", {
                message: "Error sending OTP",
                title: 'Forgot-password Page'
            });
        }

       

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
}

// Render the reset-password page
const getResetPassword = async (req,res) => {
    try {
        res.render("reset-password");
    } catch (error) {
        console.error("Error loading reset-password page", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the reset-password page.", req.headers.referer || '/login');
    }
}
 
// Handle password reset
const postResetPassword = async (req,res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return renderErrorPage(res, 400, "Password Not matching", "Passwords do not match", req.headers.referer || '/resetPassword');
        }
        if (!req.session.user) {
            return renderErrorPage(res, 401, "Session Expired", "Your session has expired. Please try resetting the password again.", '/login');
        }

        // Hash the new password and update the user
        const passwordHash = await securePassword(newPassword);
        const user = await User.findById(req.session.user);
        if (user && !user.isBlocked) {
            user.password = passwordHash;
            await user.save();

            req.session.destroy(err => {
                if (err) {
                    console.error("Error destroying session:", err);
                    return renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while logging you out.", '/login');
                }
                res.render("login", { message: "Password successfully changed, please log in.", title: 'Login Page' });
                
            });
        } else {
            console.log("User not found");
            return renderErrorPage(
                res, 
                401, 
                "User not found", 
                "No user found for this session.", 
                "/resetPassword"
            );
        }

        

    } catch (error) {
        console.error("Errorin postResetPassword:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while resetting the password. .", req.headers.referer || '/resetPassword');
        
    }
}

module.exports={
    getForgotPassword,
    postForgotPassword,
    forgotPasswordVerify,
    resendOtpForgotPasswordVerify,
    getResetPassword,
    postResetPassword
}
