const User = require("../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");



const pageNotFound = async (req,res)=>{
    try{
        res.render("page-404");
    }catch(error){
        res.redirect("/pageNotFound");
    }
}

const loadHomepage = async (req,res)=>{
    try{
        return res.render("home");
    }catch(error){
        console.log("Home page not found");
        res.status(500).send("Server error");
    }
}

const loadSignup = async(req,res)=>{
    try{
        return res.render("signup");
    }catch(error){
        console.log("Login page is not found",error);
        res.status(500).send("Server error");
    }
}

//for genarating otp
function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

async function sendVerificationEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        }) 
        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify your account",
            text:`Your OTP is ${otp}`,
            html:`<b> Your OTP : ${otp}</b>`
        })
        return info.accepted.length > 0;
    } catch (error) {
     console.error("Error sending email",error);
     return false;   
    }
}

const signup = async (req,res)=>{
    try{
        const {name,email,phone,password,confirmPassword} = req.body;
        if(password !== confirmPassword){
            return res.render("signup",{message:"Password do not match"});
        }
        const findUser = await User.findOne({email});
        if(findUser){
            return res.render("signup",{message:"User with email already exists"});
        }
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
            return res.json("email-error");
        }

        req.session.userOtp = otp;
        req.session.userDate = {email,password};
        console.log( req.session.userDate);

        // res.render("verify-otp");
        console.log("OTP Sent ",otp);




    }catch(error){
        console.error("signup error",error);
        res.redirect("/pageNotFound");
    }
}








module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup
}