const { render } = require("ejs");
const Coupon = require("../../models/couponShema");



const getCoupons = async (req, res) => {
    try {
      const userId = req.session.userId;
  
      const coupons = await Coupon.aggregate([
        {
          $match: {
            isActive: true, 
            expireDate: { $gt: new Date() } 
          }
        },
        {
          $addFields: {
            userUsage: {
              $filter: {
                input: "$usedBy", 
                as: "usage",
                cond: { $eq: ["$$usage.userId", userId] } 
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { "userUsage.count": { $lt: "$usageLimit" } },  
              { userUsage: { $eq: [] } } 
            ]
          }
        }
      ]);
      console.log("coupons for this user =" ,coupons)
      res.render('coupons',{
        title :"Coupons",
        coupons
      })
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching coupons' });
    }
  };
  





module.exports= {
    getCoupons
}

