'use strict';

// Main API route for Altseason Signal Board
// Fetches all indicator data from CoinGecko and DeFiLlama APIs

export async function GET() {
  try {
    // Fetch these two — you likely already have them
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
      domHistory.push({ v: parseFloat(dom.toFixed(2)) });
      total2History.push({ v: totalMcaps[i][1] - btcMcaps[i][1] });
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
          v: (d?.totalCirculatingUSD?.peggedUSD ?? 0)
        }));
      }
    } catch (e) {
      stableMcap = 313e9; // known approximate fallback
    }

    // Proper altseason index using 90d BTC vs TOTAL2 performance
    const btcPerf90d = btcMcaps.length >= 2
      ? ((btcMcaps.at(-1)[1] - btcMcaps[0][1]) / btcMcaps[0][1]) * 100
      : 0;

    const t2Perf90d = total2History.length >= 2
      ? ((total2History.at(-1).v - total2History[0].v) / total2History[0].v) * 100
      : 0;

    // Alt outperformance vs BTC over 90 days
    // Map: alts beating BTC by 20%+ = ~100, parity = ~50, BTC beating alts by 20%+ = ~0
    const altOutperf = t2Perf90d - btcPerf90d;
    const altSeasonIndex = Math.max(0, Math.min(100, Math.round(50 + (altOutperf * 1.2))));

    // Return all data
    return Response.json({
      btcDominance: btcDom,
      stablecoinSupply: stableMcap,
      altSeasonIndex: altSeasonIndex,
      btcMcap: btcMcapNow,
      totalMcap: totalMcap,
      total2Mcap: total2Mcap,
      btcHistory: domHistory,
      stableHistory: stableHistory,
      btcPerf90d,
      t2Perf90d,
      altOutperf,
      totalHistory: total2History,
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export const runtime = 'nodejs18';
export const maxDuration = 30;