const express = require('express');
const getTokenPriceByNameRouter = require('../api/getTokenPriceByNameRouter.js');
const getPriceInfo = require('../api/getPriceInfoRouter.js');

const apiRouter = express.Router();

apiRouter.use('/getTokenPriceByName', getTokenPriceByNameRouter);
apiRouter.use('/getPriceInfo', getPriceInfo);


module.exports = apiRouter;