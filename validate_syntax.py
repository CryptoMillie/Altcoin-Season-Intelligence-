
import sys, pytest, collections, collections.abc, urllib3.exceptions, _pytest.pytester, numpy;
collections.Mapping = collections.abc.Mapping;
collections.MutableMapping = collections.abc.MutableMapping;
collections.MutableSet = collections.abc.MutableSet;
collections.Sequence = collections.abc.Sequence;
collections.Callable = collections.abc.Callable;
collections.Iterable = collections.abc.Iterable;
collections.Iterator = collections.abc.Iterator;
urllib3.exceptions.SNIMissingWarning = urllib3.exceptions.DependencyWarning;
pytest.RemovedInPytest4Warning = DeprecationWarning;
_pytest.pytester.Testdir = _pytest.pytester.Pytester;
numpy.PINF = numpy.inf;
numpy.unicode_ = numpy.str_;
numpy.bytes_ = numpy.bytes_;
numpy.float_ = numpy.float64;
numpy.string_ = numpy.bytes_;
numpy.NaN = numpy.nan;


import subprocess
import json
import re

# Read the route.js file
with open('app/api/data/route.js', 'r') as f:
    route_content = f.read()

# Verify the key fixes are present
print("=== Verification Report ===\n")

# 1. Check BTC Dominance calculation from chart data
btc_chart_check = 'api.coingecko.com/api/v3/coins/bitcoin/market_chart' in route_content
total_chart_check = 'api.coingecko.com/api/v3/global/market_cap_chart' in route_content
btc_dom_check = 'const btcDom =' in route_content and 'btcMcapNow / totalMcapNow' in route_content
print(f"1. BTC Dominance from chart data: {btc_chart_check and total_chart_check and btc_dom_check}")
print(f"   - Uses BTC market_chart: {btc_chart_check}")
print(f"   - Uses total market_cap_chart: {total_chart_check}")
print(f"   - Derives btcDom correctly: {btc_dom_check}")

# 2. Check DeFiLlama stablecoin API
defillama_check = 'stablecoins.llama.fi/stablecoins' in route_content
stable_mcap_calc = 'coin?.circulating?.peggedUSD' in route_content
fallback_check = 'stableMcap = 313e9' in route_content
print(f"\n2. Stablecoin from DeFiLlama: {defillama_check and stable_mcap_calc}")
print(f"   - Uses DeFiLlama API: {defillama_check}")
print(f"   - Calculates from circulating.peggedUSD: {stable_mcap_calc}")
print(f"   - Has 313e9 fallback: {fallback_check}")

# 3. Check Altcoin Season Index calculation
btc_perf_check = 'btcPerf90d' in route_content
t2_perf_check = 't2Perf90d' in route_content
alt_outperf_check = 'altOutperf = t2Perf90d - btcPerf90d' in route_content
alt_index_calc = 'Math.max(0, Math.min(100, Math.round(50 + (altOutperf * 1.2))))' in route_content
print(f"\n3. Altcoin Season Index logic: {btc_perf_check and t2_perf_check and alt_outperf_check and alt_index_calc}")
print(f"   - btcPerf90d calculation: {btc_perf_check}")
print(f"   - t2Perf90d calculation: {t2_perf_check}")
print(f"   - altOutperf calculation: {alt_outperf_check}")
print(f"   - altSeasonIndex calculation: {alt_index_calc}")

# 4. Check console.log statements for verification
btc_log = "console.log('btcDom:', btcDom)" in route_content
stable_log = "console.log('stableMcap:', stableMcap)" in route_content
alt_log = "console.log('altSeasonIndex:', altSeasonIndex)" in route_content
print(f"\n4. Console.log verification statements: {btc_log and stable_log and alt_log}")
print(f"   - btcDom log: {btc_log}")
print(f"   - stableMcap log: {stable_log}")
print(f"   - altSeasonIndex log: {alt_log}")

# 5. Check GaugeMeter.jsx
with open('components/GaugeMeter.jsx', 'r') as f:
    gauge_content = f.read()

gauge_svg = 'viewBox="0 0 220 130"' in gauge_content
semicircle_check = 'M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}' in gauge_content
needle_check = 'needleAngleDeg = -180 + (p / 100) * 180' in gauge_content
gradient_check = 'linearGradient id="gaugeGrad"' in gauge_content
phase_check = "p >= 65 ? 'ALTSEASON' : p >= 40 ? 'ROTATION' : 'BTC SEASON'" in gauge_content
print(f"\n5. GaugeMeter SVG gauge: {gauge_svg and semicircle_check and needle_check and gradient_check and phase_check}")
print(f"   - SVG viewBox: {gauge_svg}")
print(f"   - Semicircle arc path: {semicircle_check}")
print(f"   - Needle angle calculation: {needle_check}")
print(f"   - SVG gradient: {gradient_check}")
print(f"   - Phase logic: {phase_check}")

# Summary
print("\n" + "="*50)
all_checks = [
    btc_chart_check and total_chart_check and btc_dom_check,
    defillama_check and stable_mcap_calc,
    btc_perf_check and t2_perf_check and alt_outperf_check and alt_index_calc,
    btc_log and stable_log and alt_log,
    gauge_svg and semicircle_check and needle_check and gradient_check and phase_check
]
print(f"ALL VERIFICATIONS PASSED: {all(all_checks)}")
