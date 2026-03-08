# Altseason Signal Board - Bug Fixes

## Summary
Fixed three bugs in `app/api/data/route.js` as specified in the issue.

## Changes Made

### BUG FIX 1: BTC Dominance showing 0.00%
**Problem**: The `/global` endpoint was returning data but `market_cap_percentage.btc` wasn't being parsed correctly.

**Solution**: Calculate BTC dominance directly from chart data:
```javascript
const btcMcapNow = btcMcaps.length > 0 ? btcMcaps[btcMcaps.length - 1][1] : 0;
const totalMcapNow = globalData?.data?.total_market_cap?.usd || 0;
const btcDominance = totalMcapNow > 0 ? parseFloat(((btcMcapNow / totalMcapNow) * 100).toFixed(2)) : 0;
```

### BUG FIX 2: Altcoin Season Index logic is wrong
**Problem**: The old formula `110 - btcDom * 1.5` was inaccurate.

**Solution**: Use real 90-day growth comparison with API fallback:
```javascript
// Calculate from 90-day BTC and TOTAL2 growth
const btcGrowth90d = btcMcaps.length > 1
  ? ((btcMcaps[btcMcaps.length - 1][1] - btcMcaps[0][1]) / btcMcaps[0][1]) * 100
  : 0;
const altOutperformance = total2Growth90d - btcGrowth90d;
const derivedAltSeasonIndex = Math.max(0, Math.min(100, Math.round(50 + (altOutperformance * 1.5))));

// Try to fetch real BlockchainCenter index first
try {
  const r = await fetch('https://www.blockchaincenter.net/api/altcoin-season-index/?chart=1year', {...});
  if (r.ok) {
    const d = await r.json();
    altseasonIndex = parseInt(d?.now ?? derivedAltSeasonIndex);
  }
} catch (_) { /* use derived value */ }
```

### BUG FIX 3: Total Market Cap bullish logic is too naive
**Problem**: Comparing first vs last data point ignores volatility.

**Solution**: Use 14-day vs 30-day SMA crossover:
```javascript
function calculateSMA(arr, period) {
  if (!arr || arr.length < period) return arr?.at(-1) ?? 0;
  const slice = arr.slice(-period);
  return slice.reduce((sum, x) => sum + x, 0) / period;
}

const sma14 = calculateSMA(totalMcapHistory, 14);
const sma30 = calculateSMA(totalMcapHistory, 30);
const maDiff = sma30 > 0 ? ((sma14 - sma30) / sma30) * 100 : 0;
const marketCapSignal = maDiff > 2 ? 'bullish' : maDiff < -2 ? 'bearish' : 'neutral';
```

Same logic applied to TOTAL2 signal.

## Verification
- All brackets and braces are balanced
- No duplicate variable declarations
- All required functions present
- Backward compatible API response format maintained
