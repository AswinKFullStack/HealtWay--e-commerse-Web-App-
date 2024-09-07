const User = require("../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");



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
        req.session.userData = {name,phone,email,password};
        console.log( req.session.userData);

        res.render("verify-otp");
        console.log("OTP Sent ",otp);




    }catch(error){
        console.error("signup error",error);
        res.redirect("/pageNotFound");
    }
}
//Hashing password
const securePassword = async (password)=>{
    try {
        
            const passwordHash = await bcrypt.hash(password,10);
            return passwordHash;
           
    } catch (error) {
        
    }
}


//OTP verification

const verifyOtp = async (req,res)=>{
    try {
       

        const {otp} = req.body;
        console.log(otp);
        console.log("Session OTP:", req.session.userOtp);
        console.log("User    OTP:", otp);
        console.log("Session User Data:", req.session.userData);
        
        if(otp === req.session.userOtp){
            console.log("otp validation successfull");
            const user = req.session.userData;
            const passwordHash = await securePassword(user.password);

            // Create a new user instance
            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })

              // Attempt to save the user and handle errors
            try {
            await saveUserData.save();
            console.log("User data saved in database successfully");
            
                // Set user ID in session

            req.session.user = saveUserData._id;
            console.log(`user uniqe session ID ${req.session.user} from  here got it ${saveUserData._id}`);
             // Send success response
            res.status(200).json({success:true,redirectUrl:"/"})
            } catch (dbError) {
                   console.error("Error saving user in DB:", dbError);
                 
                    res.status(500).json({ success: false, message: "Database error" ,description:"Try after sometimes " });
                
            }
        }else{
           
           
            console.log("The password not matched");
            res.json({success:false, message: "Invalide OTP",description:'The OTP entered is incorrect. Please try again.'})
           
        }
    } catch (error) {
        
        console.error("Error verifying OTP", error);
       
            res.status(500).json();
            console.log("The Error in OTP verifying fn");
       

    }
}

//Resend OTP 

const resendOtp = async (req,res)=>{
    try {
        const {email} = req.session.userData;
        if(!email){
            return res.json({success:false,title:"Invalid Email",message:"Email not fount in session"})
        }
        const otp = generateOtp();
        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTP :", otp);
            res.status(200).json({success:true});
        }else{
            res.json({success:false,title:"Failed",message:"Failed to resend OTP. Please try again"})
        }

    } catch (error) {
        console.error("Error resending OTP ", error);
        res.status(500).json();
        console.log("Internal Server Error .Please try again");
    }
}


module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp
}