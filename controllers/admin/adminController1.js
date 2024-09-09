const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//Error page
const pageError = async(req,res)=>{
   res.render("Error"); 
}
const loadLogin = async (req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin/dashboard");
        }
        res.render("admin-login");
    } catch (error) {
        console.error("Admin Login page error",error);
        res.status(500).send("Server error");
    }
    
}

const login = async (req,res)=>{
   try {
    const {email,password} = req.body;
    const admin = await User.findOne({isAdmin:true,email:email});
    if(admin){
        const passwordMatch = bcrypt.compare(password,admin.password);
        if(passwordMatch){
            console.log("password matching successfull");
            req.session.admin = admin._id;
            return res.redirect("/admin");

        }else{
            console.log("Password not matching");
            
            return res.redirect("/login");
        }
    }
   } catch (error) {
    console.error("Admin login fountion error",error);
    return res.redirect("/pageerror")
   }
}


//Load Dashboard

const loadDashboard = async(req,res)=>{
   
        try {
            if(req.session.admin){
                return res.render("dashboard");
            }else {
                // If the admin session does not exist, redirect to the admin login page
                return res.redirect("/admin/login");
            }
            
        } catch (error) {
            return res.redirect("/pageerror")
        }
    
}

//Admin logot

const logout = async (req,res)=>{
    try {
        req.session.destroy(error=>{
            if(error){
                console.log("Error in Admin session destroying ",error);
                return res.redirect("/pageerror");
            }
            res.redirect("/admin/login");
        })
    } catch (error) {
        console.log("Unexpected Error in Admin session destroying ",error);
        return res.redirect("/pageerror")
    }

}

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageError,
    logout
}