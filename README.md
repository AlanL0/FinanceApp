<p align="center">
  <img src="https://img.shields.io/badge/React_Native-Expo-000?style=for-the-badge&logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Finnhub_API-Real--Time_Data-0F6E56?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-D4A843?style=for-the-badge" />
</p>

<h1 align="center">FinanceApp</h1>
<h3 align="center">Learn investing. Practice risk-free. Build real confidence.</h3>

<p align="center">
  A mobile financial literacy app that combines structured education, a real-time paper trading simulator, and post-trade reflection tools — built with React Native and powered by live market data.
</p>

---

## About

FinanceApp teaches long-term wealth building through a **Learn → Practice → Reflect** cycle. Users work through educational modules covering stocks, ETFs, retirement accounts, and behavioral finance, then apply what they learn in a paper trading simulator using real market data — all without risking real money.

The app is educational only. It does not provide personalized financial advice, connect to real brokerage accounts, or recommend specific securities.

## Features

- **Paper Trading** — Buy and sell stocks with $100K in virtual cash using real-time prices from Finnhub
- **Learning Hub** — Structured modules with quizzes covering investing fundamentals
- **Portfolio Tracking** — Real-time P&L, asset allocation, and trade history
- **Watchlist** — Track stocks with live WebSocket price updates
- **Gamification** — XP, levels, streaks, and achievement badges
- **Reflection Engine** — Post-trade insights that surface behavioral patterns like loss aversion and overtrading

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo) + TypeScript |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Market Data | Finnhub REST API + WebSocket |
| State | Zustand |
| Testing | Jest + React Native Testing Library |

## Getting Started

### Prerequisites

- Node.js v20+
- Expo Go on your phone ([App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Finnhub API key (free at [finnhub.io](https://finnhub.io))

### Setup

```bash
git clone https://github.com/AlanL0/FinanceApp.git
cd FinanceApp
npm install
cp .env.example .env
# Add your FINNHUB_API_KEY to .env
npx expo start
```

Scan the QR code with Expo Go to run on your device.

### Tests

```bash
npm test
```

## Project Structure

```
src/
├── core/
│   ├── api/          # Finnhub service
│   ├── auth/         # Authentication
│   ├── theme/        # Design tokens, reusable components
│   └── websocket/    # Real-time price streaming
├── features/
│   ├── stocks/       # Search, stock detail, watchlist
│   ├── trading/      # Order entry, execution
│   ├── portfolio/    # Holdings, P&L
│   ├── learn/        # Modules, quizzes, progress
│   └── profile/      # Settings, achievements
├── navigation/       # Tab + stack navigators
└── stores/           # Zustand state
```

## Contributing

Contributions are welcome. Fork the repo, create a branch, write tests, and open a PR.

```bash
git checkout -b feature/your-feature
# Write tests first, then implement
git commit -m "feat: your feature description"
```

## License

MIT — see [LICENSE](LICENSE) for details.

## Disclaimer

This application is for educational purposes only. It is not financial advice. All trading is simulated with virtual money. Always consult a qualified financial professional before making investment decisions.

---

<p align="center">
  <a href="https://github.com/AlanL0/FinanceApp/issues">Report Bug</a> •
  <a href="https://github.com/AlanL0/FinanceApp/issues">Request Feature</a>
</p>
