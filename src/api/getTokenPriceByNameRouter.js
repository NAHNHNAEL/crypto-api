import express from 'express';
import { getCachedPrice } from '../services/priceService.js';

const router = express.Router();

// Route để lấy giá token theo tên
router.get('/:exchange/:tokenName', (req, res) => {
    const { exchange, tokenName } = req.params;
    const price = getCachedPrice(exchange, tokenName);
  
    if (price !== null) {
      res.json({ token: tokenName, exchange, price, cached: true });
    } else {
      res.status(503).json({ error: 'Giá token hiện không khả dụng. Vui lòng thử lại sau.' });
    }
  });
  
export default router;
