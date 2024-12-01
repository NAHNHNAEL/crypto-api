const mongoose  = require('mongoose');
const exchangePriceSchema = require('./exchange.js');

const priceSchema = new mongoose.Schema({
    exchangeId : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    timestamp : {
        type : Date,
        required : true,
        default : Date.now
    }
});

const tokenSchema = new mongoose.Schema({
    id : {
        type : String,
        required : true,
        unique : true
    },
    name : {
        type : String,
        required : true
    },
    symbol : {
        type : String,
        required : true
    },
    volume24h : {
        type : Number,
        required : true
    },
    marketCap : {
        type : Number,
        required : true
    },
    prices : [priceSchema],
    timestamp : {
        type : Date,
        required : true,
        default : Date.now
    }
});

const Token = mongoose.models.Token || mongoose.model('Token', tokenSchema);
module.exports = Token;