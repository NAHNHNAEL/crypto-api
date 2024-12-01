const express = require("express");
const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 300 }); // Cache TTL: 5 phút
const {
    fetchTokenInfo,
    fetchTokenPrice,
} = require("../services/getTokenInfoService.js");

const router = express.Router();

// Route để lấy giá token theo tên
router.get("/:tokenSymbol/:tokenName/:exchangeSymbol", async (req, res) => {
    const { tokenSymbol, tokenName, exchangeSymbol } = req.params;
    let tokenId = null;

    try {
        const cacheKey = `${tokenSymbol.toLowerCase()}-${tokenName.toLowerCase()}-${exchangeSymbol.toLowerCase()}`;
        // Lấy giá từ cache trước khi truy vấn cơ sở dữ liệu hoặc gọi API
        const cachedPrice = cache.get(cacheKey);
        console.log(`Giá lấy từ cache:`, cachedPrice);

        if (cachedPrice) {
            return res.status(200).json({
                status: "success",
                data: cachedPrice,
            });
        }

        // Kiểm tra thông tin token có trong database không nếu không thì lấy từ coingetko
        tokenId = await fetchTokenInfo(tokenSymbol, tokenName);

        if (!tokenId) {
            return res
                .status(503)
                .json({ error: "Token không khả dụng. Vui lòng thử lại sau." });
        }

        // Lấy giá token theo sàn
        let tokenWithPrice = await fetchTokenPrice(
            tokenId,
            exchangeSymbol,
            tokenSymbol
        );

        // Nếu không lấy được giá thì trả về lỗi
        if (tokenWithPrice === null) {
            return res
                .status(503)
                .json({ error: "Giá token không khả dụng. Vui lòng thử lại sau." });
        }

        // Lưu giá vào cache
        cache.set(cacheKey, tokenWithPrice);
        // Trả về JSON với cấu trúc rõ ràng
        return res.status(200).json({
            status: "success",
            data: tokenWithPrice,
        });
    } catch (error) {
        return res
            .status(500)
            .json({ error: `Lỗi khi lấy giá token: ${error.message}` });
    }
});

module.exports = router;
