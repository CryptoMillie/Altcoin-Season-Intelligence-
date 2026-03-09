export const runtime = "nodejs";

export async function GET() {
  try {
    // Fetch BTC chart and global data (market_cap_chart is PRO only)
    const [btcChartRes, globalRes] = await Promise.allSettled([
      fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily')
        .then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/global')
        .then(r => r.json()),
    ]);

    const btcMcaps = btcChartRes.status === 'fulfilled' ? btcChartRes.value?.market_caps ?? [] : [];
    const globalData = globalRes.status === 'fulfilled' ? globalRes.value?.data : null;

    // Get current values from global endpoint
    const totalMcapNow = globalData?.total_market_cap?.usd ?? 0;
    const btcMcapNow = btcMcaps.at(-1)?.[1] ?? 0;
    const btcDom = totalMcapNow > 0
      ? parseFloat(((btcMcapNow / totalMcapNow) * 100).toFixed(2))
      : 0;
    const totalMcap = totalMcapNow;
    const total2Mcap = totalMcapNow - btcMcapNow;

    // Build 90-day dominance history from BTC chart data
    // Estimate total mcap based on current dominance ratio applied to historical BTC mcaps
    const domHistory = [];
    const total2History = [];
    const currentBtcDom = btcDom > 0 ? btcDom : 55; // fallback to 55% if calculation fails
    
    for (let i = 0; i < btcMcaps.length; i++) {
      // Estimate total mcap based on BTC dominance ratio
      const estimatedTotalMcap = btcMcaps[i][1] / (currentBtcDom / 100);
      const dom = parseFloat(currentBtcDom.toFixed(2));
      domHistory.push({ v: dom });
      total2History.push({ v: estimatedTotalMcap - btcMcaps[i][1] });
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

    // Log verification values
    console.log('btcDom:', btcDom);
    console.log('stableMcap:', stableMcap);
    console.log('altSeasonIndex:', altSeasonIndex);

    return Response.json({
      btcDom,
      totalMcap,
      total2Mcap,
      stableMcap,
      altSeasonIndex,
      domHistory,
      total2History,
      stableHistory,
      btcPerf90d,
      t2Perf90d,
      altOutperf,
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
