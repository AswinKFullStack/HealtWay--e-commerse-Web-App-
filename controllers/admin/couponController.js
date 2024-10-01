const { render } = require('ejs');
const Coupon = require('../../models/couponShema');













const listAllCoupons = async (req,res)=>{
   
       
    
        
            try {
                const page = parseInt(req.query.page) || 1; 
                const limit = 10; 
                const skip = (page - 1) * limit; 
                const coupons = await Coupon.find()
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 }); 
        
                
                const totalCoupons = await Coupon.countDocuments();
                const totalPages = Math.ceil(totalCoupons / limit); // Calculate total pages
        
                res.render('couponMngt', {
                    coupons,
                    currentPage: page,
                    totalPages,
                });
            } catch (error) {
                next(error);
            }
        
        
   
}

const getAddCoupon = async (req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
        
    }

}



const postAddCoupon = async (req, res, next) => {
    try {
        const {
            couponCode,
            minPurchaseAmount,
            couponName,
            discountType,
            discountValue,
            couponStatus,
            endDate
        } = req.body;
        console.log("Received Data =",req.body);
        if (!couponCode || !minPurchaseAmount || !couponName || !discountType || !discountValue || !couponStatus || !endDate) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const minPurchase = Number(minPurchaseAmount);
        const discount = Number(discountValue);
        
        if (isNaN(minPurchase) || isNaN(discount)) {
            return res.status(400).json({ success: false, message: 'minPurchaseAmount and discountValue must be numbers.' });
        }

        const existingCoupon = await Coupon.findOne({ code: couponCode });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
        }

        const newCoupon = new Coupon({
            name: couponName,
            code: couponCode,
            discountType,
            discountValue: discount,
            minPurchase,
            expireDate: new Date(endDate),
            isActive: couponStatus === 'Active'
        });

        await newCoupon.save();

        res.status(201).json({ success: true, message: 'Coupon created successfully!' });
    } catch (error) {
        next(error);
    }
};



//Delete couopn 

const deleteCoupon = async (req, res) => {
    

    try {
        const {couponId}  = req.params;
        const result = await Coupon.findByIdAndDelete(couponId);

        if (!result) {
            return res.status(404).send({ message: 'Coupon not found' });
        }

        res.status(200).send({ message: 'Coupon deleted successfully' });
    } catch (err) {
        res.status(500).send({ message: 'Error deleting coupon', error: err.message });
    }
};











module.exports = {
    listAllCoupons,
    getAddCoupon,
    postAddCoupon,
    deleteCoupon
}