const express = require('express');
const { getStalePrices, updateStalePrices, getVolume24h } = require('../services/updatePrice.js');

const router = express.Router();

// Route để lấy giá token theo tên
router.get('/:tokenName/:symbol', async (req, res) => {
    try {
        const { tokenName, symbol } = req.params;
        const volume = await getVolume24h(tokenName, symbol);
        return res.json(volume);
    } catch (error) {
        return res.status(500).json({ error: `Lỗi khi lấy giá token: ${error.message}` });
    }
});

module.exports = router;