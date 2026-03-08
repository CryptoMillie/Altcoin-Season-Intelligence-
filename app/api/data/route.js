export async function GET() {
  try {
    // Fetch all data in parallel
    const [
      btcDominanceRes,
      ethBtcRes,
      globalRes,
      fearGreedRes,
      altseasonRes,
    ] = await Promise.allSettled([
      // BTC Dominance
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

    // Extract values
    const btcDominance = btcData?.market_data?.market_cap_dominance || 0;
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

    // Fallback altseason index calculation
    if (altseasonIndex === null) {
      altseasonIndex = btcDominance < 50 ? 80 : btcDominance < 60 ? 50 : 20;
    }

    // Calculate signals
    const domSignal =
      btcDominance > 60 ? 'bearish' : btcDominance >= 54 ? 'neutral' : 'bullish';
    const ethBtcSignal = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
    const marketCapSignal = totalMarketCap > 1000000000000 ? 'bullish' : 'neutral';
    const total2Signal = total2 > 500000000000 ? 'bullish' : 'neutral';
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