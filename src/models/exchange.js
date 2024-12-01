const mongoose = require('mongoose');

const exchangeSchema = new mongoose.Schema({
    exchange : {
        type : String,
        required : true
    },
    symbol : {
        type : String,
        required : true
    },
});

const Exchange = mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);
module.exports = Exchange;