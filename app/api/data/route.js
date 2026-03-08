// Server-side API route for fetching crypto data
// Cache for 600 seconds (10 minutes) to avoid rate limits

export const revalidate = 600;

const CG = 'https://api.coingecko.com/api/v3';
const FNG = 'https://api.alternative.me/fng/?limit=91&format=json';
const ALTSEASON_API = 'https://www.blockchaincenter.net/api/altcoin-season-index/?chart=1year';

function fmtCurrency(n) {
  if (n >= 1e12) return `$${(n/1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n/1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n/1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

async function fetchAllData() {
  async function cg(path) {
    const r = await fetch(`${CG}${path}`, { 
      headers: { Accept: 'application/json' },
      next: { revalidate: 600 }
    });
    if (!r.ok) throw new Error(`CG ${path} -> ${r.status}`);
    return r.json();
  }

  const [globalRes, ethBtcRes, btcChartRes, totalChartRes, stableRes, fngRes, altseasonRes] =
    await Promise.allSettled([
      cg('/global'),
      cg('/simple/price?ids=ethereum&vs_currencies=btc'),
      cg('/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily'),
      cg('/global/market_cap_chart?days=90&vs_currency=usd'),
      cg('/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=5&page=1'),
      fetch(FNG, { next: { revalidate: 600 } }).then(r => r.json()),
      fetch(ALTSEASON_API, { next: { revalidate: 600 } }).then(r => r.json()).catch(() => null),
    ]);

  const global = globalRes.status === 'fulfilled' ? globalRes.value?.data : null;
  const btcDom = parseFloat((global?.market_cap_percentage?.btc || 0).toFixed(2));
  const totalMcap = global?.total_market_cap?.usd || 0;
  const btcMcap = totalMcap * (btcDom / 100);
  const total2Mcap = totalMcap - btcMcap;

  const ethBtcRatio = ethBtcRes.status === 'fulfilled'
    ? parseFloat((ethBtcRes.value?.ethereum?.btc || 0).toFixed(5)) : 0;

  const btcMcaps = btcChartRes.status === 'fulfilled' ? btcChartRes.value?.market_caps || [] : [];
  const totalMcaps = totalChartRes.status === 'fulfilled' ? totalChartRes.value?.market_cap || [] : [];

  const stables = stableRes.status === 'fulfilled' ? stableRes.value : [];

  // Build histories
  const len = Math.min(btcMcaps.length, totalMcaps.length);
  const domHistory = [], total2History = [];
  
  for (let i = 0; i < len; i++) {
    const d = totalMcaps[i][1] > 0 ? (btcMcaps[i][1] / totalMcaps[i][1]) * 100 : 0;
    domHistory.push({ v: parseFloat(d.toFixed(2)) });
    total2History.push({ v: totalMcaps[i][1] - btcMcaps[i][1] });
  }

  const totalMcapHistory = totalMcaps.map(([,v]) => ({ v }));
  
  // Fetch ETH/BTC history
  let ethBtcHistory = [];
  try {
    const ethChartData = await cg('/coins/ethereum/market_chart?vs_currency=btc&days=90&interval=daily');
    const ethPrices = ethChartData?.prices || [];
    ethBtcHistory = ethPrices.map(([,v]) => ({ v }));
  } catch (e) {
    ethBtcHistory = [];
  }

  const stableMcap = stables.reduce((s,c) => s + (c.market_cap||0), 0);

  // Fear & Greed
  let fngVal = 50, fngLabel = 'Neutral', fngHistory = [];
  if (fngRes.status === 'fulfilled') {
    const arr = fngRes.value?.data || [];
    fngVal = parseInt(arr[0]?.value || 50);
    fngLabel = arr[0]?.value_classification || 'Neutral';
    fngHistory = [...arr].reverse().map(d => ({ v: parseInt(d.value) }));
  }

  // Altseason Index - use API if available, otherwise calculate from BTC dominance
  let altSeasonIndex = Math.max(0, Math.min(100, Math.round(110 - btcDom * 1.5)));
  if (altseasonRes && altseasonRes.status === 'fulfilled') {
    const data = altseasonRes.value;
    if (data && typeof data === 'object') {
      altSeasonIndex = data.value || data.index || data.altseason_index || altSeasonIndex;
    }
  }

  // Signals
  const domSig = btcDom > 60 ? 'bearish' : btcDom >= 54 ? 'neutral' : 'bullish';
  const ethBtcSig = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
  const mcapSig = totalMcapHistory.length > 10
    ? (totalMcapHistory.at(-1).v > totalMcapHistory[0].v ? 'bullish' : 'bearish') : 'neutral';
  const t2Sig = total2History.length > 30
    ? (total2History.at(-1).v > total2History[total2History.length - 30].v ? 'bullish' : 'bearish') : 'neutral';
  const stableSig = stableMcap > 200e9 ? 'bullish' : stableMcap > 100e9 ? 'neutral' : 'bearish';
  const fngSig = fngVal <= 25 ? 'bullish' : fngVal > 75 ? 'bearish' : 'neutral';
  const altSig = altSeasonIndex >= 75 ? 'bullish' : altSeasonIndex >= 40 ? 'neutral' : 'bearish';

  const allSigs = [domSig, ethBtcSig, mcapSig, t2Sig, stableSig, fngSig, altSig];
  const score = allSigs.reduce((a,s) => a + (s==='bullish'?1:s==='neutral'?.5:0), 0);

  return {
    score,
    probability: parseFloat(((score/7)*100).toFixed(1)),
    bullish: allSigs.filter(s=>s==='bullish').length,
    neutral: allSigs.filter(s=>s==='neutral').length,
    bearish: allSigs.filter(s=>s==='bearish').length,
    lastUpdated: new Date().toISOString(),
    indicators: [
      { id:'btc_dom', label:'BTC Dominance', icon:'₿', desc:"Bitcoin's share of total crypto market cap",
        displayValue:`${btcDom.toFixed(1)}%`, signal:domSig, threshold:'Bullish <54% · Neutral 54-60% · Bearish >60%',
        history:domHistory.slice(-90), unit:'%' },
      { id:'eth_btc', label:'ETH / BTC Ratio', icon:'Ξ', desc:'Ethereum price denominated in Bitcoin',
        displayValue:ethBtcRatio.toFixed(5), signal:ethBtcSig, threshold:'Bullish ≥0.03 · Neutral <0.03',
        history:ethBtcHistory.slice(-90), unit:'BTC' },
      { id:'total_mcap', label:'Total Market Cap', icon:'◈', desc:'Total cryptocurrency market capitalisation',
        displayValue:fmtCurrency(totalMcap), signal:mcapSig, threshold:'Bullish: Rising 90d · Bearish: Falling',
        history:totalMcapHistory.slice(-90), unit:'USD' },
      { id:'total2', label:'TOTAL2 (ex-BTC)', icon:'⬡', desc:'Altcoin market cap excluding Bitcoin',
        displayValue:fmtCurrency(total2Mcap), signal:t2Sig, threshold:'Bullish: 30d breakout · Bearish: Declining',
        history:total2History.slice(-90), unit:'USD' },
      { id:'stable', label:'Stablecoin Supply', icon:'$', desc:'Total stablecoin market cap — dry powder',
        displayValue:fmtCurrency(stableMcap), signal:stableSig, threshold:'Bullish >$200B · Neutral $100-200B · Bearish <$100B',
        history:[], unit:'USD' },
      { id:'fng', label:'Fear & Greed Index', icon:'⚡', desc:'Market sentiment oscillator',
        displayValue:`${fngVal} · ${fngLabel}`, signal:fngSig, threshold:'Bullish 0-25 · Neutral 25-75 · Bearish 75+',
        history:fngHistory.slice(-90), unit:'' },
      { id:'alt_season', label:'Altseason Index', icon:'🌊', desc:'% of top 50 alts outperforming BTC (est.)',
        displayValue:`${altSeasonIndex} / 100`, signal:altSig, threshold:'Bullish ≥75 · Neutral 40-75 · Bearish <40',
        history:[], unit:'' },
    ],
  };
}

export async function GET() {
  try {
    const data = await fetchAllData();
    return Response.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
