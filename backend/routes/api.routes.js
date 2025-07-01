const express = require("express");
const axios = require("axios");

module.exports = (currentPrices, priceHistory) => {
  const router = express.Router();

  router.get("/prices", (req, res) => {
    res.json(Array.from(currentPrices.values()));
  });

  router.get("/history/:symbol", (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    res.json(priceHistory.get(symbol) || []);
  });

  // Updated klines endpoint with multiple API fallbacks
  router.get("/klines/:symbol", async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();

      // Try Binance first
      let klines = await fetchBinanceKlines(symbol);

      // If Binance fails, try CoinPaprika
      if (!klines) {
        klines = await fetchCoinPaprikaKlines(symbol);
      }

      // If both fail, generate from price history
      if (!klines) {
        klines = generateKlinesFromHistory(symbol, priceHistory);
      }

      res.json(klines || []);
    } catch (err) {
      console.error("Error fetching klines:", err.message);
      res.status(500).json({ error: "Failed to fetch klines data" });
    }
  });

  router.get("/report", (req, res) => {
    const prices = Array.from(currentPrices.values());

    if (prices.length === 0) {
      return res.json({
        timestamp: new Date().toISOString(),
        data: [],
        summary: {
          total_cryptocurrencies: 0,
          top_gainer: null,
          top_loser: null,
        },
      });
    }

    const report = {
      timestamp: new Date().toISOString(),
      data: prices,
      summary: {
        total_cryptocurrencies: prices.length,
        top_gainer: prices.reduce(
          (max, curr) => (curr.change > max.change ? curr : max),
          prices[0]
        ),
        top_loser: prices.reduce(
          (min, curr) => (curr.change < min.change ? curr : min),
          prices[0]
        ),
      },
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=crypto-report.json"
    );
    res.json(report);
  });

  return router;
};

// Helper function to fetch Binance klines
async function fetchBinanceKlines(symbol) {
  try {
    const response = await axios.get("https://api.binance.com/api/v3/klines", {
      params: {
        symbol,
        interval: "1h",
        limit: 24,
      },
      timeout: 8000,
    });

    const klines = response.data.map((kline) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));

    return klines;
  } catch (error) {
    console.error("Binance klines failed:", error.message);
    return null;
  }
}

// Helper function to fetch CoinPaprika historical data
async function fetchCoinPaprikaKlines(symbol) {
  try {
    const symbolMap = {
      BTCUSDT: "btc-bitcoin",
      ETHUSDT: "eth-ethereum",
      BNBUSDT: "bnb-binance-coin",
      ADAUSDT: "ada-cardano",
      XRPUSDT: "xrp-xrp",
      SOLUSDT: "sol-solana",
      DOTUSDT: "dot-polkadot",
      DOGEUSDT: "doge-dogecoin",
      AVAXUSDT: "avax-avalanche",
      MATICUSDT: "matic-polygon",
    };

    const coinId = symbolMap[symbol];
    if (!coinId) return null;

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const response = await axios.get(
      `https://api.coinpaprika.com/v1/coins/${coinId}/ohlcv/historical`,
      {
        params: {
          start: startDate.toISOString().split("T")[0],
          end: endDate.toISOString().split("T")[0],
          limit: 24,
          quote: "usd",
        },
        timeout: 10000,
      }
    );

    const klines = response.data.map((item) => ({
      timestamp: new Date(item.time_open).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseFloat(item.volume),
    }));

    return klines;
  } catch (error) {
    console.error("CoinPaprika klines failed:", error.message);
    return null;
  }
}

// Helper function to generate klines from price history
function generateKlinesFromHistory(symbol, priceHistory) {
  try {
    const history = priceHistory.get(symbol) || [];

    if (history.length === 0) {
      return [];
    }

    // Take last 24 data points or whatever is available
    const recentHistory = history.slice(-24);

    const klines = recentHistory.map((item, index) => {
      const price = item.price;
      const timestamp = item.timestamp;

      // Generate realistic OHLC from single price point
      const volatility = 0.02; // 2% volatility
      const randomFactor = Math.random() * volatility;

      return {
        timestamp,
        open: index > 0 ? recentHistory[index - 1].price : price,
        high: price * (1 + randomFactor),
        low: price * (1 - randomFactor),
        close: price,
        volume: Math.random() * 1000, // Mock volume
      };
    });

    return klines;
  } catch (error) {
    console.error("Error generating klines from history:", error.message);
    return [];
  }
}
