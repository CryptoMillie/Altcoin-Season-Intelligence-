# 📡 Altseason Signal Board

A real-time crypto dashboard tracking 7 key indicators to signal when altseason is approaching. Built with Next.js 14, Chart.js, and TailwindCSS.

![Dark trading terminal aesthetic with gauge meter and 7 signal cards]

---

## ✨ Features

- **Live Altseason Probability Score** — weighted gauge (0–100%)
- **7 Signal Cards** — each with current value, signal status, and 90-day chart
- **Auto-refresh** every 10 minutes
- **Signal scoring**: Bullish (+1) · Neutral (+0.5) · Bearish (+0)
- Dark trading terminal aesthetic with ambient glow effects

## 📊 Indicators Tracked

| # | Indicator | Source | Bullish Threshold |
|---|-----------|--------|------------------|
| 1 | BTC Dominance | CoinGecko | < 54% |
| 2 | ETH/BTC Ratio | CoinGecko | ≥ 0.03 |
| 3 | Total Market Cap | CoinGecko | Rising 90d trend |
| 4 | TOTAL2 (ex-BTC) | CoinGecko | 30d breakout |
| 5 | Stablecoin Supply | CoinGecko | > $200B |
| 6 | Fear & Greed Index | Alternative.me | 0–25 (Extreme Fear) |
| 7 | Altcoin Season Index | BlockchainCenter | ≥ 75 |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# 1. Clone or download the project
git clone https://github.com/yourusername/altseason-signal-board.git
cd altseason-signal-board

# 2. Install dependencies
npm install

# 3. Run dev server
npm run dev

# 4. Open http://localhost:3000
```

---

## ☁️ Deploy on Vercel

### Option A — Vercel CLI (fastest)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy from project root
vercel

# Follow prompts:
#  - Set up and deploy: Y
#  - Which scope: (your account)
#  - Link to existing project: N
#  - Project name: altseason-signal-board
#  - Directory: ./
#  - Override settings: N

# 3. Production deploy
vercel --prod
```

### Option B — GitHub + Vercel Dashboard

1. Push code to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Framework preset: **Next.js** (auto-detected)
5. No environment variables needed (uses free public APIs)
6. Click **Deploy**

### Option C — One-click (after pushing to GitHub)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 🔑 API Keys (Optional)

The dashboard works with **free public APIs** — no keys required.

If you hit CoinGecko rate limits (30 calls/min on free tier), you can add a Pro API key:

```bash
# Create .env.local
COINGECKO_API_KEY=your_key_here
```

Then update `app/api/data/route.js` to include the header:
```js
headers: {
  'x-cg-pro-api-key': process.env.COINGECKO_API_KEY,
  'Accept': 'application/json',
}
```

---

## 🏗️ Project Structure

```
altseason-signal-board/
├── app/
│   ├── api/
│   │   └── data/
│   │       └── route.js          # Server API — fetches all indicator data
│   ├── globals.css               # Tailwind + custom animations
│   ├── layout.js                 # Root layout + Google Fonts
│   └── page.js                   # Main dashboard (Client Component)
├── components/
│   ├── GaugeMeter.jsx            # SVG semi-circle probability gauge
│   ├── IndicatorCard.jsx         # Signal card with badge + chart
│   └── MiniChart.jsx             # Chart.js 90-day sparkline
├── next.config.mjs               # Cache headers config
├── tailwind.config.js            # Custom colors, fonts, animations
├── postcss.config.js
└── package.json
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `bg-primary` | `#07080d` | Page background |
| `bg-card` | `#0f1120` | Card backgrounds |
| `signal-bullish` | `#00ff88` | Green signals |
| `signal-neutral` | `#f5a623` | Amber signals |
| `signal-bearish` | `#ff4560` | Red signals |
| `accent-cyan` | `#00d4ff` | Headers, accents |
| Font Display | Orbitron | Headers, score |
| Font Mono | Space Mono | Values, labels |

---

## ⚙️ Customization

### Change refresh interval
In `app/page.js`:
```js
const REFRESH_INTERVAL = 10 * 60 * 1000; // change to 5 * 60 * 1000 for 5min
```

### Adjust signal thresholds
In `app/api/data/route.js`, find the signals section:
```js
const domSignal = btcDominance > 60 ? 'bearish' : btcDominance >= 54 ? 'neutral' : 'bullish';
const ethBtcSignal = ethBtcRatio >= 0.03 ? 'bullish' : 'neutral';
// ... etc
```

### Add more indicators
1. Fetch data in the API route
2. Add to the `indicators` array with `{ id, label, value, signal, history, threshold }`
3. Update the score calculation (adjust `/7` denominator)

---

## 📝 Notes

- **CoinGecko free tier**: ~10–30 API calls/min. The dashboard makes ~7 concurrent calls every 10 minutes — well within limits.
- **Altcoin Season Index**: If BlockchainCenter's API is unavailable, the app falls back to a BTC dominance-based estimate.
- **Stablecoin history**: Not available on free CoinGecko tier; signal is based on current supply level.
- **Server-side caching**: API responses are cached for 600s via Next.js `revalidate`, reducing API pressure on repeat loads.

---

## 📜 License

MIT — use freely, modify, build on top of it.

---

*Built for @CryptoMillie — not financial advice.*
