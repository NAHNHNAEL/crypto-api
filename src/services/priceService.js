const ccxt = require('ccxt');
const TokenPrice = require('../models/token-price.js');

// Biến lưu trữ các token cần theo dõi định kỳ
let tokensToTrack = [
    { exchange: 'binance', token: 'BTC' },
    { exchange: 'binance', token: 'ETH' },
];

// Hàm lấy giá token từ sàn giao dịch
const fetchTokenPrice = async (exchangeName, tokenName) => {
    const symbol = `${tokenName}/USDT`;
    try {
        const ExchangeClass = ccxt[exchangeName];
        if (!ExchangeClass) {
            throw new Error(`Exchange ${exchangeName} not found`);
        }

        const exchangeInstance = new ExchangeClass({
            enableRateLimit: true,
        });

        const ticker = await exchangeInstance.fetchTicker(symbol);
        const price = ticker.last;

        // Lưu giá vào database
        await upsertTokenPrice(symbol, price, exchangeName);

        console.log(`Updated ${tokenName} price from ${exchangeName}: $${price}`);
        return price;
    } catch (error) {
        console.error(`Error fetching price for ${tokenName} from ${exchangeName}:`, error.message);
    }
};

// Hàm lấy giá token từ database
const getTokenPrice = async (symbol, exchange) => {
    try {
      const tokenPrice = await TokenPrice.findOne({ symbol, exchange });
        return tokenPrice ? tokenPrice.price : null;
    } catch (error) {
      console.error('Error fetching token price:', error);
      throw error;
    }
  };

// Thêm token vào database và cập nhật giá
const upsertTokenPrice = async (symbol, price, exchange) => {

    const timestamp = new Date();
  
    try {
      const result = await TokenPrice.findOneAndUpdate(
        { symbol, exchange },
        { price, timestamp },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
  
      console.log('Upserted token price:', result);
    } catch (error) {
      console.error('Error upserting token price:', error);
    }
  };

// Xuất các hàm cần thiết
module.exports = { fetchTokenPrice, getTokenPrice, upsertTokenPrice };
