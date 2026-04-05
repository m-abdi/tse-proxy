# TSE-Proxy

A lightweight HTTP proxy over the **Tehran Stock Exchange (TSE)** for fetching OHLC (Open/High/Low/Close) candlestick data and the full list of tradable instruments. Built on top of the [`tse-client`](https://www.npmjs.com/package/tse-client) npm package and served via Express.

> [!NOTE]
> This proxy must be deployed on a server located **inside Iran**. TSE data servers
> are not accessible from outside the country.

## Features

- 📈 Fetch OHLC candlestick data for any TSE instrument
- 📋 Get the full list of TSE-listed instruments
- 🕯️ Supports Daily, Weekly, and Monthly timeframes with automatic resampling
- 📅 Jalali (Solar Hijri) calendar support for correct weekly/monthly grouping
- 🔧 Adjusted prices support
- ⚡ Fast and stateless — just a thin proxy layer
- 🔌 Simple REST API powered by Express 5

## Requirements

- Node.js >= 18
- npm

## Installation

```bash
git clone https://github.com/m-abdi/tse-proxy.git
cd tse-proxy
npm install
```

## Usage

```bash
npm start
```

The server will start, print the TSE-PROXY banner, and listen on `http://localhost:3000`.

## API

### Get list of instruments

```
GET /instruments
```

Returns the full list of TSE-listed instruments.

**Example:**

```bash
curl http://localhost:3000/instruments
```

---

### Get OHLC prices

```
GET /prices
```

Returns OHLC candlestick data for a given instrument. Prices are adjusted by default.

**Query Parameters:**

| Name        | Type          | Required | Default | Description                                                              |
| ----------- | ------------- | -------- | ------- | ------------------------------------------------------------------------ |
| `symbol`    | string        | ✅       | —       | TSE instrument symbol (e.g. `فولاد`)                                     |
| `timeframe` | string        | ❌       | `D`     | Timeframe: `D` (daily), `W` (weekly), `M` (monthly)                      |
| `count`     | number        | ❌       | `1500`  | Maximum number of candles to return (most recent)                        |
| `from`      | string/number | ❌       | —       | Start date — ISO string (e.g. `2024-01-01`) or Unix timestamp in seconds |
| `to`        | string/number | ❌       | —       | End date — ISO string (e.g. `2024-06-30`) or Unix timestamp in seconds   |

**Example — daily candles:**

```bash
curl "http://localhost:3000/prices?symbol=فولاد"
```

**Example — weekly candles with date range:**

```bash
curl "http://localhost:3000/prices?symbol=فولاد&timeframe=W&from=2024-01-01&to=2024-06-30"
```

**Example — using Unix timestamps:**

```bash
curl "http://localhost:3000/prices?symbol=فولاد&timeframe=M&from=1704067200&to=1719705600"
```

**Response:**

```json
{
  "datetime": [1704153600, 1704240000, 1704326400],
  "open": [42100, 43200, 41800],
  "high": [43500, 44100, 42900],
  "low": [41800, 42800, 41500],
  "close": [43000, 43800, 42400],
  "volume": [18200000, 21500000, 16800000]
}
```

All `datetime` values are **Unix timestamps in seconds** (UTC). On empty or failed results, all arrays are returned empty.

## Timeframes

| Value | Description | Resampling                                         |
| ----- | ----------- | -------------------------------------------------- |
| `D`   | Daily       | Raw data from TSE                                  |
| `W`   | Weekly      | Resampled — week starts Saturday (Jalali calendar) |
| `M`   | Monthly     | Resampled — month boundary follows Jalali calendar |

Weekly and monthly candles are built from daily data:

- **open** = first day's open of the period
- **high** = max high across all days
- **low** = min low across all days
- **close** = last day's close of the period
- **volume** = sum of all daily volumes

## Development

Format code with Prettier:

```bash
npm run format
```

## License

MIT
