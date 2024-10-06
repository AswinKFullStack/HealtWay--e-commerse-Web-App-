const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');

const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Generate OTP
function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
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

const verifyUser = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
                description: "User not found in session."
            });
        }

        const email = user.email;
        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000; 
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.render("signup", {
                message: "Error sending OTP",
                title: 'SignUp Page'
            });
        }

        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt;

        // For profile editing
        res.render('verify-otp', { type: 'edit' });

        console.log("OTP Sent: ", otp);

    } catch (error) {
        console.error("User verification error in Editing", error);
        renderErrorPage(res, 500, "Verification Error", "An unexpected error occurred during user verification.", '/login');
    }
};

const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const currentTime = Date.now();

        if (!req.session.otpExpiresAt || currentTime > req.session.otpExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "OTP Expired",
                description: "The OTP has expired. Please request a new one."
            });
        }

        if (!req.session.userOtp || otp !== req.session.userOtp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                description: "The OTP entered is incorrect. Please try again."
            });
        }

        res.status(200).json({ success: true, redirectUrl: "/edit-user-profile" });

    } catch (error) {
        console.error("Error verifying OTP", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            description: "An unexpected error occurred while verifying OTP."
        });
    }
};

const resendOtp = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
                description: "User not found in session."
            });
        }

        const email = user.email;
        const otp = generateOtp();
        const otpExpiresAt = Date.now() + 90 * 1000; 
        req.session.userOtp = otp;
        req.session.otpExpiresAt = otpExpiresAt; 
        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            console.log("OTP RE-Sent: ", otp);
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({
                success: false,
                message: "Failed to resend OTP",
                description: "Please try again."
            });
        }
    } catch (error) {
        console.error("Error resending OTP", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            description: "An unexpected error occurred while resending OTP."
        });
    }
};

module.exports = {
    verifyUser,
    resendOtp,
    verifyOtp
};
