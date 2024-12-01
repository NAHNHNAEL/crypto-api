const express = require('express');
const apiRouter = require('./routers/apiRouter.js');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const updatePrice = require('./services/updatePrice.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Setting using mongoose to connect to MongoDB Local
mongoose.connect('mongodb://localhost:27017/trade_crypto', {
});

// Connect to MongoDB Atlas
// mongoose.connect(process.env.MONGODB_ATLAS_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});


// Sử dụng apiRouter cho tất cả các route bắt đầu với /api
app.use('/api', apiRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

});