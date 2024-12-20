const mongoose = require('mongoose');

const tokenPriceSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  exchange: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
});

const TokenPrice = mongoose.models.TokenPrice || mongoose.model('TokenPrice', tokenPriceSchema);

module.exports = TokenPrice;
