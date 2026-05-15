import React, { useState, useEffect, useCallback } from "react";

const API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

const MAG7 = [
  { symbol: "AAPL", name: "Apple", abbr: "AAPL" },
  { symbol: "MSFT", name: "Microsoft", abbr: "MSFT" },
  { symbol: "GOOGL", name: "Alphabet", abbr: "GOOGL" },
  { symbol: "AMZN", name: "Amazon", abbr: "AMZN" },
  { symbol: "META", name: "Meta", abbr: "META" },
  { symbol: "NVDA", name: "Nvidia", abbr: "NVDA" },
  { symbol: "TSLA", name: "Tesla", abbr: "TSLA" },
];

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in ms

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

  const loadAll = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        MAG7.map(async (s) => {
          const q = await fetchQuote(s.symbol);
          return [s.symbol, q];
        })
      );
      setStocks(Object.fromEntries(results));
      setLastUpdated(new Date());
      setNextRefresh(REFRESH_INTERVAL);
    } catch (e) {
      setError("Failed to fetch data. Check your API key or connection.");
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

  const totalMktSentiment = Object.values(stocks).filter((s) => s.pctChange > 0).length;

  return (
    <div style={styles.root}>
      <div style={styles.bg} />
      <div style={styles.grain} />

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.logo}>MAG<span style={styles.logoAccent}>7</span></div>
            <div style={styles.logoSub}>MARKET TRACKER</div>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.sentimentBadge}>
              <span style={{ color: totalMktSentiment >= 4 ? "#00ff87" : totalMktSentiment >= 2 ? "#ffd166" : "#ff4d6d" }}>
                {totalMktSentiment}/7 ↑
              </span>
            </div>
          </div>
        </div>

        <div style={styles.headerMeta}>
          <span style={styles.metaItem}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`
              : "Loading..."}
          </span>
          <span style={styles.metaDot}>·</span>
          <span style={styles.metaItem}>Next: <span style={styles.countdown}>{countdown}</span></span>
          <button
            style={{ ...styles.refreshBtn, opacity: refreshing ? 0.5 : 1 }}
            onClick={() => loadAll(true)}
            disabled={refreshing}
          >
            {refreshing ? "↻" : "↻ Refresh"}
          </button>
        </div>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <main style={styles.main}>
        {loading && !Object.keys(stocks).length ? (
          <div style={styles.loadingWrap}>
            {MAG7.map((s) => (
              <div key={s.symbol} style={styles.skeletonCard} />
            ))}
          </div>
        ) : (
          <div style={styles.grid}>
            {MAG7.map((s, i) => {
              const q = stocks[s.symbol];
              const up = q?.pctChange >= 0;
              const color = up ? "#00ff87" : "#ff4d6d";
              const bgColor = up ? "rgba(0,255,135,0.04)" : "rgba(255,77,109,0.04)";

              return (
                <div key={s.symbol} style={{ ...styles.card, background: bgColor, animationDelay: `${i * 60}ms` }}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.symbol}>{s.abbr}</div>
                      <div style={styles.companyName}>{s.name}</div>
                    </div>
                    <div style={{ ...styles.pctBadge, color, borderColor: color }}>
                      {q ? `${up ? "+" : ""}${fmt(q.pctChange)}%` : "—"}
                    </div>
                  </div>

                  <div style={styles.price}>
                    {q ? `$${fmt(q.price)}` : <span style={styles.pricePlaceholder}>———</span>}
                  </div>

                  <div style={styles.changeRow}>
                    <span style={{ color }}>
                      {q ? `${up ? "+" : ""}$${fmt(Math.abs(q.change))}` : "—"}
                    </span>
                    <span style={styles.vsYest}>vs yesterday</span>
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.statsRow}>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>OPEN</span>
                      <span style={styles.statVal}>{q ? `$${fmt(q.open)}` : "—"}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>HIGH</span>
                      <span style={{ ...styles.statVal, color: "#00ff87" }}>{q ? `$${fmt(q.high)}` : "—"}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>LOW</span>
                      <span style={{ ...styles.statVal, color: "#ff4d6d" }}>{q ? `$${fmt(q.low)}` : "—"}</span>
                    </div>
                    <div style={styles.stat}>
                      <span style={styles.statLabel}>PREV</span>
                      <span style={styles.statVal}>{q ? `$${fmt(q.prevClose)}` : "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        Data via Finnhub · Refreshes every hour · {new Date().getFullYear()}
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .card-animate {
          animation: fadeUp 0.4s ease forwards;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e8f0",
    fontFamily: "'Space Mono', monospace",
    position: "relative",
    overflow: "hidden",
  },
  bg: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(ellipse at 20% 0%, rgba(0,255,135,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(255,77,109,0.06) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  grain: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
    opacity: 0.4,
  },
  header: {
    position: "relative",
    zIndex: 10,
    padding: "20px 20px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(10,10,15,0.8)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
  },
  headerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 28,
    letterSpacing: "-1px",
    color: "#fff",
    lineHeight: 1,
  },
  logoAccent: {
    color: "#00ff87",
  },
  logoSub: {
    fontSize: 9,
    letterSpacing: "4px",
    color: "rgba(255,255,255,0.3)",
    marginTop: 3,
    fontWeight: 400,
  },
  headerRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  sentimentBadge: {
    fontFamily: "'Space Mono', monospace",
    fontSize: 13,
    fontWeight: 700,
    padding: "4px 10px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
  },
  headerMeta: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  metaItem: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "0.5px",
  },
  metaDot: {
    color: "rgba(255,255,255,0.15)",
    fontSize: 10,
  },
  countdown: {
    color: "#00ff87",
    fontWeight: 700,
  },
  refreshBtn: {
    marginLeft: "auto",
    background: "rgba(0,255,135,0.1)",
    border: "1px solid rgba(0,255,135,0.3)",
    color: "#00ff87",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 10,
    cursor: "pointer",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "0.5px",
    transition: "all 0.2s",
  },
  error: {
    position: "relative",
    zIndex: 10,
    margin: "16px 20px 0",
    padding: "12px 16px",
    background: "rgba(255,77,109,0.1)",
    border: "1px solid rgba(255,77,109,0.3)",
    borderRadius: 8,
    color: "#ff4d6d",
    fontSize: 12,
  },
  main: {
    position: "relative",
    zIndex: 10,
    padding: "16px 16px 24px",
  },
  loadingWrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  skeletonCard: {
    height: 160,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: "16px 14px",
    border: "1px solid rgba(255,255,255,0.07)",
    animation: "fadeUp 0.4s ease forwards",
    backdropFilter: "blur(4px)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  symbol: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 800,
    fontSize: 15,
    color: "#fff",
    letterSpacing: "-0.3px",
  },
  companyName: {
    fontSize: 9,
    color: "rgba(255,255,255,0.35)",
    marginTop: 2,
    letterSpacing: "0.5px",
  },
  pctBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 20,
    border: "1px solid",
    background: "rgba(0,0,0,0.2)",
  },
  price: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 22,
    color: "#fff",
    letterSpacing: "-0.5px",
    lineHeight: 1,
    marginBottom: 4,
  },
  pricePlaceholder: {
    color: "rgba(255,255,255,0.15)",
  },
  changeRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 11,
    marginBottom: 12,
  },
  vsYest: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    letterSpacing: "0.3px",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.06)",
    marginBottom: 10,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: 4,
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  statLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.5px",
  },
  statVal: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700,
  },
  footer: {
    position: "relative",
    zIndex: 10,
    textAlign: "center",
    padding: "16px 20px 32px",
    fontSize: 9,
    color: "rgba(255,255,255,0.15)",
    letterSpacing: "1px",
  },
};
