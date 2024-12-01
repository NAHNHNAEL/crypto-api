const TokenPrice = require("../models/token-price.js");
const ccxt = require("ccxt");
const axios = require("axios");
const Token = require("../models/token.js");
const Exchange = require("../models/exchange.js");
const cron = require('node-cron');

// Hàm lấy thông tin token từ coingecko dựa vào tên token
const getTokenId = async (tokenName, symbol) => {
  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${tokenName}`;
    const response = await axios.get(url);
    const data = response.data.coins;

    if (data.length > 0) {
      // Tìm token có symbol khớp với symbol được cung cấp
      const token = data.find(
        (coin) => coin.symbol.toLowerCase() === symbol.toLowerCase()
      );
      if (token) {
        return token.id;
      } else {
        console.error(
          `No token found for name: ${tokenName} with symbol: ${symbol}`
        );
        return null;
      }
    } else {
      console.error(`No token found for name: ${tokenName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching token id for ${tokenName}:`, error.message);
    return null;
  }
};

// Hàm lấy thông tin token từ coingecko dựa vào id token
const fetchTokenInfo = async (tokenSymbol, tokenName) => {
  try {
    // Tìm token trong database
    const tokenInfo = await Token.findOne({
      name: tokenName,
      symbol: { $regex: new RegExp(`^${tokenSymbol}$`, "i") }, // Tìm kiếm không phân biệt hoa thường
    });

    // Nếu tìm thấy thì trả về id token
    if (tokenInfo !== null) {
      return tokenInfo.id;
    }

    // Nếu không tìm thấy thì gọi API để lấy thông tin token từ coingecko
    const tokenId = await getTokenId(tokenName, tokenSymbol);
    if (!tokenId) {
      return null;
    }

    // Gọi API để lấy thông tin token từ coingecko
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${tokenId}`;
    const response = await axios.get(url);
    const data = response.data[0];

    if (data) {
      // Lưu thông tin vào database
      const token = new Token({
        id: data.id,
        name: data.name,
        symbol: data.symbol,
        volume24h: data.total_volume,
        marketCap: data.market_cap,
      });

      await token.save();
      console.log("Token saved to database:", token);
      // lấy thông tin id token vừa mới lưu
      const tokenInfo = await Token.findOne({ id: data.id });

      return tokenInfo.id;
    } else {
      console.error(`No data found for ${tokenName}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching volume for ${tokenName}:`, error.message);
    return null;
  }
};

// Hàm lấy giá token từ ccxt
const fetchTokenPrice = async (tokenId, exchangeSymbol, tokenSymbol) => {
  const symbol = `${tokenSymbol.toUpperCase()}/USDT`;

  try {

    const price = await fetchTokenPriceByCCXT(exchangeSymbol, tokenSymbol);

    if (!price) {
      console.error(`No price found for ${tokenSymbol} from ${exchangeSymbol}`);
      return null;
    }
    // Lưu giá vào database
    const tokenInfo = await upsertTokenPrice(
      tokenId,
      symbol,
      price,
      exchangeSymbol
    );

    return tokenInfo;
  } catch (error) {
    console.error(
      `Error fetching price for ${tokenSymbol} from ${exchangeSymbol}:`,
      error.message
    );
    return null;
  }
};

// Thêm token vào database và cập nhật giá
const upsertTokenPrice = async (tokenId, symbol, price, exchangeSymbol) => {
  try {
    
    // Tìm exchange id từ database
    const exchangeDoc = await Exchange.findOne({ symbol: exchangeSymbol });

    // Nếu không tìm thấy exchange thì báo lỗi
    if (!exchangeDoc) {
      throw new Error(`Exchange ${exchangeSymbol} not found`);
    }

    // Lấy exchange id
    const exchangeId = exchangeDoc._id;
    console.log("exchangeId: " + exchangeId);

    // Tìm token từ database
    const token = await Token.findOne({ id: tokenId });
    console.log("token: " + token);

    // Nếu không tìm thấy token thì báo lỗi
    if (!token) {
      console.log("Token không tồn tại.");
      return null;
    }

    // Tìm giá từ sàn trong mảng `prices` của token
    const priceIndex = token.prices.findIndex(
      (p) => p.exchangeId.toString() === exchangeId.toString()
    );

    console.log("priceIndex: " + priceIndex);

    if (priceIndex !== -1) {
      // Nếu đã có giá từ sàn này, cập nhật giá và thời gian
      token.prices[priceIndex].price = price;
      token.prices[priceIndex].timestamp = new Date();
      console.log(`Đã cập nhật giá cho token từ sàn ${exchangeId}: ${price}`);
    } else {
      // Nếu chưa có giá từ sàn này, thêm giá mới vào mảng `prices`
      token.prices.push({
        exchangeId,
        price,
        timestamp: new Date(),
      });
      console.log(`Đã thêm giá mới cho token từ sàn ${exchangeId}: ${price}`);
    }

    // Lưu token với cập nhật mới
    await token.save();

    // return token
    const result = await Token.findOne(
      { id: tokenId },
      { id: 1, name: 1, symbol: 1, volume24h: 1, marketCap: 1, prices: { $elemMatch: { exchangeId } } }
    );
    console.log("Upserted token price:", result);
    return result;
  } catch (error) {
    console.error("Error upserting token price:", error);
    return null;
  }
};

// Hàm lấy giá token từ ccxt
const fetchTokenPriceByCCXT = async ( exchangeSymbol, tokenSymbol) => {
  const symbol = `${tokenSymbol.toUpperCase()}/USDT`;

  try {
    // Khai báo class exchange từ ccxt
    const ExchangeClass = ccxt[exchangeSymbol];
    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeSymbol} not found`);
    }

    const exchangeInstance = new ExchangeClass({
      enableRateLimit: true,
    });

    // Lấy giá từ sàn
    const ticker = await exchangeInstance.fetchTicker(symbol);
    const price = ticker.last;

    if (!price) {
      console.error(`No price found for ${tokenSymbol} from ${exchangeSymbol}`);
      return null;
    }
    return price;
  } catch (error) {
    console.error(
      `Error fetching price for ${tokenSymbol} from ${exchangeSymbol}:`,
      error.message
    );
    return null;
  }
};

// Hàm cập nhật dữ liệu toàn bộ
async function updateAllData() {
  try {
      // Lấy toàn bộ token từ DB
      const tokens = await Token.find();

      // Duyệt qua từng token và cập nhật dữ liệu cho từng sàn
      for (const token of tokens) {
          // Giả sử có hàm fetchAndUpdateTokenPrices để cập nhật giá từng sàn và thông tin cơ bản
          await fetchAndUpdateTokenPrices(token);
      }

      console.log("Cập nhật dữ liệu thành công!");
  } catch (error) {
      console.error("Lỗi khi cập nhật dữ liệu:", error);
  }
}


async function fetchAndUpdateTokenPrices(token) {
  try {
      // Gọi CoinGecko API để lấy volume24h và marketCap
      // Gọi API để lấy thông tin token từ coingecko
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${token.id}`;
      const response = await axios.get(url);
      const coingeckoData = response.data[0];

      // Cập nhật volume24h và marketCap từ CoinGecko
      token.volume24h = coingeckoData.total_volume;
      token.marketCap = coingeckoData.market_cap;
      token.timestamp = new Date();

      // Cập nhật giá cho từng sàn trong mảng prices
      for (const price of token.prices) {
          // Lấy exchange từ DB theo exchangeId
          const exchangeInfo = await Exchange.findById(price.exchangeId);

          if (!exchangeInfo) {
              console.error(`Không tìm thấy sàn ${price.exchangeId}`);
              continue;
          }

          // Lấy giá từ sàn
          const result = await fetchTokenPriceByCCXT(exchangeInfo.symbol, token.symbol);

          // Cập nhật giá và timestamp cho từng sàn
          price.price = result;
          price.timestamp = new Date();

          // Tạo key cache cho token
          const cacheKey = `${token.symbol.toLowerCase()}-${token.name.toLowerCase()}-${exchangeInfo.symbol.toLowerCase()}`;
          console.log(`cacheKey: ${cacheKey}`);
          console.log(`Cập nhật giá cho token ${token.symbol} từ sàn ${exchangeInfo.symbol}: ${result}`);
      }

      // Lưu lại token đã cập nhật vào DB
      await token.save();

      console.log(`Cập nhật thành công cho token: ${token.symbol}`);

  } catch (error) {
      console.error(`Lỗi khi cập nhật token ${token.symbol}:`, error);
  }
}

cron.schedule('*/5 * * * *', updateAllData);

module.exports = {
  fetchTokenInfo,
  fetchTokenPrice,
};

