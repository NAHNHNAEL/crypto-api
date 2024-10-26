const TokenPrice = require('../models/token-price.js');
const { fetchTokenPrice } = require('./priceService.js');
const ccxt = require('ccxt');
const axios = require('axios');

// Lấy ra danh sách token trong database có thời gian cập nhật quá 5 phút
const getStalePrices = async () => {
    try {
        const stalePrices = await TokenPrice.find({
            timestamp: {
                $lt: new Date(Date.now() - 5 * 60 * 1000), // Timestamp cũ hơn 5 phút
            },
        });
        return stalePrices;
    } catch (error) {
        console.error('Error fetching stale prices:', error);
        return [];
    }
};

// Lấy giá token dựa vào danh sách đã get được từ function getStalePrices
const updateStalePrices = async (stalePrices) => {
    for await (const tokenPrice of stalePrices) {
        const { symbol, exchange } = tokenPrice;
        console.log(`Fetching price for ${symbol} on ${exchange}`);
        try {
            await fetchTokenPrice(exchange, symbol.split('/')[0]);
            console.log(`Updated price for ${symbol} on ${exchange}`);
        } catch (error) {
            console.error(`Error fetching price for ${symbol} on ${exchange}: ${error.message}`);
        }
    }
};

// Setting cập nhật giá token mỗi 5 phút
setInterval(async () => {
    try {
        const stalePrices = await getStalePrices();
        if (stalePrices.length > 0) {
            console.log(`Found ${stalePrices.length} stale prices to update.`);
            await updateStalePrices(stalePrices);
        } else {
            console.log('No stale prices found.');
        }
    } catch (error) {
        console.error('Error in updating stale prices:', error);
    }
}, 5 * 60 * 1000);


// Lấy volume 24h
const getTokenId = async (tokenName, symbol) => {
    try {
        const url = `https://api.coingecko.com/api/v3/search?query=${tokenName}`;
        const response = await axios.get(url);
        const data = response.data.coins;

        if (data.length > 0) {
            // Tìm token có symbol khớp với symbol được cung cấp
            const token = data.find(coin => coin.symbol.toLowerCase() === symbol.toLowerCase());
            if (token) {
                return token.id;
            } else {
                console.error(`No token found for name: ${tokenName} with symbol: ${symbol}`);
                return null;
            }
        } else {
            console.error(`No token found for name: ${tokenName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching token id for ${tokenName}:`, error.message);
        return null;
    }
};

// Hàm lấy volume 24h
const getVolume24h = async (tokenName, symbol) => {
    try {
        const tokenId = await getTokenId(tokenName, symbol);
        if (!tokenId) {
            return null;
        }

        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenId}`;
        const response = await axios.get(url);
        const data = response.data[0];

        if (data) {
            const volume24h = data.total_volume;
            console.log(`Volume 24h for ${tokenName}: ${volume24h}`);
            return volume24h;
        } else {
            console.error(`No data found for ${tokenName}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching volume for ${tokenName}:`, error.message);
        return null;
    }
};
module.exports = { getStalePrices, updateStalePrices , getVolume24h};
