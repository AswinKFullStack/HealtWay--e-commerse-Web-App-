const { render } = require("ejs");
const Coupon = require("../../models/couponShema");
const User = require("../../models/userSchema");



const getCoupons = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        

        const coupons = await Coupon.find({
          isActive: true,
          expireDate: { $gt: new Date() },
          $or: [
            { $expr: { $lt: [`$usedBy.${userId}`, "$usageLimit"] } },  // Check if the user's count is less than the coupon's usage limit.
            { [`usedBy.${userId}`]: { $exists: false } }               // If the user has never used the coupon.
          ]
        });
        
        
      
      console.log("coupons for this user =" ,coupons)
      res.render('coupons',{
        title :"Coupons",
        user,
        coupons
      })
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching coupons' });
    }
  };
  

//validation of coupon

const validateCoupon = async (req,res) => {
    try {
     
      
        const { couponCode,TotalPrice} = req.body;
        const userId = req.session.user;

        const totalPriceFloat = parseFloat(TotalPrice);
        console.log("Coupon Code:", couponCode);
       console.log("Total Price:", TotalPrice);
        console.log("User ID:", userId);

        if (!couponCode || isNaN(totalPriceFloat)) {
          return res.status(400).json({ isValid: false, message: 'Coupon code and total price are required.' });
      }
      
        
        console.log("The funtion entered");
        const couponDoc = await Coupon.findOne({
          code: couponCode,
          minPurchase: { $lte: totalPriceFloat },
          isActive: true,
          expireDate: { $gt: new Date() },
          $or: [
            { $expr: { $lt: [`$usedBy.${userId}`, "$usageLimit"] } },  // If user has used it less than the limit.
            { [`usedBy.${userId}`]: { $exists: false } }               // If user has never used it.
          ]
        });
        

       

          console.log("coupons for this user =" ,couponDoc)
          if (!couponDoc) {
            return res.status(400).json({ isValid: false, message: 'Invalid or expired coupon or Not allowed for your order.' });
        }
        
          

          let discountAmount = 0;

          if(couponDoc.discountType === 'Percentage'){

            discountAmount = totalPriceFloat - (totalPriceFloat* (couponDoc.discountValue / 100));
          }else if(couponDoc.discountType === 'Fixed') {
            discountAmount =  totalPriceFloat - couponDoc.discountValue;
          }else{
            return res.status(400).json({ isValid: false, message: 'Invalid coupon discount type.' });
          }
          discountAmount = discountAmount > 0 ? discountAmount : 0;

          return res.json({ isValid: true, discountAmount ,couponId:couponDoc._id});

    } catch (error) {
        
        console.error('Error during coupon validation:', error);

        // Return a generic error message for any unexpected errors
        return res.status(500).json({ isValid: false, message: 'Server error. Please try again later.' });
    }
    
}



module.exports= {
    getCoupons,
    validateCoupon
}

