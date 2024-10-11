const express = require('express');
const getTokenPriceByNameRouter = require('../api/getTokenPriceByNameRouter.js');

const apiRouter = express.Router();

apiRouter.use('/getTokenPriceByName', getTokenPriceByNameRouter);

module.exports = apiRouter;