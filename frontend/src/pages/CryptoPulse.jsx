import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, Download, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
const API_BASE_URI = import.meta.env.VITE_API_BASE_URI;


const CryptoPulse = () => {
  const [prices, setPrices] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState('BTCUSDT');
  const [chartData, setChartData] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('crypto-favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('crypto-theme');
    return saved ? JSON.parse(saved) : false;
  });
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(import.meta.env.VITE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to WebSocket');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'initial_data') {
          setPrices(message.data);
        } else if (message.type === 'price_update') {
          setPrices(prev => {
            const updated = [...prev];
            const index = updated.findIndex(p => p.symbol === message.data.symbol);
            if (index !== -1) {
              updated[index] = message.data;
            } else {
              updated.push(message.data);
            }
            return updated;
          });
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fetch chart data for selected crypto
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`${API_BASE_URI}/api/klines/${selectedCrypto}`);
        const data = await response.json();
        
        const formattedData = data.map(item => ({
          time: new Date(item.timestamp).toLocaleTimeString(),
          price: item.close,
          timestamp: item.timestamp
        }));
        
        setChartData(formattedData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    if (selectedCrypto) {
      fetchChartData();
    }
  }, [selectedCrypto]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('crypto-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('crypto-theme', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleFavorite = (symbol) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URI}/api/report`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crypto-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  };

  const formatSymbol = (symbol) => {
    return symbol.replace('USDT', '');
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 inline" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 inline" />;
    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                CryptoPulse
              </h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>{isConnected ? 'Live' : 'Disconnected'}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadReport}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Report</span>
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Price Cards */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-6">Live Prices</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prices.map((crypto) => (
                <div
                  key={crypto.symbol}
                  className={`p-6 rounded-xl border transition-all duration-300 cursor-pointer ${
                    selectedCrypto === crypto.symbol
                      ? darkMode
                        ? 'bg-blue-900 border-blue-600 shadow-lg'
                        : 'bg-blue-50 border-blue-300 shadow-lg'
                      : darkMode
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedCrypto(crypto.symbol)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        crypto.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {formatSymbol(crypto.symbol).substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{formatSymbol(crypto.symbol)}</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {crypto.symbol}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(crypto.symbol);
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.includes(crypto.symbol)
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : darkMode
                            ? 'text-gray-600 hover:text-gray-400'
                            : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${
                        favorites.includes(crypto.symbol) ? 'fill-current' : ''
                      }`} />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {formatCurrency(crypto.price)}
                      </span>
                    </div>
                    <div className={`flex items-center space-x-2 ${getChangeColor(crypto.change)}`}>
                      {getChangeIcon(crypto.change)}
                      <span className="font-semibold">
                        {crypto.change > 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                      </span>
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Volume: {crypto.volume.toLocaleString(undefined, {maximumFractionDigits: 0})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-6">
              {selectedCrypto ? `${formatSymbol(selectedCrypto)} - 24h Chart` : 'Select a cryptocurrency'}
            </h2>
            <div className={`p-6 rounded-xl border ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                      axisLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                      domain={['dataMin', 'dataMax']}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        color: darkMode ? '#ffffff' : '#000000'
                      }}
                      formatter={(value) => [formatCurrency(value), 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
              <span>Favorites</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {prices
                .filter(crypto => favorites.includes(crypto.symbol))
                .map((crypto) => (
                  <div
                    key={crypto.symbol}
                    className={`p-4 rounded-lg border ${
                      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{formatSymbol(crypto.symbol)}</h3>
                        <p className="text-lg font-bold">{formatCurrency(crypto.price)}</p>
                      </div>
                      <div className={`text-right ${getChangeColor(crypto.change)}`}>
                        <div className="flex items-center space-x-1">
                          {getChangeIcon(crypto.change)}
                          <span className="font-semibold">
                            {crypto.change > 0 ? '+' : ''}{crypto.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoPulse;