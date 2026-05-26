export default async function handler(req, res) {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "No symbol" });
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }
    );
    const data = await r.json();
    const meta = data.chart.result[0].meta;
    res.json({
      price: meta.regularMarketPrice,
      prev:  meta.previousClose || meta.chartPreviousClose,
      high:  meta.regularMarketDayHigh,
      low:   meta.regularMarketDayLow,
      vol:   meta.regularMarketVolume,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
