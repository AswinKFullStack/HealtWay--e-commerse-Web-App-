const User = require("../models/userSchema");

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('admin-error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// User authentication middleware
const userAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);

            if (user && !user.isBlocked) {
                console.log("User authentication successful");
                return next();
            } else {
                console.log("User authentication failed: Blocked or not found");
                return renderErrorPage(res, 401, "Unauthorized", "Access denied. Please login.", "/login");
            }
        } else {
            console.log("Session not found");
            return renderErrorPage(res, 401, "Unauthorized", "Session expired. Please login again.", "/login");
        }
    } catch (error) {
        console.error("Error during user authentication:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An error occurred during authentication.", "/");
    }
};

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const admin = await User.findOne({ _id: req.session.admin, isAdmin: true });

            if (admin) {
                console.log("Admin authentication successful");
                return next();
            } else {
                console.log("Admin authentication failed");
                return renderErrorPage(res, 401, "Unauthorized", "Admin access denied. Please login.", "/admin/login");
            }
        } else {
            return renderErrorPage(res, 403, "Forbidden", "You don't have permission to access this page.", "/admin/login");
        }
    } catch (error) {
        console.error("Error during admin authentication:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An error occurred during admin authentication.", "/admin/login");
    }
};

module.exports = {
    userAuth,
    adminAuth
};
