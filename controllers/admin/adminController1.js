const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('admin-error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Load Login Page
const loadLogin = async (req, res) => {
    try {
        if (req.session.admin) {
            return res.redirect("/admin/dashboard");
        }
        res.render("admin-login", { title: 'Admin Login' });
    } catch (error) {
        console.error("Error loading Admin Login page:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the login page.", '/');
    }
};

// Handle Admin Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render("admin-login", {
                message: "Email and password are required.",
                title: 'Admin Login'
            });
        }

        const admin = await User.findOne({ isAdmin: true, email: email });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.admin = admin._id;
                return res.redirect("/admin");
            } else {
                return res.render("admin-login", {
                    message: "Incorrect password. Please try again.",
                    title: 'Admin Login'
                });
            }
        } else {
            return res.render("admin-login", {
                message: "Admin not found with the provided email.",
                title: 'Admin Login'
            });
        }
    } catch (error) {
        console.error("Error during admin login:", error);
        renderErrorPage(res, 500, "Login Error", "An unexpected error occurred while trying to log in.", '/admin/login');
    }
};

// Load Dashboard
const loadDashboard = async (req, res) => {
    try {
        if (req.session.admin) {
            res.render("dashboard");
        } else {
            res.redirect("/admin/login");
        }
    } catch (error) {
        console.error("Error loading dashboard:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while trying to load the dashboard.", '/');
    }
};

// Handle Admin Logout
const logout = async (req, res) => {
    try {
        req.session.destroy((error) => {
            if (error) {
                console.error("Error destroying Admin session:", error);
                return renderErrorPage(res, 500, "Logout Error", "An unexpected error occurred while trying to log out.", '/');
            }
            res.redirect("/admin/login");
        });
    } catch (error) {
        console.error("Unexpected error in Admin session destruction:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred during logout.", '/');
    }
};

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    
    logout
};
