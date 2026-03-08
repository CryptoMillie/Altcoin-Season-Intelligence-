'use client';

import { useEffect, useState } from 'react';
import GaugeMeter from '@/components/GaugeMeter';
import IndicatorCard from '@/components/IndicatorCard';

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

  const calculateScore = () => {
    if (!data || !data.indicators) return 0;
    let score = 0;
    data.indicators.forEach(indicator => {
      if (indicator.signal === 'bullish') score += 1;
      else if (indicator.signal === 'neutral') score += 0.5;
    });
    return Math.round((score / 7) * 100);
  };

  const score = calculateScore();

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-2 font-[var(--font-orbitron)] text-[#00d4ff]">
          Altseason Signal Board
        </h1>
        <p className="text-gray-400 text-sm md:text-base font-[var(--font-space-mono)]">
          Real-time indicators tracking altseason probability
        </p>
        {lastUpdated && (
          <p className="text-gray-500 text-xs mt-2 font-[var(--font-space-mono)]">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </header>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff]"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6 text-center">
          <p className="text-red-400">Error: {error}</p>
          <button
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      {data && (
        <>
          {/* Gauge Section */}
          <section className="mb-10 flex flex-col items-center">
            <GaugeMeter score={score} />
            <div className="mt-4 text-center">
              <p className="text-lg font-[var(--font-space-mono)]">
                <span className={
                  score >= 70 ? 'text-[#00ff88]' : 
                  score >= 40 ? 'text-[#f5a623]' : 'text-[#ff4560]'
                }>
                  {score >= 70 ? 'Altseason Likely' : 
                   score >= 40 ? 'Neutral / Watch' : 'Bitcoin Season'}
                </span>
              </p>
            </div>
          </section>

          {/* Indicators Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.indicators.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} />
            ))}
          </section>

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-500 text-xs font-[var(--font-space-mono)]">
            <p>Data provided by CoinGecko, Alternative.me, and BlockchainCenter</p>
            <p className="mt-1">Not financial advice. DYOR.</p>
          </footer>
        </>
      )}
    </main>
  );
}
