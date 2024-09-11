const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Load login page
const loadLogin = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.render("login", { title: 'Login Page' });
        } else {
            res.redirect("/");
        }
    } catch (error) {
        console.error("Error loading login page:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the login page.", req.headers.referer || '/');
    }
};

// Handle login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.render("login", {
                message: "Email and password are required.",
                title: 'Login Page'
            });
        }

        // Check if user exists
        const findUser = await User.findOne({ isAdmin: false, email: email });
        if (!findUser) {
            return res.render("login", { message: "User not found", title: 'Login Page' });
        }

        // Check if user is blocked
        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin", title: 'Login Page' });
        }

        // Validate password
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (!passwordMatch) {
            return res.render("login", { message: "Incorrect Password", title: 'Login Page' });
        }

        // User successfully logged in
        req.session.user = findUser._id;
        console.log("User login successful with req.session.user =", req.session.user);
        res.redirect("/");
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).render("login", {
            message: "Login failed. Please try again later.",
            title: 'Login Page'
        });
    }
};

// Handle logout
const logout = async (req, res) => {
    try {
        req.session.destroy((error) => {
            if (error) {
                console.error("Session destruction error:", error);
                return renderErrorPage(res, 500, "Server Error", "An error occurred while trying to log out. Please try again.", '/');
            }
            res.redirect("/login");
        });
    } catch (error) {
        console.error("Logout error:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to log out.", '/');
    }
};

module.exports = {
    loadLogin,
    login,
    logout
};
