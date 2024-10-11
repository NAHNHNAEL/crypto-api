const express = require('express');
const { getTokenPrice, fetchTokenPrice } = require('../services/priceService.js');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // Cache TTL: 5 phút

const router = express.Router();

// Route để lấy giá token theo tên
router.get('/:exchange/:tokenName', async (req, res) => {
    const { exchange, tokenName } = req.params;
    const tokenNameUpper = tokenName.toUpperCase();
    const symbol = `${tokenNameUpper}/USDT`;

    try {
        // Lấy giá từ cache trước khi truy vấn cơ sở dữ liệu hoặc gọi API
        const cachedPrice = cache.get(symbol);
        if (cachedPrice) {
            return res.setHeader('Content-Type', 'text/plain').send(`${cachedPrice}`);
        }
        // Lấy giá từ cơ sở dữ liệu nếu không có giá trong cache
        let price = await getTokenPrice(symbol, exchange);

        if (price === null) {
            // Nếu không có trong cơ sở dữ liệu, fetch từ sàn giao dịch
            price = await fetchTokenPrice(exchange, tokenNameUpper);
        }

        // Lưu giá vào cache và trả về cho client
        if (price !== null) {
            cache.set(symbol, price);
            return res.setHeader('Content-Type', 'text/plain').send(`${price}`);
        } else {
            return res.status(503).json({ error: 'Giá token không khả dụng. Vui lòng thử lại sau.' });
        }
    } catch (error) {
        return res.status(500).json({ error: `Lỗi khi lấy giá token: ${error.message}` });
    }
});

module.exports = router;

