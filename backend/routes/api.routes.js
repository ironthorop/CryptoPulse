const router = require("express").Router();
const axios = require("axios");

// REST API endpoints
router.get("/prices", (req, res) => {
  const prices = Array.from(currentPrices.values());
  res.json(prices);
});

router.get("/history/:symbol", (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const history = priceHistory.get(symbol) || [];
  res.json(history);
});

// Get 24h price history from Binance API
router.get("/klines/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
      params: {
        symbol: symbol,
        interval: "1h",
        limit: 24,
      },
    });

    const klines = response.data.map((kline) => ({
      timestamp: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));

    res.json(klines);
  } catch (error) {
    console.error("Error fetching klines:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Download report endpoint
router.get("/report", (req, res) => {
  const prices = Array.from(currentPrices.values());
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

module.exports = router;
