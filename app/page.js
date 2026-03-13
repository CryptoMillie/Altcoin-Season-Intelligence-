'use client';

import { useState, useEffect } from 'react';
import GaugeMeter from './components/GaugeMeter';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add cache-busting query param to ensure fresh data
        const res = await fetch(`/api/data?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        const data = await res.json();
        setData(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling every 30 seconds for live data updates
    const interval = setInterval(fetchData, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f1120'
      }}>
        <div style={{ color: '#00ff88', fontFamily: 'Orbitron, sans-serif' }}>
          Loading Altseason Signals...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#0f1120'
      }}>
        <div style={{ color: '#ff4560', fontFamily: 'Space Mono, monospace' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => {
    if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return `$${val.toFixed(2)}`;
  };

  const getStableSignal = (mcap) => {
    if (mcap > 200e9) return { label: 'BULLISH', color: '#00ff88' };
    if (mcap > 150e9) return { label: 'NEUTRAL', color: '#f5a623' };
    return { label: 'BEARISH', color: '#ff4560' };
  };

  const stableSignal = data?.stableMcap ? getStableSignal(data.stableMcap) : { label: 'UNKNOWN', color: '#5a6478' };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0f1120',
      padding: '40px 20px'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ 
          fontFamily: 'Orbitron, sans-serif', 
          fontSize: 32, 
          fontWeight: 900,
          textAlign: 'center',
          marginBottom: 40,
          background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ALTSEASON SIGNAL BOARD
        </h1>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24
        }}>
          {/* BTC Dominance Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1f35 0%, #0f1120 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2a3050'
          }}>
            <h3 style={{ 
              fontFamily: 'Orbitron, sans-serif', 
              fontSize: 14, 
              color: '#5a6478',
              margin: '0 0 16px 0',
              letterSpacing: '0.1em'
            }}>
              BTC DOMINANCE
            </h3>
            <div style={{ 
              fontFamily: 'Orbitron, sans-serif', 
              fontSize: 48, 
              fontWeight: 700,
              color: '#00ff88'
            }}>
              {data?.btcDom?.toFixed(1) ?? '0.0'}%
            </div>
            <div style={{ 
              fontFamily: 'Space Mono, monospace',
              fontSize: 12,
              color: '#5a6478',
              marginTop: 8
            }}>
              Total MCAP: {formatCurrency(data?.totalMcap ?? 0)}
            </div>
          </div>

          {/* Stablecoin Supply Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1f35 0%, #0f1120 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2a3050'
          }}>
            <h3 style={{ 
              fontFamily: 'Orbitron, sans-serif', 
              fontSize: 14, 
              color: '#5a6478',
              margin: '0 0 16px 0',
              letterSpacing: '0.1em'
            }}>
              STABLECOIN SUPPLY
            </h3>
            <div style={{ 
              fontFamily: 'Orbitron, sans-serif', 
              fontSize: 48, 
              fontWeight: 700,
              color: stableSignal.color
            }}>
              {formatCurrency(data?.stableMcap ?? 0)}
            </div>
            <div style={{ 
              fontFamily: 'Space Mono, monospace',
              fontSize: 12,
              color: stableSignal.color,
              marginTop: 8,
              textTransform: 'uppercase'
            }}>
              {stableSignal.label}
            </div>
          </div>

          {/* Altseason Gauge Card */}
          <div style={{
            background: 'linear-gradient(135deg, #1a1f35 0%, #0f1120 100%)',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #2a3050',
            gridColumn: 'span 1'
          }}>
            <h3 style={{ 
              fontFamily: 'Orbitron, sans-serif', 
              fontSize: 14, 
              color: '#5a6478',
              margin: '0 0 16px 0',
              letterSpacing: '0.1em',
              textAlign: 'center'
            }}>
              ALTCOIN SEASON INDEX
            </h3>
            <GaugeMeter 
              probability={data?.altSeasonIndex ?? 0}
              score={(data?.altSeasonIndex ?? 0) / 14.28}
              bullish={data?.altSeasonIndex >= 65 ? 1 : 0}
              neutral={data?.altSeasonIndex >= 40 && data?.altSeasonIndex < 65 ? 1 : 0}
              bearish={data?.altSeasonIndex < 40 ? 1 : 0}
            />
          </div>
        </div>

        {/* Performance Metrics */}
        <div style={{
          marginTop: 32,
          background: 'linear-gradient(135deg, #1a1f35 0%, #0f1120 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #2a3050'
        }}>
          <h3 style={{ 
            fontFamily: 'Orbitron, sans-serif', 
            fontSize: 14, 
            color: '#5a6478',
            margin: '0 0 16px 0',
            letterSpacing: '0.1em'
          }}>
            90-DAY PERFORMANCE METRICS
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16
          }}>
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#5a6478' }}>
                BTC Performance (90d)
              </div>
              <div style={{ 
                fontFamily: 'Orbitron, sans-serif', 
                fontSize: 24, 
                color: (data?.btcPerf90d ?? 0) >= 0 ? '#00ff88' : '#ff4560'
              }}>
                {data?.btcPerf90d?.toFixed(2) ?? '0.00'}%
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#5a6478' }}>
                TOTAL2 Performance (90d)
              </div>
              <div style={{ 
                fontFamily: 'Orbitron, sans-serif', 
                fontSize: 24, 
                color: (data?.t2Perf90d ?? 0) >= 0 ? '#00ff88' : '#ff4560'
              }}>
                {data?.t2Perf90d?.toFixed(2) ?? '0.00'}%
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#5a6478' }}>
                Alt Outperformance
              </div>
              <div style={{ 
                fontFamily: 'Orbitron, sans-serif', 
                fontSize: 24, 
                color: (data?.altOutperf ?? 0) >= 0 ? '#00ff88' : '#ff4560'
              }}>
                {data?.altOutperf?.toFixed(2) ?? '0.00'}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
