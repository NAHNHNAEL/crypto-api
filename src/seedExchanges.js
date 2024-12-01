const mongoose = require('mongoose');
const Exchange = require('./models/exchange.js'); // Model Exchange của bạn
const exchanges = require('./exchanges.js'); // Hoặc './exchanges.json'
const dotenv = require('dotenv');

dotenv.config();

// Kết nối tới MongoDB local
mongoose.connect('mongodb://localhost:27017/trade_crypto', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Đã kết nối MongoDB'))
  .catch(error => console.error('Lỗi kết nối MongoDB:', error));

// Kết nối tới MongoDB Atlas
// mongoose.connect(process.env.MONGODB_ATLAS_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
//   })
//     .then(() => console.log('Đã kết nối MongoDB'))
//     .catch(error => console.error('Lỗi kết nối MongoDB:', error));

async function seedExchanges() {
  try {
    // Xóa các dữ liệu Exchange hiện có nếu cần
    await Exchange.deleteMany({});
    console.log('Đã xóa dữ liệu Exchange cũ.');

    // Chèn các dữ liệu Exchange từ file
    await Exchange.insertMany(exchanges);
    console.log('Đã chèn dữ liệu Exchange mới thành công.');
  } catch (error) {
    console.error('Lỗi khi chèn dữ liệu Exchange:', error);
  } finally {
    mongoose.connection.close(); // Đóng kết nối sau khi hoàn tất
  }
}

seedExchanges();
