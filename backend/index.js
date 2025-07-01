const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Initialize data stores
const priceHistory = new Map();
const currentPrices = new Map();
const symbols = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "ADAUSDT",
  "XRPUSDT",
  "SOLUSDT",
  "DOTUSDT",
  "DOGEUSDT",
  "AVAXUSDT",
  "MATICUSDT",
];

// API configurations for fallback
const API_CONFIGS = {
  COINPAPRIKA: {
    name: "CoinPaprika",
    symbols: {
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
    },
  },
  KRAKEN: {
    name: "Kraken",
    symbols: {
      BTCUSDT: "XBTUSD",
      ETHUSDT: "ETHUSD",
      ADAUSDT: "ADAUSD",
      XRPUSDT: "XRPUSD",
      SOLUSDT: "SOLUSD",
      DOTUSDT: "DOTUSD",
      DOGEUSDT: "DOGEUSD",
      AVAXUSDT: "AVAXUSD",
      MATICUSDT: "MATICUSD",
    },
  },
};

// Middleware
app.use(cors());
const allowedOrigins = [process.env.FE1];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

// Inject API routes
const apiRoutes = require("./routes/api.routes")(currentPrices, priceHistory);
app.use("/api", apiRoutes);

// WebSocket server
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");
  clients.add(ws);

  // Send initial data
  ws.send(
    JSON.stringify({
      type: "initial_data",
      data: Array.from(currentPrices.values()),
    })
  );

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
    clients.delete(ws);
  });
});

// Broadcast function
const broadcastToClients = (message) => {
  const msg = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
};

// Helper function to update price data
function updatePriceData(symbol, price, change, volume) {
  currentPrices.set(symbol, {
    symbol,
    price: parseFloat(price),
    change: parseFloat(change),
    volume: parseFloat(volume),
    timestamp: Date.now(),
  });

  if (!priceHistory.has(symbol)) priceHistory.set(symbol, []);
  const history = priceHistory.get(symbol);
  history.push({ price: parseFloat(price), timestamp: Date.now() });
  if (history.length > 1440) history.shift(); // keep 24h data (1/min)

  broadcastToClients({
    type: "price_update",
    data: currentPrices.get(symbol),
  });
}

// Original Binance fetch function
async function fetchBinancePrices() {
  try {
    const { data } = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr",
      {
        timeout: 8000,
      }
    );

    const filtered = data.filter((ticker) => symbols.includes(ticker.symbol));

    filtered.forEach((ticker) => {
      const { symbol, lastPrice, priceChangePercent, volume } = ticker;
      const price = parseFloat(lastPrice);
      const change = parseFloat(priceChangePercent);
      const vol = parseFloat(volume);

      updatePriceData(symbol, price, change, vol);
    });

    console.log("Fetched data from Binance");
    return true;
  } catch (error) {
    console.error("Binance failed:", error.message);
    return false;
  }
}

// CoinPaprika fallback
async function fetchCoinPaprikaData() {
  try {
    const coinIds = Object.values(API_CONFIGS.COINPAPRIKA.symbols);

    const response = await axios.get("https://api.coinpaprika.com/v1/tickers", {
      timeout: 10000,
    });

    const relevantCoins = response.data.filter((coin) =>
      coinIds.includes(coin.id)
    );

    relevantCoins.forEach((coin) => {
      const symbol = Object.keys(API_CONFIGS.COINPAPRIKA.symbols).find(
        (key) => API_CONFIGS.COINPAPRIKA.symbols[key] === coin.id
      );

      if (symbol && symbols.includes(symbol)) {
        const price = coin.quotes.USD.price;
        const change = coin.quotes.USD.percent_change_24h;
        const volume = coin.quotes.USD.volume_24h;

        updatePriceData(symbol, price, change, volume);
      }
    });

    console.log("Fetched data from CoinPaprika");
    return true;
  } catch (error) {
    console.error("CoinPaprika failed:", error.message);
    return false;
  }
}

// Kraken fallback
async function fetchKrakenData() {
  try {
    const krakenPairs = Object.values(API_CONFIGS.KRAKEN.symbols).join(",");

    const response = await axios.get("https://api.kraken.com/0/public/Ticker", {
      params: { pair: krakenPairs },
      timeout: 10000,
    });

    Object.entries(response.data.result).forEach(([pair, data]) => {
      const symbol = Object.keys(API_CONFIGS.KRAKEN.symbols).find(
        (key) => API_CONFIGS.KRAKEN.symbols[key] === pair.replace(/^X|^Z/, "")
      );

      if (symbol && symbols.includes(symbol)) {
        const price = parseFloat(data.c[0]);
        const yesterdayPrice = parseFloat(data.o);
        const change = ((price - yesterdayPrice) / yesterdayPrice) * 100;
        const volume = parseFloat(data.v[1]);

        updatePriceData(symbol, price, change, volume);
      }
    });

    console.log("Fetched data from Kraken");
    return true;
  } catch (error) {
    console.error("Kraken failed:", error.message);
    return false;
  }
}

// Mock data generator as final fallback
function generateMockData() {
  const mockPrices = {
    BTCUSDT: { base: 45000, volatility: 0.05 },
    ETHUSDT: { base: 3000, volatility: 0.08 },
    BNBUSDT: { base: 400, volatility: 0.06 },
    ADAUSDT: { base: 1.2, volatility: 0.1 },
    XRPUSDT: { base: 0.6, volatility: 0.12 },
    SOLUSDT: { base: 100, volatility: 0.15 },
    DOTUSDT: { base: 25, volatility: 0.1 },
    DOGEUSDT: { base: 0.3, volatility: 0.2 },
    AVAXUSDT: { base: 35, volatility: 0.12 },
    MATICUSDT: { base: 2.5, volatility: 0.15 },
  };

  symbols.forEach((symbol) => {
    const config = mockPrices[symbol];
    if (config) {
      const randomFactor = 1 + (Math.random() - 0.5) * config.volatility;
      const price = config.base * randomFactor;
      const change = (Math.random() - 0.5) * 10;
      const volume = Math.random() * 1000000;

      updatePriceData(symbol, price, change, volume);
    }
  });

  console.log("Using mock data as fallback");
}

// Main fetch function with fallback logic
async function fetchPricesWithFallback(retries = 3) {
  // Try Binance first (original)
  let success = await fetchBinancePrices();

  // Try CoinPaprika if Binance fails
  if (!success) {
    success = await fetchCoinPaprikaData();
  }

  // Try Kraken if CoinPaprika fails
  if (!success) {
    success = await fetchKrakenData();
  }

  // Use mock data if all APIs fail
  if (!success) {
    generateMockData();
  }
}

// Poll every 30 seconds with fallback
setInterval(fetchPricesWithFallback, 30000);
fetchPricesWithFallback(); // immediate first fetch

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  wss.close();
  server.close(() => process.exit(0));
});
