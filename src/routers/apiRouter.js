const express = require('express');
const getTokenPriceByNameRouter = require('../api/getTokenPriceByNameRouter.js');
const updatePrice = require('../api/updatePrice.js');

const apiRouter = express.Router();

apiRouter.use('/getTokenPriceByName', getTokenPriceByNameRouter);
apiRouter.use('/updatePrice', updatePrice);


module.exports = apiRouter;