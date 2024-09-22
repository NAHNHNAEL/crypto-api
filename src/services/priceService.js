import ccxt from 'ccxt';

// Biến lưu trữ giá token
const cachedPrices = {};

// Hàm lấy giá token từ sàn giao dịch
const fetchTokenPrice = async (exchangeName, tokenName) => {
  const symbol = `${tokenName}/USDT`;
  try {
    const ExchangeClass = ccxt[exchangeName];
    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeName} not found`);
    }

    const exchangeInstance = new ExchangeClass({
      enableRateLimit: true,
    });

    const ticker = await exchangeInstance.fetchTicker(symbol);
    const price = ticker.last;

    // Lưu giá vào cache với timestamp
    cachedPrices[`${exchangeName}-${tokenName}`] = {
      price,
      lastUpdated: Date.now(),
    };

    console.log(`Updated ${tokenName} price from ${exchangeName}: $${price}`);
  } catch (error) {
    console.error(`Error fetching price for ${tokenName} from ${exchangeName}:`, error.message);
  }
};

// Hàm để lấy giá từ cache
const getCachedPrice = (exchangeName, tokenName) => {
  const key = `${exchangeName}-${tokenName}`;
  const data = cachedPrices[key];
  if (data) {
    return data.price;
  }
  return null;
};

// Hàm khởi động cập nhật giá định kỳ
const startPriceUpdater = () => {
  // Danh sách các cặp exchange và token mà bạn muốn theo dõi
  const tokensToTrack = [
    { exchange: 'binance', token: 'BTC' },
    { exchange: 'binance', token: 'ETH' },
  ];

  // Lấy giá ngay khi khởi động server
  tokensToTrack.forEach(({ exchange, token }) => {
    fetchTokenPrice(exchange, token);
  });

  // Thiết lập cập nhật mỗi 60 giây
  setInterval(() => {
    tokensToTrack.forEach(({ exchange, token }) => {
      fetchTokenPrice(exchange, token);
    });
  }, 60 * 1000); // 60 giây
};

// Xuất các hàm cần thiết
export { fetchTokenPrice, getCachedPrice, startPriceUpdater };
