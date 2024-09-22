import express from 'express';
import apiRouter from './routers/apiRouter.js';
import { startPriceUpdater } from './services/priceService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Sử dụng apiRouter cho tất cả các route bắt đầu với /api
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startPriceUpdater();
});