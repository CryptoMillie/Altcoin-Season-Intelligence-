export async function GET() {
  try {
    // Fetch data from multiple sources
    const [
      ethBtcRes,
      fearGreedRes,
      altseasonRes
    ] = await Promise.all([
      // ETH/BTC Ratio
      fetch('https://api.coingecko.com/api/v3/coins/ethereum'),
      // Fear & Greed Index
      fetch('https://api.alternative.me/fng/'),
      // Altcoin Season Index
      fetch('https://www.blockchaincenter.net/api/altcoin-season-index/')
    ]);

    const ethData = await ethBtcRes.json();
    const fearGreedData = await fearGreedRes.json();
    let altseasonData = null;
    try {
      altseasonData = await altseasonRes.json();
    } catch (e) {
      // Fallback if API is unavailable
      altseasonData = { value: 50 };
    }

    // Fetch BTC chart and total market cap chart for dominance calculation
    const [btcChartRes, totalChartRes] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily')
        .then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/global/market_cap_chart?days=90&vs_currency=usd')
        .then(r => r.json()),
    ]);

    const btcMcaps = btcChartRes.status === 'fulfilled' ? btcChartRes.value?.market_caps ?? [] : [];
    const totalMcaps = totalChartRes.status === 'fulfilled' ? totalChartRes.value?.market_cap ?? [] : [];

    // Derive current values from last data point
    const btcMcapNow = btcMcaps.at(-1)?.[1] ?? 0;
    const totalMcapNow = totalMcaps.at(-1)?.[1] ?? 0;
    const btcDom = totalMcapNow > 0
      ? parseFloat(((btcMcapNow / totalMcapNow) * 100).toFixed(2))
      : 0;
    const totalMcap = totalMcapNow;
    const total2Mcap = totalMcapNow - btcMcapNow;

    // Build 90-day dominance history from chart data
    const len = Math.min(btcMcaps.length, totalMcaps.length);
    const domHistory = [];
    const total2History = [];
    for (let i = 0; i < len; i++) {
      const dom = totalMcaps[i][1] > 0 ? (btcMcaps[i][1] / totalMcaps[i][1]) * 100 : 0;
      domHistory.push({ date: new Date(btcMcaps[i][0]).toISOString().split('T')[0], value: parseFloat(dom.toFixed(2)) });
      total2History.push({ date: new Date(btcMcaps[i][0]).toISOString().split('T')[0], value: totalMcaps[i][1] - btcMcaps[i][1] });
    }

    // Replace stablecoin fetch with DeFiLlama
    let stableMcap = 0;
    let stableHistory = [];
    try {
      const stableRes = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true', {
        next: { revalidate: 600 }
      });
      const stableJson = await stableRes.json();
      const coins = stableJson?.peggedAssets ?? [];
      // Sum circulating USD across all stablecoins
      stableMcap = coins.reduce((sum, coin) => {
        return sum + (coin?.circulating?.peggedUSD ?? 0);
      }, 0);
      // For history, fetch the aggregate chart
      const stableChartRes = await fetch('https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=1', {
        next: { revalidate: 600 }
      });
      const stableChart = await stableChartRes.json();
      if (Array.isArray(stableChart)) {
        stableHistory = stableChart.slice(-90).map(d => ({
          date: new Date(d.date * 1000).toISOString().split('T')[0],
          value: (d?.totalCirculatingUSD?.peggedUSD ?? 0) / 1e9
        }));
      }
    } catch (e) {
      stableMcap = 313e9; // known approximate fallback
    }

    const ethBtcRatio = ethData.market_data?.current_price?.btc || 0;
    const fearGreedValue = parseInt(fearGreedData.data?.[0]?.value) || 50;

    // Proper altseason index using 90d BTC vs TOTAL2 performance
    const btcPerf90d = btcMcaps.length >= 2
      ? ((btcMcaps.at(-1)[1] - btcMcaps[0][1]) / btcMcaps[0][1]) * 100
      : 0;
    const t2Perf90d = total2History.length >= 2
      ? ((total2History.at(-1).value - total2History[0].value) / total2History[0].value) * 100
      : 0;
    // Alt outperformance vs BTC over 90 days
    // Map: alts beating BTC by 20%+ = ~100, parity = ~50, BTC beating alts by 20%+ = ~0
    const altOutperf = t2Perf90d - btcPerf90d;
    const altSeasonIndex = Math.max(0, Math.min(100, Math.round(50 + (altOutperf * 1.2))));

    // Generate mock history data for ETH/BTC and Fear & Greed
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
    const domSignal = btcDom > 60 ? 'bearish' : btcDom >= 54 ? 'neutral' : 'bullish';
    const ethBtcSignal = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
    const marketCapTrend = totalMcapNow > 0 ? ((totalMcaps.at(-1)[1] - totalMcaps[0][1]) / totalMcaps[0][1]) * 100 : 0;
    const marketCapSignal = marketCapTrend > 5 ? 'bullish' : marketCapTrend > 0 ? 'neutral' : 'bearish';
    const total2Signal = total2Mcap > 500000000000 ? 'bullish' : total2Mcap > 300000000000 ? 'neutral' : 'bearish';
    const stablecoinSignal = stableMcap > 200000000000 ? 'bullish' : 'neutral';
    const fearGreedSignal = fearGreedValue <= 25 ? 'bullish' : fearGreedValue <= 50 ? 'neutral' : 'bearish';
    const altseasonSignal = altSeasonIndex >= 75 ? 'bullish' : altSeasonIndex >= 50 ? 'neutral' : 'bearish';

    // Generate altseason history
    const altseasonHistory = [];
    for (let i = 0; i < Math.min(domHistory.length, total2History.length); i++) {
      const btcPerf = i > 0 ? ((btcMcaps[i][1] - btcMcaps[0][1]) / btcMcaps[0][1]) * 100 : 0;
      const t2Perf = i > 0 ? ((total2History[i].value - total2History[0].value) / total2History[0].value) * 100 : 0;
      const outperf = t2Perf - btcPerf;
      const idx = Math.max(0, Math.min(100, Math.round(50 + (outperf * 1.2))));
      altseasonHistory.push({
        date: domHistory[i].date,
        value: idx
      });
    }

    const indicators = [
      {
        id: 1,
        label: 'BTC Dominance',
        value: `${btcDom.toFixed(1)}%`,
        signal: domSignal,
        history: domHistory.length > 0 ? domHistory : generateHistory(btcDom, 0.05),
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
        value: `$${(totalMcapNow / 1e12).toFixed(2)}T`,
        signal: marketCapSignal,
        history: totalMcaps.length > 0 ? totalMcaps.slice(-90).map(d => ({ date: new Date(d[0]).toISOString().split('T')[0], value: d[1] / 1e12 })) : generateHistory(totalMcapNow / 1e12, 0.08),
        threshold: 'Rising 90d trend'
      },
      {
        id: 4,
        label: 'TOTAL2 (ex-BTC)',
        value: `$${(total2Mcap / 1e12).toFixed(2)}T`,
        signal: total2Signal,
        history: total2History.length > 0 ? total2History.slice(-90).map(d => ({ date: d.date, value: d.value / 1e12 })) : generateHistory(total2Mcap / 1e12, 0.1),
        threshold: '30d breakout'
      },
      {
        id: 5,
        label: 'Stablecoin Supply',
        value: `$${(stableMcap / 1e9).toFixed(1)}B`,
        signal: stablecoinSignal,
        history: stableHistory.length > 0 ? stableHistory : generateHistory(stableMcap / 1e9, 0.03),
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
        value: altSeasonIndex,
        signal: altseasonSignal,
        history: altseasonHistory.length > 0 ? altseasonHistory : generateHistory(altSeasonIndex, 0.15),
        threshold: '≥ 75'
      }
    ];

    // Calculate counts for gauge
    let bullish = 0, neutral = 0, bearish = 0;
    indicators.forEach(ind => {
      if (ind.signal === 'bullish') bullish++;
      else if (ind.signal === 'neutral') neutral++;
      else bearish++;
    });

    // Log for verification
    console.log('btcDom:', btcDom);
    console.log('stableMcap:', stableMcap);
    console.log('altSeasonIndex:', altSeasonIndex);

    return Response.json({ 
      indicators,
      score: altSeasonIndex,
      probability: altSeasonIndex,
      bullish,
      neutral,
      bearish
    }, {
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
