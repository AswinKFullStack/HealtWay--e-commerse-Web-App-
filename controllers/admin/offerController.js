
const Offer = require("../../models/offerSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");


const loadOffers = async (req,res) => {

    try {
        const offers = await Offer.find({});
        res.render('offers', { offers });
        
    } catch (error) {
        res.status(500).send(err);
    }   
    
    
}

const getOfferAddPage = async (req, res) => {
    try {
        const categories = await Category.find({ status: "Listed" });
        const products = await Product.find({ isDeleted: false });
        
        res.render("offer-add", { categories, products });
    } catch (error) {
        console.error('Error loading offer add page:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while loading the offer add page.", '/admin/offers');
    }
};





const postAddOffer = async (req, res) => {
    try {
        const { type, title, discountType, discountValue, details, category, products } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!type || !title || !discountType || !discountValue || isNaN(discountValue) || discountValue <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid input. Please check all required fields.' });
        }

        const newOffer = new Offer({
            type,
            title,
            discountType,
            discountValue,
            details,
            image,
            category: type === 'Category' ? category : undefined,
            products: type === 'Product' ? products : undefined,
        });

        await newOffer.save();
        res.status(200).json({ success: true, message: 'Offer added successfully' });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};





const editOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        res.render('edit-offer', { offer });
    } catch (err) {
        res.status(500).send(err);
    }
}

const postEditOffer  = async (req,res) => {
    try {
        const { type, title, discount, details } = req.body;
        const image = req.file ?  + req.file.filename : req.body.currentImage;
        await Offer.findByIdAndUpdate(req.params.id, { type, title, discount, details, image });
        res.redirect('/admin/offers');
        
    } catch (error) {
        res.status(500).send(error);
        
    }
}

const deletOffer = async (req,res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.redirect('/admin/offers');
        
    } catch (error) {
        res.status(500).send(error);
        
    }
}



const activateOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        console.log(offerId)
        await Offer.findByIdAndUpdate(offerId, { isActive: true });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/offers');
    }
};

const deactivateOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        await Offer.findByIdAndUpdate(offerId, { isActive: false });
        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/offers');
    }
};


module.exports= {
    loadOffers,
    getOfferAddPage,
    postAddOffer,
    editOffer ,
    postEditOffer ,
    deletOffer,
    activateOffer,
    deactivateOffer

}

