const User = require("../models/userSchema");

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink, isAdmin = false) => {
    const template = isAdmin ? 'admin-error-page' : 'error-page';
    res.status(errorCode).render(template, {
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
                return renderErrorPage(
                    res, 
                    401, 
                    "Unauthorized", 
                    "Access denied. Please login.", 
                    "/login", 
                    false);
            }
        } else {
            console.log("Session not found");
            return renderErrorPage(
                res, 
                401, 
                "Unauthorized", 
                "Session expired. Please login again.", 
                "/login", 
                false
            );
        }
    } catch (error) {
        console.error("Error during user authentication:", error);
        return renderErrorPage(
            res, 
            500, 
            "Internal Server Error", 
            "An error occurred during authentication.", 
            "/", 
            false);
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
                return renderErrorPage(res, 401, "Unauthorized", "Admin access denied. Please login.", "/admin/login" ,true);
            }
        } else {
            return renderErrorPage(res, 403, "Forbidden", "You don't have permission to access this page.", "/admin/login" ,true);
        }
    } catch (error) {
        console.error("Error during admin authentication:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An error occurred during admin authentication.", "/admin/login" ,true);
    }
};

module.exports = {
    userAuth,
    adminAuth
};
