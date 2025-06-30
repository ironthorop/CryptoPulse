# CryptoPulse - Real-Time Cryptocurrency Tracker

A comprehensive MERN stack application that provides real-time cryptocurrency price tracking with WebSocket connections, interactive charts, and a modern responsive UI.

## Features

✅ **Real-time Price Updates** - Live WebSocket connection to Binance API  
✅ **Interactive Dashboard** - Clean, modern UI displaying 10 major cryptocurrencies  
✅ **Live Price Charts** - 24-hour price history with Recharts integration  
✅ **Favorites System** - Mark and track your preferred cryptocurrencies  
✅ **Dark/Light Mode** - Toggle between themes with persistent settings  
✅ **Download Reports** - Export price data and analytics  
✅ **Responsive Design** - Works seamlessly on all devices  
✅ **Connection Status** - Visual indicator for real-time connection status

## Project Structure

```
cryptopulse/
├── backend/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   └── App.js
    ├── package.json
    └── public/
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. **Create the backend directory and files:**
```bash
mkdir cryptopulse-backend
cd cryptopulse-backend
```

2. **Create package.json** (use the provided backend package.json)

3. **Install dependencies:**
```bash
npm install
```

4. **Create server.js** (use the provided server.js file)

5. **Start the backend server:**
```bash
npm run dev
```
The backend will run on `http://localhost:5000` and WebSocket server on `ws://localhost:8080`

### Frontend Setup

1. **Create React app:**
```bash
npx create-react-app cryptopulse-frontend
cd cryptopulse-frontend
```

2. **Install additional dependencies:**
```bash
npm install recharts lucide-react
```

3. **Install Tailwind CSS:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. **Configure Tailwind (tailwind.config.js):**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

5. **Add Tailwind directives to src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

6. **Replace src/App.js** with the provided React component

7. **Update package.json** with the provided frontend package.json (merge dependencies)

8. **Start the frontend:**
```bash
npm start
```
The frontend will run on `http://localhost:3000`

## API Endpoints

### WebSocket Connection
- `ws://localhost:8080` - Real-time price updates

### REST API
- `GET /api/prices` - Get current prices for all cryptocurrencies
- `GET /api/history/:symbol` - Get price history for a specific symbol
- `GET /api/klines/:symbol` - Get 24-hour candlestick data from Binance
- `GET /api/report` - Download comprehensive price report (JSON format)

## Supported Cryptocurrencies

The application tracks the following 10 major cryptocurrencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Cardano (ADA)
- Ripple (XRP)
- Solana (SOL)
- Polkadot (DOT)
- Dogecoin (DOGE)
- Avalanche (AVAX)
- Polygon (MATIC)

## Key Technologies Used

### Backend
- **Node.js & Express** - Server framework
- **WebSocket (ws)** - Real-time communication
- **Axios** - HTTP client for REST API calls
- **Binance WebSocket API** - Live cryptocurrency data
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI framework with hooks
- **Recharts** - Interactive charting library
- **Lucide React** - Modern icon library
- **Tailwind CSS** - Utility-first CSS framework
- **WebSocket API** - Client-side real-time connection

## Architecture Overview

### Real-time Data Flow
1. **Binance WebSocket** → Backend server receives live price updates
2. **Backend Processing** → Server processes and stores price data
3. **Client WebSocket** → Backend broadcasts updates to connected clients
4. **React State** → Frontend updates UI in real-time

### Data Storage
- **In-memory storage** for current prices and recent history
- **Price history** maintained for last 24 hours (up to 1440 data points)
- **Local storage** for user preferences (favorites, theme)

## Features Deep Dive

### 1. Real-time Price Updates
- WebSocket connection to Binance stream API
- Automatic reconnection on connection loss
- Live connection status indicator
- Sub-second price updates

### 2. Interactive Price Dashboard
- Grid layout with responsive design
- Color-coded price changes (green/red)
- Click to select cryptocurrency for detailed chart
- Volume and percentage change indicators

### 3. Live Price Charts
- 24-hour candlestick data visualization
- Responsive chart that adapts to container
- Tooltip showing exact price and time
- Smooth animations and transitions

### 4. Favorites System
- Star/unstar cryptocurrencies
- Persistent storage using localStorage
- Dedicated favorites section
- Quick access to preferred coins

### 5. Theme Toggle
- Dark and light mode support
- Persistent theme preference
- Smooth color transitions
- System-friendly color schemes

### 6. Download Reports
- JSON format with comprehensive data
- Includes current prices, changes, and analytics
- Timestamp and summary statistics
- Top gainer/loser identification

## Customization Options

### Adding More Cryptocurrencies
Modify the `symbols` array in `server.js`:
```javascript
const symbols = ['BTCUSDT', 'ETHUSDT', 'NEWCOINUSDT', ...];
```

### Changing Update Frequency
Adjust the price history retention in `server.js`:
```javascript
// Keep more or fewer data points
if (history.length > 2880) { // 2 days worth
    history.shift();
}
```

### Styling Customization
Modify Tailwind classes in the React component or extend the theme in `tailwind.config.js`.

## Deployment Considerations

### Environment Variables
Create `.env` files for different environments:
```bash
# Backend .env
PORT=5000
WS_PORT=8080
NODE_ENV=production
```

### Production Build
```bash
# Frontend
npm run build

# Backend (with process manager)
npm install -g pm2
pm2 start server.js --name cryptopulse-backend
```

### HTTPS and WSS
For production, ensure both HTTP and WebSocket connections use secure protocols (HTTPS/WSS).

## Error Handling

The application includes comprehensive error handling for:
- WebSocket connection failures with auto-reconnection
- API request timeouts and network errors
- Invalid data parsing from external APIs
- Client disconnections and cleanup

## Performance Optimizations

- **Efficient state updates** using React hooks
- **Memory management** with circular buffer for price history
- **Debounced updates** to prevent excessive re-renders
- **Lazy loading** of chart data only when needed

## Testing the Application

1. **Start both servers** (backend on :5000, frontend on :3000)
2. **Verify WebSocket connection** - Check "Live" status indicator
3. **Test real-time updates** - Prices should update automatically
4. **Try interactive features**:
   - Click different cryptocurrencies to see charts
   - Toggle favorites (star icons)
   - Switch between dark/light modes
   - Download a report
5. **Test responsiveness** - Resize browser window

## Troubleshooting

### Common Issues

**WebSocket connection fails:**
- Check if backend is running on port 8080
- Verify firewall settings
- Check browser console for errors

**Charts not loading:**
- Ensure Recharts is properly installed
- Check API responses in Network tab
- Verify Binance API accessibility

**Styling issues:**
- Confirm Tailwind CSS is properly configured
- Check if dark mode classes are working
- Verify CSS build process

### Debug Mode
Add logging to track data flow:
```javascript
// In React component
console.log('Price update received:', message.data);

// In backend
console.log('Broadcasting to clients:', messageStr);
```

## Next Steps & Enhancements

Potential improvements for the application:
- **MongoDB integration** for persistent data storage
- **User authentication** for personalized dashboards
- **Price alerts** with email/SMS notifications
- **Portfolio tracking** with profit/loss calculations
- **Advanced charting** with technical indicators
- **Mobile app** using React Native
- **Trading integration** with exchange APIs
- **News feed** integration for market sentiment

This comprehensive setup provides a fully functional, production-ready cryptocurrency tracking application with modern web technologies and best practices.
# CryptoPulse