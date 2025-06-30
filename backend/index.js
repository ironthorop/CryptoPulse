const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const path = require("path");
const apiRoutes = require("./routes/api.routes");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "build")));

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

// Initialize WebSocket connection to Binance
let binanceWs;
const connectToBinance = () => {
  const streamUrl = `wss://stream.binance.com:9443/ws/${symbols
    .map((s) => s.toLowerCase() + "@ticker")
    .join("/")}`;

  binanceWs = new WebSocket(streamUrl);

  binanceWs.on("open", () => {
    console.log("Connected to Binance WebSocket");
  });

  binanceWs.on("message", (data) => {
    try {
      const ticker = JSON.parse(data);
      const symbol = ticker.s;
      const price = parseFloat(ticker.c);
      const change = parseFloat(ticker.P);
      const volume = parseFloat(ticker.v);

      // Update current prices
      currentPrices.set(symbol, {
        symbol,
        price,
        change,
        volume,
        timestamp: Date.now(),
      });

      // Store price history (keep last 24 hours worth of data)
      if (!priceHistory.has(symbol)) {
        priceHistory.set(symbol, []);
      }

      const history = priceHistory.get(symbol);
      history.push({
        price,
        timestamp: Date.now(),
      });

      // Keep only last 24 hours (assuming 1 update per minute = 1440 points)
      if (history.length > 1440) {
        history.shift();
      }

      // Broadcast to all connected clients
      broadcastToClients({
        type: "price_update",
        data: {
          symbol,
          price,
          change,
          volume,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error("Error parsing WebSocket data:", error);
    }
  });

  binanceWs.on("error", (error) => {
    console.error("Binance WebSocket error:", error);
  });

  binanceWs.on("close", () => {
    console.log("Binance WebSocket closed. Reconnecting...");
    setTimeout(connectToBinance, 5000);
  });
};

// WebSocket server for clients
const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  // Send current prices to new client
  const currentData = Array.from(currentPrices.values());
  ws.send(
    JSON.stringify({
      type: "initial_data",
      data: currentData,
    })
  );

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("Client WebSocket error:", error);
    clients.delete(ws);
  });
});

// Broadcast function
const broadcastToClients = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

//Endpoints
app.use("/api", apiRoutes);

// Serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build/index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to Binance WebSocket
connectToBinance();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  if (binanceWs) {
    binanceWs.close();
  }
  wss.close();
  process.exit(0);
});
