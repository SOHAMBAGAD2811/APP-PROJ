# ✈️ AiRa — Aviation Intelligence & DGCA Airfare Price Index (Node/TS Prototype)

> **Full-Stack Recreation in TypeScript & Node.js (`tsx`) for Instant Vercel Deployment**  
> Recreated 1:1 from the original Python prototype into a unified, serverless-ready full-stack architecture.

---

## 🎯 Architecture Overview

This project is a standalone, full-stack recreation of AiRa with:
- **Frontend**: React 18 + Vite + Lucide Icons + Recharts + React-Leaflet + Tailwind/Vanilla CSS design system.
- **Backend**: TypeScript on Node.js using `tsx` (TypeScript Execute) for local development and native `@vercel/node` Serverless Functions for Vercel cloud deployment.
- **Data Engine**:
  - Official DGCA FY 2024–25 Passenger Traffic Share Weighted Lowe Index calculation engine.
  - Multi-source scraper and carrier unbundling layers (EaseMyTrip, Google Flights, IndiGo, Air India).
  - High-concordance backtesting engine cross-validated against official DGCA/ICRA monthly benchmark datasets.
  - Live EaseMyTrip Calendar JSON API client + embedded realistic time-series data store requiring zero external database setup for prototyping.
  - RAG-powered AI Aviation Economics Assistant with streaming Server-Sent Events (SSE).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd /home/soham/aira-prototype
npm install
```

### 2. Start Full-Stack Dev Environment
```bash
npm run dev
```
This concurrently boots:
- 🌐 **Vite Frontend**: [http://localhost:5173](http://localhost:5173) (with automated `/api` proxying)
- 📡 **TypeScript API Server**: [http://localhost:8000](http://localhost:8000) (powered by `tsx watch`)

### 3. Build for Production
```bash
npm run build
```

---

## ☁️ Deploying to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) for 1-click deployment.

### Method 1: Using Vercel CLI
```bash
# 1. Login to Vercel (if not already logged in)
npx vercel login

# 2. Deploy directly from repository root
npx vercel
```

### Method 2: Git Integration
1. Push this directory to your GitHub / GitLab repository.
2. In the [Vercel Dashboard](https://vercel.com/new), click **Import Project**.
3. Vercel automatically detects **Vite** as the frontend framework.
4. The API endpoints in `/api/index.ts` and `/server` will deploy automatically as Vercel Serverless Functions.

---

## 📁 Repository Structure

```
/home/soham/aira-prototype/
├── api/
│   └── index.ts                 # Vercel Serverless Function entry point
├── server/
│   ├── app.ts                   # Main Express application with all REST endpoints
│   ├── index.ts                 # Local dev server entry point (executed via tsx)
│   ├── models.ts                # DGCA 6-corridor constants, weights & TypeScript interfaces
│   ├── calculations.ts          # Pure Lowe Price Index & statistical imputation logic
│   ├── analytics.ts             # Pearson-r, RMSE, Theil's U & DGCA benchmark metrics
│   ├── store.ts                 # Resilient in-memory & file-backed time-series data store
│   ├── auth.ts                  # JWT token authentication & admin protection
│   ├── compliance.ts            # RFC 9309 robots.txt compliance checker & source registry
│   ├── simulate.ts              # Macroeconomic ATF fuel & capacity simulation engine
│   ├── chat.ts                  # AI Aviation Assistant with RAG & SSE streaming
│   └── scrapers/
│       ├── easemytrip.ts        # EaseMyTrip live calendar API client & flight scraper
│       ├── cleartrip.ts         # Google Flights / Cleartrip scraper backend
│       ├── indigo.ts            # IndiGo direct carrier unbundling engine
│       └── airindia.ts          # Air India direct carrier unbundling engine
├── src/                         # Recreated React 18 frontend components
│   ├── App.jsx                  # Main application UI with all 6 tabs
│   ├── components/              # APIxTab, SimulatorCard, BacktestCard, Heatmap, etc.
│   ├── hooks/                   # useFlights custom hook
│   └── utils/                   # Airline codes & metadata
├── data/                        # Seeded flight datasets & DGCA historical CSV
│   ├── dgca_historical_monthly.csv
│   └── *fares.json / *calendar.json
├── public/                      # Static assets, logos, and GeoJSON boundaries
├── package.json                 # Unified npm scripts & dependencies
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration with /api proxy to port 8000
└── vercel.json                  # Vercel routing rules
```

---

## 📡 API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/airports` | `GET` | Merged airport code to city dictionary |
| `/api/apix/summary` | `GET` | National DGCA Lowe Index, coverage & corridor breakdown |
| `/api/apix` | `GET` | Time-bucketed APIx values per corridor |
| `/api/apix/decomposition` | `GET` | Corridor-level contribution to headline index movement |
| `/api/apix/leadtime` | `GET` | Lead-time booking elasticity curve (T+1 to T+45) |
| `/api/backtest/dgca` | `GET` | Cross-validation against official DGCA/ICRA monthly benchmark |
| `/api/simulate` | `POST` | ATF fuel price & demand/capacity elasticity simulator |
| `/api/chat/stream` | `POST` | SSE streaming AI chat with empirical flight RAG context |
| `/api/{source}/fares/cached` | `GET` | Cached flight fare quotes (`emt`, `ct`, `indigo`, `airindia`, `both`) |
| `/api/{source}/scrape` | `POST` | Trigger background flight scrape job |
| `/api/{source}/calendar` | `POST` | Trigger background fare calendar job |
| `/api/admin/trigger-sweep` | `POST` | Trigger DGCA fixed-basket autonomous sweep |
| `/api/compliance/registry` | `GET` | Data source compliance registry & robots.txt permissions |
| `/api/export/csv` | `GET` | Download corridor APIx data as CSV |
| `/api/export/bulletin` | `GET` | Download MoSPI-style statistical text bulletin |
| `/metrics` | `GET` | Prometheus-compatible metrics endpoint |

---

## ⚖️ Official DGCA Corridor Weights (FY 2024–25)

The Lowe Price Index formula implemented in `server/calculations.ts`:

$$I_t = 100 \times \frac{\sum_{i \in \text{observed}} w_i \times \frac{P_{it}}{P_{i0}}}{\sum_{i \in \text{observed}} w_i}$$

| Corridor | Route | Weight ($w_i$) |
| :--- | :--- | :--- |
| **DEL–BOM** | Delhi – Mumbai | **29.58%** |
| **DEL–BLR** | Delhi – Bengaluru | **20.21%** |
| **BOM–BLR** | Mumbai – Bengaluru | **17.76%** |
| **DEL–CCU** | Delhi – Kolkata | **11.96%** |
| **MAA–DEL** | Chennai – Delhi | **10.59%** |
| **BLR–HYD** | Bengaluru – Hyderabad | **9.90%** |
