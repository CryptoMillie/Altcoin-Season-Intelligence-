'use client';

import { useState, useEffect } from 'react';
import GaugeMeter from '../components/GaugeMeter';
import IndicatorCard from '../components/IndicatorCard';

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const calculateScore = (indicators) => {
    if (!indicators) return 0;
    let score = 0;
    indicators.forEach(indicator => {
      if (indicator.signal === 'bullish') score += 1;
      else if (indicator.signal === 'neutral') score += 0.5;
    });
    return Math.round((score / indicators.length) * 100);
  };

  const score = data ? calculateScore(data.indicators) : 0;

  return (
    <main className="relative min-h-screen p-4 md:p-8">
      <div className="ambient-glow" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 md:mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-white mb-2 tracking-wider">
            ALTSIGNAL
          </h1>
          <p className="text-gray-400 text-sm md:text-base font-mono">
            Real-time altseason probability tracker
          </p>
          {lastUpdated && (
            <p className="text-gray-500 text-xs mt-2 font-mono">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </header>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center h-64">
            <div className="text-accent-cyan font-mono animate-pulse-slow">
              Initializing dashboard...
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center p-8 bg-card rounded-lg border border-signal-bearish/30">
            <p className="text-signal-bearish font-mono">Error: {error}</p>
            <button 
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-accent-cyan/20 text-accent-cyan rounded hover:bg-accent-cyan/30 transition-colors font-mono text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {data && (
          <>
            {/* Gauge Section */}
            <section className="mb-8 md:mb-12">
              <GaugeMeter 
                score={data.indicators.filter(i => i.signal === 'bullish').length + data.indicators.filter(i => i.signal === 'neutral').length * 0.5} 
                probability={data.probability || score} 
                bullish={data.bullish || 0}
                neutral={data.neutral || 0}
                bearish={data.bearish || 0}
              />
            </section>

            {/* Indicators Grid */}
            <section>
              <h2 className="font-display text-xl md:text-2xl font-semibold text-accent-cyan mb-6 text-center tracking-wide">
                MARKET INDICATORS
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {data.indicators.map((indicator) => (
                  <IndicatorCard key={indicator.id} indicator={indicator} />
                ))}
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-12 text-center text-gray-500 text-xs font-mono">
              <p>Auto-refreshes every 10 minutes - Data from CoinGecko and BlockchainCenter</p>
              <p className="mt-1">Not financial advice</p>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}
