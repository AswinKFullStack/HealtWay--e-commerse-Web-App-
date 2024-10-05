
const Offer = require('../../models/offerSchema');



const loadOffers = async (req,res) => {
    try {
        
        const offers = await Offer.find({});
        res.render('offers-list', { offers });
    } catch (error) {

        res.status(500).send(error);
        
    }
}

module.exports ={
    loadOffers

}