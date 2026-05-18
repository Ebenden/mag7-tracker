import React, { useState, useEffect, useCallback } from "react";

const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

const STOCKS = [
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "ASML", name: "ASML" },
  { symbol: "CRWD", name: "CrowdStrike" },
  { symbol: "PLTR", name: "Palantir" },
  { symbol: "TSM", name: "TSMC" },
  { symbol: "ZS", name: "Zscaler" },
];

const REFRESH_INTERVAL = 60 * 60 * 1000;

async function fetchQuote(symbol) {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
  );
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  return {
    price: data.c,
    change: data.d,
    pctChange: data.dp,
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
  };
}

function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(targetMs);
  useEffect(() => {
    setRemaining(targetMs);
    const interval = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function App() {
  const [stocks, setStocks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [nextRefresh, setNextRefresh] = useState(REFRESH_INTERVAL);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        STOCKS.map(async (s) => {
          const q = await fetchQuote(s.symbol);
          return [s.symbol, q];
        })
      );
      setStocks(Object.fromEntries(results));
      setLastUpdated(new Date());
      setNextRefresh(REFRESH_INTERVAL);
    } catch (e) {
      setError("Failed to fetch. Check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadAll]);

  const countdown = useCountdown(nextRefresh);
  const upCount = Object.values(stocks).filter((s) => s?.pctChange >= 0).length;

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <span style={s.logo}>MAG<span style={s.accent}>7</span></span>
          <span style={s.subtitle}>TRACKER</span>
        </div>
        <div style={s.headerRight}>
          <span style={s.sentiment}>
            <span style={{ color: upCount >= 7 ? "#00e676" : upCount >= 4 ? "#ffca28" : "#ff5252" }}>
              {upCount}/{STOCKS.length} ↑
            </span>
          </span>
          <button
            style={{ ...s.refreshBtn, opacity: refreshing ? 0.5 : 1 }}
            onClick={() => loadAll(true)}
            disabled={refreshing}
          >
            ↻
          </button>
        </div>
      </div>

      {/* Meta bar */}
      <div style={s.metaBar}>
        <span style={s.metaText}>
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
            : "Loading..."}
        </span>
        <span style={s.metaText}>Next: <span style={{ color: "#00e676" }}>{countdown}</span></span>
      </div>

      {error && <div style={s.error}>{error}</div>}

      {/* Stock list */}
      <div style={s.list}>
        {STOCKS.map((stock) => {
          const q = stocks[stock.symbol];
          const up = q?.pctChange >= 0;
          const color = up ? "#00e676" : "#ff5252";
          const isOpen = expanded === stock.symbol;

          return (
            <div key={stock.symbol}>
              {/* Main row */}
              <div
                style={s.row}
                onClick={() => setExpanded(isOpen ? null : stock.symbol)}
              >
                {/* Left: symbol + name */}
                <div style={s.rowLeft}>
                  <span style={s.symbol}>{stock.symbol}</span>
                  <span style={s.name}>{stock.name}</span>
                </div>

                {/* Center: price */}
                <div style={s.rowCenter}>
                  <span style={s.price}>
                    {q ? `$${fmt(q.price)}` : "—"}
                  </span>
                </div>

                {/* Right: change + pct */}
                <div style={s.rowRight}>
                  <span style={{ ...s.pct, color }}>
                    {q ? `${up ? "+" : ""}${fmt(q.pctChange)}%` : "—"}
                  </span>
                  <span style={{ ...s.change, color }}>
                    {q ? `${up ? "+" : ""}${fmt(q.change)}` : "—"}
                  </span>
                </div>

                <span style={s.chevron}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {/* Expanded detail */}
              {isOpen && q && (
                <div style={s.detail}>
                  <div style={s.detailGrid}>
                    <div style={s.detailItem}>
                      <span style={s.detailLabel}>OPEN</span>
                      <span style={s.detailVal}>${fmt(q.open)}</span>
                    </div>
                    <div style={s.detailItem}>
                      <span style={s.detailLabel}>HIGH</span>
                      <span style={{ ...s.detailVal, color: "#00e676" }}>${fmt(q.high)}</span>
                    </div>
                    <div style={s.detailItem}>
                      <span style={s.detailLabel}>LOW</span>
                      <span style={{ ...s.detailVal, color: "#ff5252" }}>${fmt(q.low)}</span>
                    </div>
                    <div style={s.detailItem}>
                      <span style={s.detailLabel}>PREV</span>
                      <span style={s.detailVal}>${fmt(q.prevClose)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={s.footer}>Data via Finnhub · Auto-refreshes hourly</div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0d; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#0d0d0d",
    color: "#f0f0f0",
    fontFamily: "'Space Mono', 'Courier New', monospace",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px 8px",
    borderBottom: "1px solid #1e1e1e",
    position: "sticky",
    top: 0,
    background: "#0d0d0d",
    zIndex: 10,
  },
  headerLeft: {
    display: "flex",
    alignItems: "baseline",
    gap: 6,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "-1px",
    color: "#fff",
  },
  accent: {
    color: "#00e676",
  },
  subtitle: {
    fontSize: 9,
    letterSpacing: "3px",
    color: "#555",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  sentiment: {
    fontSize: 13,
    fontWeight: 700,
    padding: "3px 10px",
    background: "#1a1a1a",
    borderRadius: 20,
    border: "1px solid #2a2a2a",
  },
  refreshBtn: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: "#00e676",
    width: 32,
    height: 32,
    borderRadius: "50%",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  metaBar: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 16px",
    borderBottom: "1px solid #1a1a1a",
  },
  metaText: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "0.3px",
  },
  error: {
    margin: "8px 16px",
    padding: "8px 12px",
    background: "rgba(255,82,82,0.1)",
    border: "1px solid rgba(255,82,82,0.3)",
    borderRadius: 6,
    color: "#ff5252",
    fontSize: 11,
  },
  list: {
    padding: "0",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #1a1a1a",
    cursor: "pointer",
    gap: 8,
    background: "#0d0d0d",
    transition: "background 0.15s",
  },
  rowLeft: {
    flex: "0 0 90px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  symbol: {
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "0.3px",
  },
  name: {
    fontSize: 11,
    color: "#555",
    letterSpacing: "0.2px",
  },
  rowCenter: {
    flex: 1,
    textAlign: "right",
  },
  price: {
    fontSize: 17,
    fontWeight: 700,
    color: "#e0e0e0",
    letterSpacing: "-0.3px",
  },
  rowRight: {
    flex: "0 0 80px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  pct: {
    fontSize: 16,
    fontWeight: 700,
  },
  change: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 8,
    color: "#333",
    flex: "0 0 10px",
  },
  detail: {
    background: "#111",
    borderBottom: "1px solid #1a1a1a",
    padding: "10px 16px 12px",
    animation: "fadeIn 0.15s ease",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 8,
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: "#444",
    letterSpacing: "0.5px",
  },
  detailVal: {
    fontSize: 13,
    color: "#aaa",
    fontWeight: 700,
  },
  footer: {
    textAlign: "center",
    padding: "20px 16px",
    fontSize: 9,
    color: "#2a2a2a",
    letterSpacing: "1px",
  },
};
