import express from 'express';
import getTokenPriceByNameRouter from '../api/getTokenPriceByNameRouter.js';

const apiRouter = express.Router();

apiRouter.use('/getTokenPriceByName', getTokenPriceByNameRouter);

export default apiRouter;