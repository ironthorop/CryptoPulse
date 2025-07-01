const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const http = require("http");
const axios = require("axios");
const apiRoutes = require("./routes/api.routes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// CORS for frontend hosted on Vercel
const allowedOrigins = [process.env.FE1]; // e.g. https://cryptopulse.vercel.app
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Store for price history and current prices
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

// REST polling fallback instead of WebSocket (Render blocks wss)
const fetchBinancePrices = async () => {
  try {
    const { data } = await axios.get(
      "https://api.binance.com/api/v3/ticker/24hr"
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

      // Update price history
      if (!priceHistory.has(symbol)) priceHistory.set(symbol, []);
      const history = priceHistory.get(symbol);
      history.push({ price, timestamp: Date.now() });
      if (history.length > 1440) history.shift(); // keep 24h history (1/min)

      // Broadcast to WebSocket clients
      broadcastToClients({
        type: "price_update",
        data: currentPrices.get(symbol),
      });
    });
  } catch (error) {
    console.error("Error fetching Binance prices:", error.message);
  }
};

// Start polling Binance REST API every 10s
setInterval(fetchBinancePrices, 10000);

// WebSocket setup for broadcasting
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");
  clients.add(ws);

  // Send current price snapshot
  ws.send(
    JSON.stringify({
      type: "initial_data",
      data: Array.from(currentPrices.values()),
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
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

// API Routes
app.use("/api", apiRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`Server running with WebSocket on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  wss.close();
  server.close(() => process.exit(0));
});
