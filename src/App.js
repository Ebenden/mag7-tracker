import { useState, useEffect, useCallback } from "react";

const LISTS = {
  b12: [
    {t:"KO",   n:"Coca-Cola",         pe:"25.5x",roe:"43%", margin:"28%",fcf:"$11.4B",moat:"Brand Power",      div:"2.6% · 63yr",brk:"YES · ~$25B", note:"Buffett held since 1988. 63 consecutive years of dividend raises. Near fair value at 25.5x P/E."},
    {t:"AXP",  n:"American Express",  pe:"24.0x",roe:"35%", margin:"19%",fcf:"$9.5B", moat:"Brand + Loyalty",  div:"1.3% · 12yr",brk:"YES · ~$40B", note:"Largest BRK financial holding. Affluent cardholders stay loyal in downturns."},
    {t:"MSFT", n:"Microsoft",         pe:"24.9x",roe:"34%", margin:"39%",fcf:"$72.9B",moat:"Azure + Switching",div:"0.9% · 23yr",brk:"NO",          note:"24% below GF intrinsic value $552. Best value in large-cap tech right now."},
    {t:"AAPL", n:"Apple",             pe:"37.4x",roe:"122%",margin:"27%",fcf:"$129B", moat:"Ecosystem",        div:"0.3% · 12yr",brk:"YES · ~$74B", note:"WATCH: P/E 49% above 10-yr avg. Above intrinsic ~$263. Buy on pullback to $240-260."},
    {t:"GOOGL",n:"Alphabet",          pe:"29.6x",roe:"39%", margin:"38%",fcf:"$64.4B",moat:"Data + Scale",     div:"0.2% · 2yr", brk:"YES · ~$4.3B",note:"BRK added $4.3B stake Q3 2025. Google Cloud +63% Q1 2026."},
    {t:"MCO",  n:"Moody's",           pe:"31.1x",roe:"68%", margin:"32%",fcf:"$2.5B", moat:"Oligopoly",        div:"0.9% · 26yr",brk:"YES · ~$12.6B",note:"BRK cost ~$248M now worth ~$12.6B — a 50x return."},
    {t:"DVA",  n:"DaVita",            pe:"19.5x",roe:"27%", margin:"11%",fcf:"$1.8B", moat:"Scale + Barriers", div:"None",       brk:"YES · ~38M sh",note:"BRK bought at ~$37, now ~$165. Shares down 40% via buybacks in 10 years."},
    {t:"V",    n:"Visa",              pe:"28.8x",roe:"60%", margin:"51%",fcf:"$21.6B",moat:"Network Effects",  div:"0.7% · 15yr",brk:"NO",          note:"51% net profit margins. 200+ country network. FCF growing +15% YoY."},
    {t:"COST", n:"Costco",            pe:"55.0x",roe:"32%", margin:"3%", fcf:"$6.0B", moat:"Membership+Scale", div:"1.0% · 20yr",brk:"NO",          note:"93% membership renewal rate. $6B+ annual membership fees = pure profit."},
    {t:"MA",   n:"Mastercard",        pe:"29.0x",roe:"210%",margin:"46%",fcf:"$16.4B",moat:"Network Effects",  div:"0.7% · 13yr",brk:"NO",          note:"23% below GF intrinsic value $643 — best margin of safety in list."},
    {t:"CVX",  n:"Chevron",           pe:"14.5x",roe:"15%", margin:"12%",fcf:"$12.0B",moat:"Cost+Integration", div:"4.6% · 36yr",brk:"YES · ~$14B", note:"BRK holds ~120M shares. Dividend Aristocrat 36 years. 4.6% yield."},
    {t:"JNJ",  n:"Johnson & Johnson", pe:"26.1x",roe:"26%", margin:"22%",fcf:"$19.7B",moat:"Brand+IP+Reg",     div:"2.4% · 62yr",brk:"NO",          note:"62 consecutive years of dividend raises. $19.7B annual free cash flow."},
  ],
  mag7: [
    {t:"AAPL", n:"Apple",             pe:"37.4x",roe:"122%",margin:"27%",fcf:"$129B", moat:"Ecosystem",        div:"0.3%",brk:"YES · ~$74B", note:"World's largest FCF. WATCH: overvalued vs intrinsic ~$263. Buy below $260."},
    {t:"MSFT", n:"Microsoft",         pe:"24.9x",roe:"34%", margin:"39%",fcf:"$72.9B",moat:"Azure+Switching",  div:"0.9%",brk:"NO",          note:"Best value in Mag 7. 24% below GF intrinsic value. EPS +30% YoY."},
    {t:"GOOGL",n:"Alphabet",          pe:"29.6x",roe:"39%", margin:"38%",fcf:"$64.4B",moat:"Data+Scale",       div:"0.2%",brk:"YES · ~$4.3B",note:"BRK added $4.3B Q3 2025. Cloud +63% Q1 2026."},
    {t:"AMZN", n:"Amazon",            pe:"34.0x",roe:"24%", margin:"10%",fcf:"$50B",  moat:"Logistics+AWS",    div:"None",brk:"NO",          note:"AWS dominant. Advertising revenue growing 20%+. Logistics moat near-impossible to replicate."},
    {t:"NVDA", n:"NVIDIA",            pe:"28.0x",roe:"123%",margin:"55%",fcf:"$44B",  moat:"CUDA Ecosystem",   div:"0.03%",brk:"NO",         note:"AI supercycle. 55% margins. CUDA keeps developers captive. Watch cyclical risk."},
    {t:"META", n:"Meta Platforms",    pe:"22.0x",roe:"38%", margin:"38%",fcf:"$52B",  moat:"Network Effects",  div:"0.3%",brk:"NO",          note:"Cheapest Mag 7 at 22x P/E. 3B+ daily users. Llama AI expanding moat."},
    {t:"TSLA", n:"Tesla",             pe:"95.0x",roe:"13%", margin:"7%", fcf:"$3B",   moat:"Brand+Supercharger",div:"None",brk:"NO",         note:"Highest P/E at 95x. Weakest FCF. Optimus + FSD optionality priced in."},
  ]
};

const fmtP = (p) => {
  if (!p) return "———";
  return p >= 1000 ? "$" + p.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}) : "$" + p.toFixed(2);
};

export default function App() {
  const [tab, setTab] = useState("b12");
  const [prices, setPrices] = useState({});
  const [sheet, setSheet] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [updTime, setUpdTime] = useState("—");
  const [loading, setLoading] = useState(false);

  const fetchPrice = async (t) => {
    try {
      const r = await fetch(`/api/quote?symbol=${t}`);
      return await r.json();
    } catch { return null; }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    const tickers = [...new Set([...LISTS.b12, ...LISTS.mag7].map(s => s.t))];
    const results = await Promise.all(tickers.map(async t => ({ t, d: await fetchPrice(t) })));
    const newPrices = {};
    results.forEach(({ t, d }) => { if (d && d.price) newPrices[t] = d; });
    setPrices(newPrices);
    setUpdTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    setCountdown(60);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => { if (c <= 1) { loadAll(); return 60; } return c - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [loadAll]);

  const list = LISTS[tab];
  const gainers = list.filter(s => prices[s.t] && (prices[s.t].price - prices[s.t].prev) > 0).length;
  const s = sheet ? [...LISTS.b12, ...LISTS.mag7].find(x => x.t === sheet) : null;
  const d = sheet ? prices[sheet] : null;
  const sCh = d ? d.price - d.prev : 0;
  const sPct = d && d.prev ? (sCh / d.prev) * 100 : 0;

  return (
    <div style={{background:"#000",minHeight:"100vh",maxWidth:520,margin:"0 auto",fontFamily:"'Courier New',monospace",color:"#fff",display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <div style={{display:"flex",borderBottom:"1px solid #1a1a1a",flexShrink:0}}>
        {["b12","mag7"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{flex:1,padding:"13px 0 11px",textAlign:"center",fontSize:13,fontWeight:700,letterSpacing:2,cursor:"pointer",color:tab===t?"#00ff41":"#444",borderBottom:tab===t?"2px solid #00ff41":"2px solid transparent"}}>
            {t === "b12" ? "BUFF · 12" : "MAG · 7"}
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 8px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"baseline"}}>
          <span style={{fontSize:22,fontWeight:700,letterSpacing:-1,color:"#fff"}}>
            {tab==="b12"?<>BUFF<span style={{color:"#00ff41"}}>12</span></>:<>MAG<span style={{color:"#00ff41"}}>7</span></>}
          </span>
          <span style={{fontSize:10,letterSpacing:4,color:"#444",marginLeft:10}}>TRACKER</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"#111",border:"1px solid #222",borderRadius:99,padding:"5px 14px",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",gap:6}}>
            <span>{gainers}</span><span>/</span><span>{list.length}</span>
            <span style={{fontSize:11,color:gainers>=Math.ceil(list.length/2)?"#00ff41":"#ff3b3b"}}>▲</span>
          </div>
          <button onClick={loadAll} style={{width:38,height:38,borderRadius:"50%",background:"#111",border:"1px solid #222",color:"#888",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{display:"inline-block",animation:loading?"spin 0.8s linear infinite":"none"}}>↻</span>
          </button>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",padding:"2px 16px 10px",fontSize:11,color:"#444",flexShrink:0}}>
        <span>Updated <span style={{color:"#00ff41"}}>{updTime}</span></span>
        <span>Next: <span style={{color:"#00ff41"}}>{String(Math.floor(countdown/60)).padStart(2,"0")}:{String(countdown%60).padStart(2,"0")}</span></span>
      </div>
      <div style={{height:1,background:"#141414",flexShrink:0}}/>
      <div style={{flex:1,overflowY:"auto"}}>
        {list.map(s => {
          const d = prices[s.t];
          const ch = d ? d.price-d.prev : 0;
          const pct = d && d.prev ? (ch/d.prev)*100 : 0;
          const col = pct>0?"#00ff41":pct<0?"#ff3b3b":"#555";
          return (
            <div key={s.t} onClick={()=>setSheet(s.t)} style={{display:"flex",alignItems:"center",padding:"16px",borderBottom:"1px solid #0f0f0f",cursor:"pointer"}}>
              <div style={{minWidth:120}}>
                <div style={{fontSize:22,fontWeight:700,color:"#fff"}}>{s.t}</div>
                <div style={{fontSize:11,color:"#444",marginTop:3}}>{s.n}</div>
              </div>
              <div style={{flex:1,textAlign:"right",paddingRight:14}}>
                <div style={{fontSize:20,fontWeight:700,color:"#fff",whiteSpace:"nowrap"}}>{d?fmtP(d.price):<span style={{color:"#1e1e1e"}}>$———</span>}</div>
              </div>
              <div style={{textAlign:"right",minWidth:88}}>
                <div style={{fontSize:18,fontWeight:700,color:col}}>{d?`${pct>=0?"+":""}${Math.abs(pct).toFixed(2)}%`:<span style={{color:"#1e1e1e"}}>——%</span>}</div>
                <div style={{fontSize:12,color:col,marginTop:3}}>{d?`${ch>=0?"+":""}${Math.abs(ch).toFixed(2)}`:<span style={{color:"#1e1e1e"}}>——</span>}</div>
              </div>
            </div>
          );
        })}
      </div>
      {sheet && (
        <div onClick={e=>{if(e.target===e.currentTarget)setSheet(null)}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
          <div style={{background:"#080808",borderRadius:"18px 18px 0 0",borderTop:"1px solid #1e1e1e",width:"100%",maxWidth:520,paddingBottom:40,maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{width:38,height:4,background:"#252525",borderRadius:99,margin:"13px auto 0"}}/>
            <div style={{padding:"20px 20px 14px",borderBottom:"1px solid #111"}}>
              <div style={{fontSize:28,fontWeight:700,letterSpacing:-1}}>{s?.t}</div>
              <div style={{fontSize:13,color:"#444",marginTop:3}}>{s?.n}</div>
              <div style={{fontSize:34,fontWeight:700,marginTop:12,letterSpacing:-1}}>{d?fmtP(d.price):"—"}</div>
              <div style={{fontSize:17,fontWeight:700,marginTop:5,color:sPct>=0?"#00ff41":"#ff3b3b"}}>
                {d?`${sPct>=0?"+":""}${sPct.toFixed(2)}%   ${sCh>=0?"+":""}${Math.abs(sCh).toFixed(2)}`:""}
              </div>
            </div>
            <div style={{padding:"16px 20px 0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["P/E",s?.pe],["ROE",s?.roe],["Net Margin",s?.margin],["Free Cash Flow",s?.fcf],["Moat",s?.moat],["Dividend",s?.div],["Berkshire",s?.brk],["Day High",d?fmtP(d.high):"—"],["Day Low",d?fmtP(d.low):"—"],["Volume",d&&d.vol?(d.vol/1e6).toFixed(1)+"M":"—"]].map(([l,v])=>(
                  <div key={l} style={{background:"#111",borderRadius:11,padding:"12px 14px"}}>
                    <div style={{fontSize:10,color:"#444",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:14,fontWeight:700}}>{v}</div>
                  </div>
                ))}
              </div>
              {s?.note&&<div style={{background:"#0a150a",border:"1px solid #162616",borderRadius:11,padding:14,marginBottom:16}}>
                <div style={{fontSize:10,color:"#00ff41",textTransform:"uppercase",letterSpacing:"0.09em",marginBottom:7}}>Buffett Note</div>
                <div style={{fontSize:13,color:"#777",lineHeight:1.65,fontFamily:"system-ui,sans-serif"}}>{s.note}</div>
              </div>}
              <button onClick={()=>setSheet(null)} style={{width:"100%",padding:15,background:"#111",border:"1px solid #1e1e1e",borderRadius:11,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:2,fontFamily:"'Courier New',monospace"}}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{-webkit-tap-highlight-color:transparent}::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
