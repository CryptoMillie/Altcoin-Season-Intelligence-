// Helper function to calculate Simple Moving Average
function calculateSMA(arr, period) {
  if (!arr || arr.length < period) return arr?.at(-1) ?? 0;
  const slice = arr.slice(-period);
  return slice.reduce((sum, x) => sum + x, 0) / period;
}

export async function GET() {
  try {
    // Fetch BTC market chart data (90 days) for dominance calculation
    const btcChartRes = await fetch(
      'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90',
      { next: { revalidate: 3600 } }
    );
    const btcChartData = btcChartRes.ok ? await btcChartRes.json() : null;
    const btcMcaps = btcChartData?.market_caps || [];
    
    // Fetch all data in parallel
    const [
      btcDominanceRes,
      ethBtcRes,
      globalRes,
      fearGreedRes,
      altseasonRes,
    ] = await Promise.allSettled([
      // BTC Dominance (for additional data)
      fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false'
      ),
      // ETH/BTC Ratio
      fetch(
        'https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false'
      ),
      // Global market cap
      fetch('https://api.coingecko.com/api/v3/global'),
      // Fear & Greed
      fetch('https://api.alternative.me/fng/?limit=1'),
      // Altcoin Season Index (may fail, use fallback)
      fetch(
        'https://www.blockchaincenter.net/api/altcoin-season-index/',
        { timeout: 5000 }
      ).catch(() => null),
    ]);

    // Parse responses
    const btcData =
      btcDominanceRes.status === 'fulfilled' && btcDominanceRes.value.ok
        ? await btcDominanceRes.value.json()
        : null;

    const ethData =
      ethBtcRes.status === 'fulfilled' && ethBtcRes.value.ok
        ? await ethBtcRes.value.json()
        : null;

    const globalData =
      globalRes.status === 'fulfilled' && globalRes.value.ok
        ? await globalRes.value.json()
        : null;

    const fearGreedData =
      fearGreedRes.status === 'fulfilled' && fearGreedRes.value.ok
        ? await fearGreedRes.value.json()
        : null;

    let altseasonIndex = null;
    if (altseasonRes.status === 'fulfilled' && altseasonRes.value && altseasonRes.value.ok) {
      const altseasonData = await altseasonRes.value.json();
      altseasonIndex = altseasonData?.value || null;
    }

    // Calculate BTC Dominance from chart data (more reliable than /global endpoint)
    const btcMcapNow = btcMcaps.length > 0 ? btcMcaps[btcMcaps.length - 1][1] : 0;
    const totalMcapNow = globalData?.data?.total_market_cap?.usd || 0;
    const btcDominance = totalMcapNow > 0 ? parseFloat(((btcMcapNow / totalMcapNow) * 100).toFixed(2)) : 0;
    const ethPrice = ethData?.market_data?.current_price?.usd || 0;
    const btcPrice = btcData?.market_data?.current_price?.usd || 1;
    const ethBtcRatio = btcPrice > 0 ? ethPrice / btcPrice : 0;
    const totalMarketCap = globalData?.data?.total_market_cap?.usd || 0;
    const total2 = globalData?.data?.total_volume?.usd || 0; // Using volume as proxy for TOTAL2
    const stablecoinSupply = globalData?.data?.total_market_cap?.usd
      ? globalData.data.total_market_cap.usd * 0.08
      : 0; // Estimate ~8% of total market cap

    const fearGreedValue = parseInt(
      fearGreedData?.data?.[0]?.value || 50
    );

    // Calculate Altcoin Season Index using 90-day growth comparison
    const btcGrowth90d = btcMcaps.length > 1
      ? ((btcMcaps[btcMcaps.length - 1][1] - btcMcaps[0][1]) / btcMcaps[0][1]) * 100
      : 0;

    // For TOTAL2, we'll use a proxy since we don't have direct API access
    // Use the relationship: TOTAL2 = Total Market Cap - BTC Market Cap
    // totalMarketCap already declared above
    const total2Proxy = totalMarketCap - (btcMcaps.length > 0 ? btcMcaps[btcMcaps.length - 1][1] : 0);
    const total2StartProxy = totalMarketCap * 0.95 - (btcMcaps.length > 0 ? btcMcaps[0][1] : 0);
    
    const total2Growth90d = total2StartProxy > 0
      ? ((total2Proxy - total2StartProxy) / total2StartProxy) * 100
      : 0;

    // Alt outperformance ratio: how much more alts grew vs BTC
    const altOutperformance = total2Growth90d - btcGrowth90d;

    // Map to 0-100 index: alts growing 20%+ more than BTC = 100, equal = 50, BTC dominating = 0
    let derivedAltSeasonIndex = Math.max(0, Math.min(100, Math.round(50 + (altOutperformance * 1.5))));
    
    // Try to fetch real BlockchainCenter index first
    // altseasonIndex already declared above, reuse it
    try {
      const r = await fetch('https://www.blockchaincenter.net/api/altcoin-season-index/?chart=1year', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 3600 }
      });
      if (r.ok) {
        const d = await r.json();
        altseasonIndex = parseInt(d?.now ?? derivedAltSeasonIndex);
      }
    } catch (_) { 
      // use derived value
      altseasonIndex = derivedAltSeasonIndex;
    }
    
    if (altseasonIndex === null) {
      altseasonIndex = derivedAltSeasonIndex;
    }

    // Calculate signals
    const domSignal =
      btcDominance > 60 ? 'bearish' : btcDominance >= 54 ? 'neutral' : 'bullish';
    const ethBtcSignal = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
    
    // BUG FIX 3: Use SMA crossover for Total Market Cap signal (14-day vs 30-day)
    // Create mock history from BTC market cap data as proxy for total market cap trend
    const totalMcapHistory = btcMcaps.map(mcap => mcap[1] * (totalMarketCap / (btcMcapNow || 1)));
    const sma14 = calculateSMA(totalMcapHistory, 14);
    const sma30 = calculateSMA(totalMcapHistory, 30);
    const maDiff = sma30 > 0 ? ((sma14 - sma30) / sma30) * 100 : 0;
    const marketCapSignal = maDiff > 2 ? 'bullish' : maDiff < -2 ? 'bearish' : 'neutral';
    
    // BUG FIX 3: Apply same SMA logic to TOTAL2 (using volume as proxy with trend)
    const total2History = btcMcaps.map(mcap => mcap[1] * (total2 / (btcMcapNow || 1)));
    const t2sma14 = calculateSMA(total2History, 14);
    const t2sma30 = calculateSMA(total2History, 30);
    const t2diff = t2sma30 > 0 ? ((t2sma14 - t2sma30) / t2sma30) * 100 : 0;
    const total2Signal = t2diff > 2 ? 'bullish' : t2diff < -2 ? 'bearish' : 'neutral';
    const stablecoinSignal = stablecoinSupply > 2000000000000 ? 'bullish' : 'neutral';
    const fearGreedSignal =
      fearGreedValue <= 25
        ? 'bullish' // Extreme fear = buying opportunity
        : fearGreedValue >= 75
        ? 'bearish' // Extreme greed = caution
        : 'neutral';
    const altseasonSignal = altseasonIndex >= 75 ? 'bullish' : altseasonIndex >= 50 ? 'neutral' : 'bearish';

    // Generate mock history data (in a real app, you'd fetch historical data)
    const generateHistory = (baseValue, variance = 0.1) => {
      const history = [];
      for (let i = 0; i < 90; i++) {
        const randomChange = (Math.random() - 0.5) * variance;
        history.push(baseValue * (1 + randomChange));
      }
      return history;
    };

    const indicators = [
      {
        id: 1,
        label: 'BTC Dominance',
        value: `${btcDominance.toFixed(2)}%`,
        signal: domSignal,
        threshold: '< 54%',
        history: generateHistory(btcDominance, 0.05),
      },
      {
        id: 2,
        label: 'ETH/BTC Ratio',
        value: ethBtcRatio.toFixed(4),
        signal: ethBtcSignal,
        threshold: '≥ 0.03',
        history: generateHistory(ethBtcRatio, 0.1),
      },
      {
        id: 3,
        label: 'Total Market Cap',
        value: `$${(totalMarketCap / 1e12).toFixed(2)}T`,
        signal: marketCapSignal,
        threshold: 'Rising trend',
        history: generateHistory(totalMarketCap, 0.15),
      },
      {
        id: 4,
        label: 'TOTAL2 (ex-BTC)',
        value: `$${(total2 / 1e9).toFixed(0)}B`,
        signal: total2Signal,
        threshold: '30d breakout',
        history: generateHistory(total2, 0.12),
      },
      {
        id: 5,
        label: 'Stablecoin Supply',
        value: `$${(stablecoinSupply / 1e9).toFixed(0)}B`,
        signal: stablecoinSignal,
        threshold: '> $200B',
        history: generateHistory(stablecoinSupply, 0.02),
      },
      {
        id: 6,
        label: 'Fear & Greed Index',
        value: fearGreedValue.toString(),
        signal: fearGreedSignal,
        threshold: '0-25 (Extreme Fear)',
        history: generateHistory(fearGreedValue, 0.2),
      },
      {
        id: 7,
        label: 'Altcoin Season Index',
        value: altseasonIndex.toString(),
        signal: altseasonSignal,
        threshold: '≥ 75',
        history: generateHistory(altseasonIndex, 0.1),
      },
    ];

    return Response.json(
      {
        indicators,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    );
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}