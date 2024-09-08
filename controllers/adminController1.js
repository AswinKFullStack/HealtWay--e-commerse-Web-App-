const User = require("../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


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
            req.session.admin = true;
            return res.redirect("/admin");

        }else{
            console.log("Password not matching");
            
            return res.redirect("/login");
        }
    }
   } catch (error) {
    console.error("Admin login fountion error",error);
    return res.redirect("/pageError")
   }
}


//Load Dashboard

const loadDashboard = async(req,res)=>{
   
        try {
            if(req.session.admin){
                return res.render("dashboard");
            }
            
        } catch (error) {
            return res.redirect("/pageError")
        }
    
}

module.exports = {
    loadLogin,
    login,
    loadDashboard
}