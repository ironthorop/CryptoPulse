# 🔥 CryptoPulse – Real-Time Cryptocurrency Tracker

**CryptoPulse** is a full-stack cryptocurrency dashboard built using the **MERN stack**. It delivers real-time crypto price tracking using WebSocket, along with 24-hour chart history and a polished, responsive UI.

## 🔗 Live Demo

👉 [View Live Demo](https://crypto-pulse-zly8.vercel.app/)

---

## 🚀 Features

* ✅ **Live Price Updates** from Binance WebSocket API
* 📊 **24-Hour Price Charts** with CoinGecko API fallback
* ⭐ **Favorites Tracking** via localStorage
* 🌙 **Dark/Light Mode** toggle with persistence
* 📅 **Download JSON Report** of current prices
* 📱 **Responsive Design** for mobile and desktop
* 🟢 **Connection Status Indicator** for WebSocket

---

## 🧠 Tech Stack

### Frontend

* React 18
* Tailwind CSS
* Recharts
* Lucide React Icons
* WebSocket API

### Backend

* Node.js + Express.js
* WebSocket (`ws`)
* Axios
* Binance API
* CoinGecko API

---

## 📁 Project Structure

```
cryptopulse/
├── backend/
│   ├── server.js
│   ├── routes/
│   └── ...
└── frontend/
    ├── src/
    │   └── CryptoPulse.jsx
    └── ...
```

---

## ⚙️ Getting Started

### Prerequisites

* Node.js v16+
* npm or yarn

### 1️⃣ Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend runs at: `http://localhost:5000`

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at: `http://localhost:3000`

---

## 🔐 Environment Variables

### 📦 Backend `.env`

Create a `.env` file inside the `backend/` folder:

```
PORT=5000
```

### 📦 Frontend `.env`

Create a `.env` file inside the `frontend/` folder:

```
VITE_API_BASE_URI=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

---

## 🌐 API Endpoints

### WebSocket

* `ws://localhost:5000` – Real-time price updates

### REST

* `GET /api/prices` – Current prices for tracked coins
* `GET /api/klines/:symbol` – 24-hour price chart from CoinGecko
* `GET /api/report` – Download JSON report

---

## 📊 Supported Cryptocurrencies

* Bitcoin (BTC)
* Ethereum (ETH)
* Binance Coin (BNB)
* Cardano (ADA)
* Ripple (XRP)
* Solana (SOL)
* Polkadot (DOT)
* Dogecoin (DOGE)
* Avalanche (AVAX)
* Polygon (MATIC)

---

## 📋 Notes

> ⚠️ Due to external API limits (CoinGecko & Binance), you may occasionally encounter chart loading issues. Fallback and retries are implemented, but repeated requests may hit limits.

---

## 🧪 Test Checklist

* ✅ Live WebSocket data loads
* ✅ 24h chart data loads on symbol click
* ✅ Dark/Light toggle works
* ✅ Starred favorites persist
* ✅ JSON report downloads successfully

---

> Built with ❤️ by yash – a sleek real-time crypto dashboard made with MERN stack and modern design.
