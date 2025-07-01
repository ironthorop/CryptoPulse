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

// Middleware
app.use(cors());
const allowedOrigins = [process.env.FE1]; // Example: https://cryptopulse.vercel.app
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

// Fetch prices from Binance using REST API
async function fetchBinancePrices(retries = 3) {
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

      currentPrices.set(symbol, {
        symbol,
        price,
        change,
        volume: vol,
        timestamp: Date.now(),
      });

      if (!priceHistory.has(symbol)) priceHistory.set(symbol, []);
      const history = priceHistory.get(symbol);
      history.push({ price, timestamp: Date.now() });
      if (history.length > 1440) history.shift(); // keep 24h data (1/min)

      broadcastToClients({
        type: "price_update",
        data: currentPrices.get(symbol),
      });
    });
  } catch (error) {
    if (retries > 0) {
      console.warn(`Retrying Binance fetch... (${3 - retries + 1})`);
      setTimeout(() => fetchBinancePrices(retries - 1), 3000);
    } else {
      console.error("Binance fetch failed:", error.message);
    }
  }
}

// Poll Binance every 30 seconds
setInterval(fetchBinancePrices, 30000);
fetchBinancePrices(); // immediate first fetch

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
