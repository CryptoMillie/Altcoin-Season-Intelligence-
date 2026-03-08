export async function GET() {
  try {
    // Fetch data from multiple sources
    const [
      btcDominanceRes,
      ethBtcRes,
      globalRes,
      fearGreedRes,
      altseasonRes
    ] = await Promise.all([
      // BTC Dominance
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin'),
      // ETH/BTC Ratio
      fetch('https://api.coingecko.com/api/v3/coins/ethereum'),
      // Global market data
      fetch('https://api.coingecko.com/api/v3/global'),
      // Fear & Greed Index
      fetch('https://api.alternative.me/fng/'),
      // Altcoin Season Index
      fetch('https://www.blockchaincenter.net/api/altcoin-season-index/')
    ]);

    const btcData = await btcDominanceRes.json();
    const ethData = await ethBtcRes.json();
    const globalData = await globalRes.json();
    const fearGreedData = await fearGreedRes.json();
    let altseasonData = null;
    try {
      altseasonData = await altseasonRes.json();
    } catch (e) {
      // Fallback if API is unavailable
      altseasonData = { value: 50 };
    }

    // Calculate indicators
    const btcDominance = btcData.market_data?.market_cap_dominance || 0;
    const ethBtcRatio = ethData.market_data?.current_price?.btc || 0;
    const totalMarketCap = globalData.data?.total_market_cap?.usd || 0;
    const total2 = totalMarketCap - (btcData.market_data?.market_cap?.usd || 0);
    const stablecoinSupply = globalData.data?.total_volume?.usd || 0; // Approximation
    const fearGreedValue = parseInt(fearGreedData.data?.[0]?.value) || 50;
    const altseasonIndex = altseasonData.value || 50;

    // Generate mock history data (in production, this would come from historical API calls)
    const generateHistory = (baseValue, variance = 0.1) => {
      const history = [];
      for (let i = 90; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString().split('T')[0],
          value: baseValue * (1 + (Math.random() - 0.5) * variance)
        });
      }
      return history;
    };

    // Determine signals
    const domSignal = btcDominance > 60 ? 'bearish' : btcDominance >= 54 ? 'neutral' : 'bullish';
    const ethBtcSignal = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
    const marketCapTrend = globalData.data?.market_cap_change_percentage_24h_usd || 0;
    const marketCapSignal = marketCapTrend > 5 ? 'bullish' : marketCapTrend > 0 ? 'neutral' : 'bearish';
    const total2Signal = total2 > 500000000000 ? 'bullish' : total2 > 300000000000 ? 'neutral' : 'bearish';
    const stablecoinSignal = stablecoinSupply > 200000000000 ? 'bullish' : 'neutral';
    const fearGreedSignal = fearGreedValue <= 25 ? 'bullish' : fearGreedValue <= 50 ? 'neutral' : 'bearish';
    const altseasonSignal = altseasonIndex >= 75 ? 'bullish' : altseasonIndex >= 50 ? 'neutral' : 'bearish';

    const indicators = [
      {
        id: 1,
        label: 'BTC Dominance',
        value: `${btcDominance.toFixed(1)}%`,
        signal: domSignal,
        history: generateHistory(btcDominance, 0.05),
        threshold: '< 54%'
      },
      {
        id: 2,
        label: 'ETH/BTC Ratio',
        value: ethBtcRatio.toFixed(4),
        signal: ethBtcSignal,
        history: generateHistory(ethBtcRatio, 0.1),
        threshold: '≥ 0.03'
      },
      {
        id: 3,
        label: 'Total Market Cap',
        value: `$${(totalMarketCap / 1e12).toFixed(2)}T`,
        signal: marketCapSignal,
        history: generateHistory(totalMarketCap / 1e12, 0.08),
        threshold: 'Rising 90d trend'
      },
      {
        id: 4,
        label: 'TOTAL2 (ex-BTC)',
        value: `$${(total2 / 1e12).toFixed(2)}T`,
        signal: total2Signal,
        history: generateHistory(total2 / 1e12, 0.1),
        threshold: '30d breakout'
      },
      {
        id: 5,
        label: 'Stablecoin Supply',
        value: `$${(stablecoinSupply / 1e9).toFixed(1)}B`,
        signal: stablecoinSignal,
        history: generateHistory(stablecoinSupply / 1e9, 0.03),
        threshold: '> $200B'
      },
      {
        id: 6,
        label: 'Fear & Greed Index',
        value: fearGreedValue,
        signal: fearGreedSignal,
        history: generateHistory(fearGreedValue, 0.2),
        threshold: '0-25 (Extreme Fear)'
      },
      {
        id: 7,
        label: 'Altcoin Season Index',
        value: altseasonIndex,
        signal: altseasonSignal,
        history: generateHistory(altseasonIndex, 0.15),
        threshold: '≥ 75'
      }
    ];

    return Response.json({ indicators }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: 'Failed to fetch market data', details: error.message },
      { status: 500 }
    );
  }
}
