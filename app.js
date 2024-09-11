const express = require("express");
const app = express();
const path = require("path");
const env = require("dotenv").config();
const session = require("express-session");
const passport = require("./config/passport")
const db = require("./config/db");
const { urlencoded } = require("body-parser");
const userRouter= require("./routes/userRouter");
const adminRouter= require("./routes/adminRouter");
db();


app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        secure:false,
        httpOnly:true,
        maxAge:72*60*60*1000
    }

}))

app.use(passport.initialize());
app.use(passport.session());


app.set("view engine","ejs");
app.set("views",[path.join(__dirname,"views/user"),path.join(__dirname,"views/admin")])
app.use(express.static(path.join(__dirname,"public")));


// Middleware to log method and URL for each request
app.use((req, res, next) => {
    console.log(`Method: ${req.method}, URL: ${req.url}`);
    next(); // Pass control to the next handler
});

app.use("/",userRouter);
app.use("/admin",adminRouter);


// Middleware to handle 404 errors (Page Not Found)
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/admin')) {
        res.status(404).render('admin-error-page', {
            errorCode: 404,
            errorMessage: "Admin Page Not Found",
            errorDescription: "The page you're looking for in the admin panel doesn't exist or might have been moved.",
            backLink: req.headers.referer || '/admin', // Go back to the admin page
        });
    } else {
        res.status(404).render('error-page', {
            errorCode: 404,
            errorMessage: "Page Not Found",
            errorDescription: "The page you're looking for doesn't exist or might have been moved.",
            backLink: req.headers.referer || '/', // Go back to the homepage
        });
    }
});

// General error handling for other status codes
app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    let errorMessage = "Internal Server Error";
    let errorDescription = "We're experiencing technical difficulties. Please try again later.";

    if (statusCode === 400) {
        errorMessage = "Bad Request";
        errorDescription = "The request could not be understood or was missing required parameters.";
    } else if (statusCode === 403) {
        errorMessage = "Forbidden";
        errorDescription = "You don't have permission to access this page.";
    }

    // Different error handling for admin routes
    if (req.originalUrl.startsWith('/admin')) {
        res.status(statusCode).render('admin-error-page', {
            errorCode: statusCode,
            errorMessage,
            errorDescription,
            backLink: req.headers.referer || '/admin',
        });
    } else {
        res.status(statusCode).render('error-page', {
            errorCode: statusCode,
            errorMessage,
            errorDescription,
            backLink: req.headers.referer || '/',
        });
    }
});




app.listen(process.env.PORT,()=>{console.log("Server Running")});





module.exports = {
    app}