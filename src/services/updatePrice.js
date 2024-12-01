const TokenPrice = require('../models/token-price.js');
const { fetchTokenPrice } = require('./priceService.js');

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
      console.log('Checking for stale prices...');
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



module.exports = { getStalePrices, updateStalePrices};
