import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── Data ─────────────────────────────────────────────────────────────────────

const TEN_BOTS = [
  { num: "01", name: "Base Score Bot", tag: "SAFETY LAYER", color: "#00F5A0",
    desc: "Runs RugCheck, honeypot detection, and mint/freeze authority analysis on every candidate. Scores every token 0–100 before any other signal fires. If it fails here, it never reaches your bot." },
  { num: "02", name: "Volume Momentum Bot", tag: "MOMENTUM", color: "#00C9FF",
    desc: "Tracks DexScreener price velocity and volume acceleration every 15 seconds. Fires a Negative Divergence signal the moment price stalls on sustained volume — your exit trigger before the chart moves." },
  { num: "03", name: "Social Signal Bot", tag: "X SCOUT", color: "#FFB800",
    desc: "Runs X Scout legitimacy scoring on tokens clearing the safety threshold — a 5-dimension forensic analysis of every X account mentioning the token, powered by Claude AI. Applies a direct score bonus to tokens called by @SolBotChad." },
  { num: "04", name: "Whale Detection Bot", tag: "WHALE INTEL", color: "#00C9FF",
    desc: "Dual-layer whale tracking. Layer 1: passive real-time alerts when a tracked high-conviction wallet buys — zero API cost. Layer 2: active scan of each token's recent transactions for smart-money buyers by SOL balance." },
  { num: "05", name: "Graduation Signal Bot", tag: "BONDING CURVE", color: "#f5a623",
    desc: "Monitors every pump.fun bonding curve in real time via Helius gRPC. Scores each token's progress toward graduation (0–20 pts) and feeds it into the Confluence board. Tokens near the threshold get elevated signal weight." },
  { num: "06", name: "Insider Clustering Bot", tag: "CLUSTER INTEL", color: "#00F5A0",
    desc: "Detects when 3 or more tracked profitable wallets buy the same token within a short window using in-memory whale-watcher events — zero API cost. When a cluster fires, the Confluence Score jumps immediately." },
  { num: "07", name: "Time-Weighted Scoring Bot", tag: "SIGNAL FRESHNESS", color: "#00C9FF",
    desc: "Applies recency decay to every signal on the board. Volume spikes, price acceleration, and buy momentum are weighted by how recently they occurred — older signals are discounted automatically." },
  { num: "08", name: "Developer Reputation Bot", tag: "DEV INTEL", color: "#FFB800",
    desc: "Scores the token deployer's full on-chain history — prior launch success rates, rug patterns, and wallet connections. Runs on tokens already clearing the safety score threshold to preserve RPC credits." },
  { num: "09", name: "The Executioner", tag: "POSITION MANAGER", color: "#00F5A0",
    desc: "Watches the live Confluence Score for every open position every 10 seconds. Auto-exits on Confluence Collapse — when the score drops below 40% of the entry threshold. Takes a score-adaptive partial profit on Negative Divergence." },
  { num: "10", name: "Early Momentum Executor", tag: "CHAD ONLY", color: "#9945FF",
    desc: "Fires immediately the moment P1 safety checks pass on a new launch — no queue, no polling delay. Detects velocity: 3+ unique wallets buying within 30 seconds, all below the 35 SOL bonding curve threshold. The peak SOL gate catches pump-and-dump retraces." },
];

const TIERS = [
  { key: "free",  label: "FREE",  price: null,  color: "rgba(138,170,187,0.7)", highlight: false,
    features: ["Live token scanner","On-chain safety checks","Social data read-only","Paper trading: 10/day, score ≥ 85","Full Chad-grade signals in paper mode","2 SOL persistent paper wallet","Bot live auto-trading locked"] },
  { key: "basic", label: "BASIC", price: 59,   color: "rgba(138,170,187,0.85)", highlight: false,
    features: ["Everything in Free","Auto-bot enabled","3 max open positions","10 trades per hour","Unlimited paper trades","The Executioner — Confluence Collapse auto-exit (Bot 9)"] },
  { key: "pro",   label: "PRO",   price: 159,  color: "#FFB800", highlight: true,
    features: ["Everything in Basic","10 max open positions","30 trades per hour","Dynamic priority fee escalation","RPC redundancy + auto-failover","Helius webhook low-latency execution","Live social intelligence (DEX Scout · X Scout · TG Scout)","Whale copy-trading","SolChad Scanner — score any CA on-demand","ConfluenceRadar signal dashboard"] },
  { key: "chad",  label: "CHAD",  price: 349,  color: "#00F5A0", highlight: false,
    features: ["Everything in Pro","Unlimited positions & trades","10-Bot Quantitative Trading Desk","Early Momentum Executor (Bot 10)","Kelly Criterion position sizing","pump.fun graduation sniping (Bot 5)","Insider wallet clustering (Bot 6)","Time-weighted signal scoring (Bot 7)","Developer reputation scoring (Bot 8)","Negative Divergence partial exit","@SolBotChad flywheel bonus weighting"] },
];

const COMPARISON = [
  { feature: "Fully autonomous (fires without you)",     solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Multi-signal confluence scoring",          solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Developer reputation filtering",           solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Insider wallet cluster detection",         solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Bonding Watchlist (pre-graduation queue)", solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Paper trading for beginners",              solbot: true,  telegram: false, terminal: false, oss: false },
  { feature: "Web dashboard + tiered accounts",          solbot: true,  telegram: false, terminal: true,  oss: false },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function GradientText({ children }: { children: React.ReactNode }) {
  return <span style={{ background: "linear-gradient(90deg,#00F5A0,#00C9FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{children}</span>;
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"5px 12px", borderRadius:4, background:`${color}10`, border:`1px solid ${color}30`, fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color }}>{children}</span>;
}

function BulletItem({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <li style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
      <span style={{ color, fontSize:10, fontWeight:700, marginTop:3, flexShrink:0 }}>▸</span>
      <div>
        <span style={{ fontSize:13, fontWeight:600, color:"#F0F8FF" }}>{label}</span>
        <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, color:"rgba(138,170,187,0.84)", display:"block", marginTop:2, lineHeight:1.5 }}>{sub}</span>
      </div>
    </li>
  );
}

function ShowcaseCard({ border, glow, badge1, badge2, title, body, bullets, rightContent }: {
  border: string; glow: string; badge1: { label: string; color: string }; badge2: { label: string; color: string };
  title: string; body: string; bullets: { label: string; sub: string; color: string }[];
  rightContent: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity:0, y:32 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }}
      style={{ borderRadius:12, overflow:"hidden", background:"rgba(6,16,28,0.9)", border:`1px solid ${border}`, boxShadow:`0 0 60px ${glow}` }}>
      <div style={{ display:"flex", flexWrap:"wrap" }}>
        <div style={{ flex:"0 0 min(100%,55%)", display:"flex", flexDirection:"column", gap:20, padding:"36px 40px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:badge1.color, background:`${badge1.color}12`, border:`1px solid ${badge1.color}28`, padding:"3px 8px", borderRadius:3 }}>{badge1.label}</span>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:badge2.color, background:`${badge2.color}08`, border:`1px solid ${badge2.color}22`, padding:"3px 8px", borderRadius:3 }}>{badge2.label}</span>
          </div>
          <h3 style={{ fontSize:"clamp(1.2rem,2.5vw,1.6rem)", fontWeight:900, color:"#F0F8FF", lineHeight:1.2 }}>{title}</h3>
          <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(138,170,187,0.85)" }}>{body}</p>
          <ul style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {bullets.map((b,i) => <BulletItem key={i} {...b} />)}
          </ul>
        </div>
        <div style={{ flex:"0 0 min(100%,45%)", display:"flex", flexDirection:"column", justifyContent:"center", gap:16, padding:"36px 40px", background:"rgba(0,0,0,0.3)", borderLeft:`1px solid ${border}` }}>
          {rightContent}
        </div>
      </div>
    </motion.div>
  );
}

function StatsTicker() {
  const items = [
    { val:"12,400+", label:"Tokens Scanned / Hr" }, { val:"<200ms", label:"Scan Latency" },
    { val:"~3%", label:"Pass Rate" }, { val:"99.9%", label:"Uptime" },
    { val:"10", label:"Bots Per Subscriber" }, { val:"Every 10s", label:"Position Checks" },
    { val:"5", label:"X Scout Dimensions" }, { val:"Solana", label:"Chain" },
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow:"hidden", borderTop:"1px solid rgba(0,245,160,0.1)", borderBottom:"1px solid rgba(0,245,160,0.1)", padding:"12px 0", background:"rgba(0,245,160,0.02)" }}>
      <div className="ticker-track" style={{ display:"flex", gap:48, whiteSpace:"nowrap", width:"max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:8 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:12, fontWeight:700, color:"#00F5A0" }}>{item.val}</span>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, color:"rgba(138,170,187,0.6)" }}>{item.label}</span>
            <span style={{ color:"rgba(0,245,160,0.3)", marginLeft:8 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BotCard({ bot, index }: { bot: typeof TEN_BOTS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once:true, margin:"-60px" });
  return (
    <motion.article ref={ref} initial={{ opacity:0, y:28 }} animate={inView ? { opacity:1, y:0 } : {}} transition={{ duration:0.45, delay:(index%3)*0.07 }}
      style={{ background:"rgba(6,16,28,0.85)", border:`1px solid ${bot.color}30`, borderRadius:8, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <span style={{ fontFamily:"DM Mono,monospace", fontSize:32, fontWeight:900, color:`${bot.color}55`, lineHeight:1 }}>{bot.num}</span>
        <span style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:bot.color, background:`${bot.color}12`, border:`1px solid ${bot.color}25`, padding:"3px 8px", borderRadius:3, whiteSpace:"nowrap" }}>{bot.tag}</span>
      </div>
      <div>
        <h3 style={{ fontSize:15, fontWeight:700, color:"#F0F8FF", marginBottom:8 }}>{bot.name}</h3>
        <p style={{ fontSize:13, lineHeight:1.65, color:"rgba(138,170,187,0.85)" }}>{bot.desc}</p>
      </div>
    </motion.article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolChadPage() {
  const [activeSection, setActiveSection] = useState("");
  const [billingInterval, setBillingInterval] = useState<"monthly"|"6month"|"annual">("annual");

  const prices: Record<string, { monthly:number; six:number; annual:number }> = {
    basic: { monthly:59,  six:50,  annual:39  },
    pro:   { monthly:159, six:135, annual:119 },
    chad:  { monthly:349, six:295, annual:279 },
  };

  useEffect(() => {
    const sections = ["why","features","bots","pricing"];
    const observers: IntersectionObserver[] = [];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActiveSection(id); }, { rootMargin:"-40% 0px -55% 0px" });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const navColor = (id: string) => activeSection === id ? "#00F5A0" : "rgba(138,170,187,0.7)";

  return (
    <div style={{ minHeight:"100vh", background:"#020B14", color:"#F0F8FF", overflowX:"hidden" }}>

      {/* ── Header ── */}
      <header style={{ position:"sticky", top:0, zIndex:50, background:"rgba(2,11,20,0.9)", backdropFilter:"blur(16px)", borderBottom:"1px solid rgba(0,245,160,0.08)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1 }}>
            <span style={{ fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:"1.25rem", color:"#F0F8FF", letterSpacing:"-0.5px" }}>SolChad</span>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:"0.55rem", letterSpacing:"0.2em", color:"rgba(0,201,255,0.65)", marginTop:3 }}>QUANTITATIVE EDGE</span>
          </div>
          <nav style={{ display:"flex", alignItems:"center", gap:24 }}>
            {[["#why","Why"],["#features","Features"],["#bots","The Bots"],["#pricing","Pricing"]].map(([href,label]) => (
              <a key={href} href={href} style={{ fontFamily:"DM Mono,monospace", fontSize:12, color:navColor(href.slice(1)), textDecoration:"none", transition:"color 0.2s" }}>{label}</a>
            ))}
            <a href="https://solbot.app" style={{ fontFamily:"DM Mono,monospace", fontSize:12, color:"rgba(138,170,187,0.7)", textDecoration:"none" }}>SolBot.app</a>
          </nav>
          <a href="https://solbot.app/#pricing" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 18px", borderRadius:8, background:"rgba(0,245,160,0.1)", border:"1px solid rgba(0,245,160,0.3)", textDecoration:"none", fontFamily:"DM Mono,monospace", fontSize:12, fontWeight:700, color:"#00F5A0", transition:"all 0.15s" }}>
            Start for $39/mo →
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position:"relative", padding:"96px 24px 72px", display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:700, background:"rgba(0,245,160,0.04)", borderRadius:"50%", filter:"blur(140px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"30%", left:"20%", width:400, height:400, background:"rgba(0,201,255,0.035)", borderRadius:"50%", filter:"blur(100px)", pointerEvents:"none" }} />
        <div style={{ maxWidth:760, textAlign:"center", position:"relative", zIndex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:24 }}>
          <motion.div initial={{ opacity:0, scale:0.7 }} animate={{ opacity:1, scale:1 }} transition={{ type:"spring", stiffness:110, damping:14 }}>
            <div className="avatar-glow" style={{ width:140, height:140, borderRadius:"50%", border:"2.5px solid #00F5A0", overflow:"hidden" }}>
              <img src="/solchad.png" alt="SolChad — the quantitative trading edge behind SolBot" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, delay:0.2 }} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:4, height:4, borderRadius:"50%", background:"#00F5A0", display:"inline-block" }} />
              <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, color:"#00F5A0", letterSpacing:"3px", fontWeight:700 }}>SOLCHAD EDGE</span>
              <span style={{ width:4, height:4, borderRadius:"50%", background:"#00F5A0", display:"inline-block" }} />
            </div>
            <h1 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.9rem,5vw,3.4rem)", fontWeight:800, color:"#F0F8FF", letterSpacing:"-1px", lineHeight:1.12, textAlign:"center" }}>
              The Others Exit on Price.{" "}<GradientText>Chad Exits on Signal Deterioration.</GradientText>
            </h1>
            <p style={{ fontSize:"clamp(1rem,2vw,1.15rem)", color:"rgba(138,170,187,0.9)", lineHeight:1.7, maxWidth:580, textAlign:"center" }}>
              Before the chart moves. Before the panic. A <strong style={{ color:"#F0F8FF" }}>10-bot quantitative trading desk</strong> runs 24/7 for each Chad subscriber — with a dedicated position manager that exits on Confluence Collapse, not on loss, and an Early Momentum executor that fires in milliseconds on new launches.
            </p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center" }}>
              <a href="https://solbot.app/#pricing" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:10, background:"linear-gradient(90deg,#00F5A0,#00C9FF)", color:"#020B14", fontSize:14, fontWeight:800, textDecoration:"none" }}>
                <span style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <span>Start for $39/mo →</span>
                  <span style={{ fontSize:10, fontWeight:500, opacity:0.7 }}>(Billed Annually)</span>
                </span>
              </a>
              <a href="https://solbot.app" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", fontSize:14, fontWeight:600, textDecoration:"none" }}>
                Already on Chad? Open the app →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsTicker />

      {/* ── Why SolChad ── */}
      <section id="why" style={{ padding:"96px 24px", background:"#010810", borderTop:"1px solid rgba(0,245,160,0.06)", borderBottom:"1px solid rgba(0,245,160,0.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:"center", marginBottom:56 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>WHY SOLBOT</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:800, color:"#F0F8FF", marginTop:12, letterSpacing:"-0.5px", lineHeight:1.15 }}>
              Every Other Bot is Built for Speed.<br /><GradientText>SolBot is Built for Quality of Decision.</GradientText>
            </h2>
            <p style={{ fontFamily:"DM Mono,monospace", fontSize:13, color:"rgba(138,170,187,0.75)", marginTop:16, maxWidth:600, margin:"16px auto 0", lineHeight:1.7 }}>
              The Solana trading bot market is built around one idea: execute faster than the next guy. SolBot is built around a fundamentally different idea — only trade what's actually worth trading.
            </p>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:64 }}>
            {[
              { tag:"CONFLUENCE SCORING", headline:"9 Signals. 1 Trade.", color:"#00F5A0",
                body:"Every other bot fires on a single trigger — new mint, volume spike, a Telegram call. SolBot requires 9 independent bots to agree before a single dollar moves. Safety score, momentum, social sentiment, whale entry, developer reputation — simultaneously. If one signal breaks, the trade doesn't fire." },
              { tag:"SIGNAL QUALITY", headline:"~3% Pass Rate. That's the Point.", color:"#FFB800",
                body:"SolBot scans 200,000+ tokens every day. It trades roughly 3% of them. The other 97% are noise — rugs, low-conviction launches, recycled dev wallets. That extreme filter isn't a limitation. It's the entire product. You don't want more trades. You want better ones." },
              { tag:"PRODUCT ARCHITECTURE", headline:"A Dashboard. Not a Telegram Bot.", color:"#00C9FF",
                body:"Trojan. Maestro. Photon. They live in a chat window. SolBot is a full SaaS platform — real accounts, paper trading for beginners, a live signal feed, position tracking, and a dedicated 10-bot quantitative engine running 24/7 in the cloud. Fund it. Forget it. Ape it." },
            ].map((card,i) => (
              <motion.div key={i} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.45, delay:i*0.1 }}
                style={{ background:"rgba(6,16,28,0.85)", border:`1px solid ${card.color}22`, borderRadius:10, padding:24 }}>
                <span style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:card.color, background:`${card.color}12`, border:`1px solid ${card.color}28`, padding:"3px 8px", borderRadius:3 }}>{card.tag}</span>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#F0F8FF", margin:"14px 0 10px", lineHeight:1.2 }}>{card.headline}</h3>
                <p style={{ fontSize:13, lineHeight:1.7, color:"rgba(138,170,187,0.85)" }}>{card.body}</p>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:1, borderRadius:8, overflow:"hidden", border:"1px solid rgba(0,245,160,0.15)", background:"rgba(0,245,160,0.06)", marginBottom:64 }}>
            {[["200K+","TOKENS SCANNED DAILY"],["~3%","PASS RATE"],["0–2ms","HELIUS WEBHOOK LATENCY"],["10","SIGNALS REQUIRED TO TRADE"]].map(([val,label]) => (
              <div key={label} style={{ background:"rgba(2,11,20,0.8)", padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontFamily:"DM Mono,monospace", fontSize:24, fontWeight:900, color:"#00F5A0" }}>{val}</div>
                <div style={{ fontFamily:"DM Mono,monospace", fontSize:9, letterSpacing:"0.12em", color:"rgba(138,170,187,0.55)", marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ overflowX:"auto" }}>
            <div style={{ minWidth:560 }}>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:0, borderRadius:8, overflow:"hidden", border:"1px solid rgba(0,245,160,0.12)" }}>
                <div style={{ background:"rgba(2,11,20,0.9)", padding:"12px 16px", fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, color:"rgba(138,170,187,0.5)", letterSpacing:"0.1em" }}>CAPABILITY</div>
                {["SOLBOT","TELEGRAM BOTS","WEB TERMINALS","OPEN SOURCE"].map(h => (
                  <div key={h} style={{ background:"rgba(2,11,20,0.9)", padding:"12px 16px", fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, color:h==="SOLBOT"?"#00F5A0":"rgba(138,170,187,0.5)", letterSpacing:"0.1em", textAlign:"center", borderLeft:"1px solid rgba(0,245,160,0.08)" }}>{h}</div>
                ))}
                {COMPARISON.map((row,i) => (
                  <React.Fragment key={i}>
                    <div style={{ background:i%2===0?"rgba(4,14,24,0.8)":"rgba(2,11,20,0.6)", padding:"10px 16px", fontSize:13, color:"rgba(138,170,187,0.85)", borderTop:"1px solid rgba(0,245,160,0.05)" }}>{row.feature}</div>
                    {[row.solbot,row.telegram,row.terminal,row.oss].map((v,j) => (
                      <div key={j} style={{ background:i%2===0?"rgba(4,14,24,0.8)":"rgba(2,11,20,0.6)", display:"flex", alignItems:"center", justifyContent:"center", borderLeft:"1px solid rgba(0,245,160,0.08)", borderTop:"1px solid rgba(0,245,160,0.05)" }}>
                        <span style={{ fontWeight:700, fontSize:14, color:v?(j===0?"#00F5A0":"rgba(138,170,187,0.5)"):"rgba(239,68,68,0.6)" }}>{v?"✓":"✗"}</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Confluence Collapse ── */}
      <section style={{ padding:"96px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center,rgba(0,245,160,0.04) 0%,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:900, margin:"0 auto", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:32, position:"relative", zIndex:1 }}>
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.6 }} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <Badge color="#00F5A0">THE PROFESSIONAL EDGE</Badge>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.8rem,4.5vw,3.2rem)", fontWeight:800, color:"#F0F8FF", letterSpacing:"-0.5px", lineHeight:1.15 }}>
              Normies Are Still Holding Onto Hope.{" "}<GradientText>Chad Already Left.</GradientText>
            </h2>
            <p style={{ fontSize:"clamp(1rem,2vw,1.15rem)", color:"rgba(138,170,187,0.9)", lineHeight:1.7, maxWidth:680 }}>
              Price is a lagging indicator. By the time the chart breaks, the exit has already cost you. Bot 9 — The Executioner — watches the live Confluence Score for every open position every 10 seconds. The moment signals start collapsing, it sells. Before the chart moves. Before the Telegram channel panics.
            </p>
          </motion.div>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5, delay:0.15 }}
            style={{ width:"100%", maxWidth:720, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:1, borderRadius:6, overflow:"hidden", border:"1px solid rgba(0,245,160,0.3)", background:"rgba(0,245,160,0.08)" }}>
            {[
              { label:"RETAIL TRADER", detail:"Watches price. Exits after the drop. Holds bags.", color:"rgba(138,170,187,0.82)" },
              { label:"STANDARD BOT",  detail:"Exits on stop loss. Still reacts to price. Still late.", color:"#FFB800" },
              { label:"CHAD — BOT 9",  detail:"Exits on Confluence Collapse. Before the price moves.", color:"#00F5A0" },
            ].map(row => (
              <div key={row.label} style={{ background:"rgba(2,11,20,0.75)", padding:"24px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:row.color }}>{row.label}</span>
                <p style={{ fontSize:12, textAlign:"center", lineHeight:1.6, color:"rgba(240,248,255,0.7)" }}>{row.detail}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Global Signal Cache ── */}
      <section style={{ padding:"96px 24px", background:"rgba(1,8,16,0.6)", borderTop:"1px solid rgba(0,201,255,0.08)", borderBottom:"1px solid rgba(0,201,255,0.08)", overflow:"hidden" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", gap:64 }}>
          <motion.div initial={{ opacity:0, x:-40 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:0.7 }} style={{ flex:"1 1 380px", display:"flex", flexDirection:"column", gap:24 }}>
            <Badge color="#00C9FF">THE INFRASTRUCTURE ADVANTAGE</Badge>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.8rem,3.5vw,2.8rem)", fontWeight:800, color:"#F0F8FF", letterSpacing:"-0.5px", lineHeight:1.15 }}>Ten Bots. One Shared Ground Truth.</h2>
            <p style={{ fontSize:"clamp(0.95rem,1.8vw,1.1rem)", color:"rgba(138,170,187,0.9)", lineHeight:1.7 }}>
              Every Chad subscriber's 10-bot team draws from the same <strong style={{ color:"#F0F8FF" }}>Global Signal Cache</strong> — updated continuously across all active tokens. No bot burns individual API rate limits. No subscriber waits for a stale feed. A single-user independent bot hitting DexScreener, X, and Helius directly runs into rate limits within minutes at Chad's scan volume. <strong style={{ color:"#F0F8FF" }}>No per-user bot can do this at any price.</strong>
            </p>
            <div style={{ display:"flex", flexDirection:"column" }}>
              {[["Bot 2 momentum refresh","Every 15 seconds"],["Bot 9 position evaluation","Every 10 seconds"],["API rate limits burned per subscriber","Zero"]].map(([label,val]) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(0,201,255,0.1)" }}>
                  <span style={{ fontFamily:"DM Mono,monospace", fontSize:12, color:"rgba(138,170,187,0.7)" }}>{label}</span>
                  <span style={{ fontFamily:"DM Mono,monospace", fontSize:12, fontWeight:700, color:"#00C9FF" }}>{val}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0, x:40 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true, margin:"-80px" }} transition={{ duration:0.7, delay:0.15 }} style={{ flex:"1 1 320px" }}>
            <div style={{ background:"rgba(0,201,255,0.03)", border:"1px solid rgba(0,245,160,0.3)", borderRadius:8, padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:"#00C9FF", display:"inline-block" }} />
                <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:"#00C9FF" }}>GLOBAL SIGNAL CACHE — LIVE</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[{t:"BONK",s:82,sigs:["GRAD","WHALE","SOC"],a:true},{t:"PEPE2",s:71,sigs:["CLUST","MOM","TW"],a:true},{t:"CINO",s:67,sigs:["GRAD","DEV","MOM"],a:true},{t:"AISM",s:44,sigs:["SOC"],a:false}].map(row => (
                  <div key={row.t} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderRadius:4, background:"rgba(0,0,0,0.3)", border:`1px solid ${row.a?"rgba(0,245,160,0.25)":"rgba(138,170,187,0.08)"}` }}>
                    <span style={{ fontFamily:"DM Mono,monospace", fontSize:13, fontWeight:700, color:"#F0F8FF" }}>{row.t}</span>
                    <div style={{ display:"flex", gap:4 }}>
                      {row.sigs.map(s => <span key={s} style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, padding:"2px 6px", borderRadius:2, background:row.a?"rgba(0,245,160,0.12)":"rgba(138,170,187,0.06)", color:row.a?"#00F5A0":"rgba(138,170,187,0.6)" }}>{s}</span>)}
                    </div>
                    <span style={{ fontFamily:"DM Mono,monospace", fontSize:13, fontWeight:700, color:row.s>70?"#00F5A0":row.s>50?"#FFB800":"rgba(138,170,187,0.7)" }}>{row.s}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily:"DM Mono,monospace", fontSize:10, marginTop:12, textAlign:"center", color:"rgba(138,170,187,0.55)" }}>Shared across all Chad subscribers · Signals updated continuously</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" style={{ padding:"96px 24px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:"center", marginBottom:56 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>THE SOLCHAD EDGE ADVANTAGE</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.7rem,3.5vw,2.6rem)", fontWeight:800, color:"#F0F8FF", marginTop:12, letterSpacing:"-0.5px", lineHeight:1.15 }}>
              Ten Dedicated Trading Bots.<br /><GradientText>Pro Gets the Speed Layer. Chad Gets All Ten.</GradientText>
            </h2>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {[
              { tag:"EXECUTION SPEED", tier:"PRO+", color:"#FFB800", title:"Dynamic Priority Fee Escalation", body:"When multiple signals align simultaneously, the bot auto-escalates compute unit pricing in real-time — ensuring your transaction lands at the front of the queue before anyone else reacts." },
              { tag:"RELIABILITY", tier:"PRO+", color:"#FFB800", title:"RPC Redundancy + Auto-Failover", body:"Never miss a trade because your RPC node hiccuped. SolBot maintains a live pool of premium RPC endpoints with health checks — failed nodes are cut instantly and traffic rerouted automatically." },
              { tag:"LOW LATENCY", tier:"PRO+", color:"#FFB800", title:"Helius Webhook + Pre-Built Transactions", body:"SolBot uses Helius webhooks to receive on-chain events the moment they happen — no polling delay. Pre-built transaction templates shave critical milliseconds off every trade execution." },
              { tag:"SNIPING", tier:"CHAD+", color:"#00F5A0", title:"pump.fun Graduation Sniping", body:"Monitor every pump.fun bonding curve in real-time. When a token hits the $69K graduation threshold, SolBot fires a buy before it ever appears on a DEX — the earliest possible entry, every time." },
              { tag:"CLUSTER INTEL", tier:"CHAD+", color:"#00F5A0", title:"Insider Wallet Clustering", body:"SolChad passively monitors known profitable wallets via the whale-watcher. When 3 or more tracked wallets buy the same token, SolChad flags it as a cluster event and escalates confidence scoring — before the chart shows any move." },
              { tag:"SIGNAL SCORING", tier:"CHAD+", color:"#00F5A0", title:"Time-Weighted Signal Scoring", body:"Recency matters. SolChad Edge scores every signal by how fresh it is and how exclusive the wallet generating it is — older signals and crowded wallets are downweighted automatically." },
              { tag:"DEV INTEL", tier:"CHAD+", color:"#00F5A0", title:"Developer Reputation Scoring", body:"SolChad pulls the deployer wallet's on-chain history — prior launches, success rates, and insider patterns. Tokens from repeat bad actors are filtered out before the first signal fires." },
              { tag:"ON-DEMAND INTEL", tier:"PRO+", color:"#FFB800", title:"SolChad Scanner — Score Any Token On-Demand", body:"Paste any Solana contract address and get the full 4-pillar SolChad analysis instantly — contract safety, developer reputation, buyer quality, and market structure. The same scoring engine the bot uses to make live buy decisions." },
              { tag:"SOCIAL INTEL", tier:"PRO+", color:"#FFB800", title:"Social Signal Intelligence", body:"Three dedicated social intelligence bots run 24/7: DEX Scout probes Telegram groups, X Scout runs a 5-dimension legitimacy analysis on X/Twitter, and TG Scout monitors alpha group confluences — when 2+ groups mention the same token within 60 seconds, a priority signal fires." },
              { tag:"X SCOUT", tier:"PRO+", color:"#FFB800", title:"X Scout — X/Twitter Legitimacy Analysis", body:"Every token clearing the global score threshold is automatically scored by X Scout — a 5-dimension forensic analysis evaluating social graph quality, engagement authenticity, narrative strength, KOL mentions, and red flag detection. The verdict feeds directly into the Confluence Engine." },
              { tag:"EARLY MOMENTUM", tier:"CHAD+", color:"#9945FF", title:"Bot 10 — Early Momentum Executor", body:"Detects explosive launches in real time. When 3+ unique wallets buy the same token within a 30-second window and the bonding curve SOL reserves are between 0.5 and 10 SOL, Bot 10 bypasses the normal scoring queue and fires immediately — before the chart reacts." },
              { tag:"POSITION MANAGEMENT", tier:"CHAD+", color:"#00F5A0", title:"The Executioner — Confluence Collapse Auto-Exit", body:"Bot 9 watches the live Confluence Score for every open position every 10 seconds. When signals collapse below 40% of the entry threshold, it auto-sells the full position — before the price chart reflects the deterioration." },
            ].map((f,i) => (
              <motion.div key={i} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:(i%4)*0.07 }}
                style={{ background:"rgba(6,16,28,0.85)", border:`1px solid ${f.color}22`, borderRadius:8, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <span style={{ fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", color:f.color, background:`${f.color}12`, border:`1px solid ${f.color}28`, padding:"3px 8px", borderRadius:3 }}>{f.tag}</span>
                </div>
                <div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:"#F0F8FF", marginBottom:8 }}>{f.title}</h3>
                  <p style={{ fontSize:13, lineHeight:1.65, color:"rgba(138,170,187,0.85)" }}>{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All 10 Bots ── */}
      <section id="bots" style={{ padding:"96px 24px", background:"rgba(1,8,16,0.5)", borderTop:"1px solid rgba(0,201,255,0.08)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:"center", marginBottom:56 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>THE CHAD BOT TEAM</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.7rem,3.5vw,2.6rem)", fontWeight:800, color:"#F0F8FF", marginTop:12, letterSpacing:"-0.5px" }}>
              Ten Specialized Bots.{" "}<GradientText>All Running for You.</GradientText>
            </h2>
            <p style={{ fontFamily:"DM Mono,monospace", fontSize:13, marginTop:12, maxWidth:520, margin:"12px auto 0", color:"rgba(138,170,187,0.75)" }}>Each Chad subscriber gets all 10 bots running in parallel — a dedicated team, not a shared queue.</p>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
            {TEN_BOTS.slice(0,9).map((bot,i) => <BotCard key={bot.num} bot={bot} index={i} />)}
            <div style={{ gridColumn:"2/3" }}><BotCard bot={TEN_BOTS[9]} index={9} /></div>
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <motion.section initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ padding:"64px 24px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:24, padding:"28px 32px", borderRadius:8, background:"linear-gradient(135deg,rgba(0,245,160,0.06) 0%,rgba(0,201,255,0.06) 100%)", border:"1px solid rgba(0,245,160,0.3)" }}>
          <div>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(0,245,160,0.6)" }}>SOLCHAD EDGE</span>
            <p style={{ fontFamily:"DM Sans,sans-serif", fontWeight:700, fontSize:"1.1rem", color:"#F0F8FF", marginTop:6, lineHeight:1.4 }}>Ready to deploy your 10-bot trading team?</p>
          </div>
          <a href="https://solbot.app/#pricing" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:10, background:"linear-gradient(90deg,#00F5A0,#00C9FF)", color:"#020B14", fontSize:14, fontWeight:800, textDecoration:"none", whiteSpace:"nowrap" }}>
            <span style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <span>Upgrade to Chad — $279/mo →</span>
                  <span style={{ fontSize:10, fontWeight:500, opacity:0.7 }}>(Billed Annually)</span>
                </span>
          </a>
        </div>
      </motion.section>

      {/* ── Deep Dive Sections ── */}
      <section style={{ padding:"32px 24px 96px", background:"rgba(1,6,14,0.95)", borderTop:"1px solid rgba(0,245,160,0.06)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", gap:32 }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>UNDER THE HOOD</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.7rem,3.5vw,2.6rem)", fontWeight:800, color:"#F0F8FF", marginTop:12, letterSpacing:"-0.5px" }}>
              The Systems That Separate SolBot<br /><GradientText>From Every Other Bot.</GradientText>
            </h2>
          </div>

          {/* Early Momentum */}
          <ShowcaseCard
            border="rgba(0,245,160,0.18)" glow="rgba(0,245,160,0.04)"
            badge1={{ label:"BOT 10", color:"#00F5A0" }} badge2={{ label:"CHAD", color:"#00F5A0" }}
            title="Early Momentum — Catch the Rocket Before It Leaves"
            body="Most bots wait for the chart to confirm a move. By then, the entry is gone. Bot 10 watches the raw on-chain buy stream via gRPC and detects explosive launches as they happen — before DexScreener updates, before the chart moves, before anyone else reacts."
            bullets={[
              { label:"3 buys · 3 unique wallets · 30-second window", sub:"Coordinated shill farms use the same wallets — the unique-wallet gate filters them out automatically", color:"#00F5A0" },
              { label:"0.5–10 SOL bonding curve gate", sub:"Token must have real traction (0.5 SOL floor) but not be already pumped (10 SOL ceiling)", color:"#00C9FF" },
              { label:"Bypasses the normal scoring queue", sub:"Executed immediately — no 30-second hold, no queue wait. Speed is the edge.", color:"#FFB800" },
              { label:"Full safety check still fires", sub:"Honeypot and rug checks run in parallel — momentum speed without sacrificing safety gates", color:"#00F5A0" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["On-chain gRPC stream","Real-time buy events, no polling delay"],["Unique wallet verification","3 distinct fee payers required — not 3 txs from one wallet"],["SOL reserve check","Live bonding curve read — confirms real money in, not fake volume"],["Sybil funder check","If 3+ wallets share the same SOL funder → emergency exit fires instantly"]].map(([t,d]) => (
                  <div key={t} style={{ padding:12, borderRadius:8, background:"rgba(0,245,160,0.04)", border:"1px solid rgba(0,245,160,0.1)" }}>
                    <div style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:"#00F5A0" }}>{t}</div>
                    <div style={{ fontSize:11, color:"rgba(138,170,187,0.8)", marginTop:4 }}>{d}</div>
                  </div>
                ))}
              </div>
            }
          />

          {/* X Scout */}
          <ShowcaseCard
            border="rgba(255,184,0,0.18)" glow="rgba(255,184,0,0.04)"
            badge1={{ label:"X SCOUT", color:"#FFB800" }} badge2={{ label:"PRO+", color:"#FFB800" }}
            title="X Scout — 5-Dimension Social Legitimacy Scoring"
            body="Coordinated shill farms are the #1 cause of bad entries. X Scout runs a forensic analysis of a token's X/Twitter presence — not just follower counts, but the quality, originality, and authenticity of the community behind it. Claude AI handles narrative analysis. The result: a STRONG / WATCH / RUG_FILTER verdict that feeds directly into the Confluence Engine."
            bullets={[
              { label:"Social Graph (25%) — real community vs. coordinated farm", sub:"Account age, follower quality, network diversity", color:"#FFB800" },
              { label:"Forensic History (20%) — prior rug involvement detection", sub:"Past token associations, shill phrase frequency, wallet patterns", color:"#FFB800" },
              { label:"Engagement Authenticity (20%) — organic vs. scripted", sub:"Repetitive phrases, bot-like cadence, copy-paste shill detection", color:"#FFB800" },
              { label:"Professionalism (10%) — project presentation quality", sub:"Bio completeness, linked assets, verified presence signals", color:"#FFB800" },
              { label:"Narrative + Claude AI (25%) — meme originality & lore", sub:"Claude Haiku scores community language, creativity, and shill density in real time", color:"#9945FF" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["STRONG","#00F5A0","High legitimacy — organic community, original content, no red flags"],["WATCH","#FFB800","Proceed with caution — mixed signals, some shill activity detected"],["RUG_FILTER","#FF4444","Blocked — coordinated farm, recycled content, or known bad actors"]].map(([v,c,d]) => (
                  <div key={v} style={{ padding:16, borderRadius:8, background:`${c}08`, border:`1px solid ${c}30` }}>
                    <div style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:c }}>{v}</div>
                    <div style={{ fontSize:12, color:"rgba(138,170,187,0.85)", marginTop:6 }}>{d}</div>
                  </div>
                ))}
                <p style={{ fontFamily:"DM Mono,monospace", fontSize:10, color:"rgba(138,170,187,0.5)" }}>RUG_FILTER tokens are blocked from execution regardless of safety score.</p>
              </div>
            }
          />

          {/* TG Scout */}
          <ShowcaseCard
            border="rgba(0,201,255,0.18)" glow="rgba(0,201,255,0.04)"
            badge1={{ label:"TELEGRAM SCOUT", color:"#00C9FF" }} badge2={{ label:"PRO+", color:"#00C9FF" }}
            title="TG Scout — Alpha Group Confluence Detection"
            body="When real alpha is circulating, it shows up in multiple groups at once. TG Scout monitors a curated list of Solana alpha Telegram groups 24/7. A single mention means nothing. When 2 or more independent groups mention the same token within 60 seconds — that's a confluence signal. It fires immediately as a priority boost into the scoring engine."
            bullets={[
              { label:"2+ independent groups · 60-second window", sub:"Coordinated shills post to the same group — independent groups posting simultaneously is a different signal entirely", color:"#00C9FF" },
              { label:"Priority signal fires instantly", sub:"Bypasses the normal scan cycle — confluence tokens jump the queue for immediate scoring", color:"#00F5A0" },
              { label:"CA extraction from links and raw text", sub:"Parses DexScreener links, Jupiter links, raw contract addresses, and query-param formats automatically", color:"#00C9FF" },
              { label:"Feeds the Confluence Engine as a weighted input", sub:"TG Scout signal adds directly to the token's social score in the 8-pillar board", color:"#FFB800" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Single group mention","rgba(138,170,187,0.3)","Noise — could be a dev posting to their own group"],["2 groups · 60s window","#00C9FF","Confluence signal fires — priority scoring queue"],["3+ groups · 60s window","#00F5A0","Strong confluence — highest social weight applied"]].map(([l,c,d]) => (
                  <div key={l} style={{ padding:12, borderRadius:8, background:"rgba(0,201,255,0.03)", border:`1px solid ${c}30` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:c, display:"inline-block", flexShrink:0 }} />
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:c }}>{l}</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(138,170,187,0.8)" }}>{d}</span>
                  </div>
                ))}
              </div>
            }
          />

          {/* Whale Intelligence */}
          <ShowcaseCard
            border="rgba(153,69,255,0.18)" glow="rgba(153,69,255,0.04)"
            badge1={{ label:"WHALE INTEL", color:"#9945FF" }} badge2={{ label:"PRO+", color:"#9945FF" }}
            title="Whale Intelligence — Self-Growing Smart Money Network"
            body="The best edge in meme coin trading is knowing what smart money is buying before the chart shows it. SolBot's Whale Intelligence engine discovers, scores, and tracks profitable wallets automatically — no manual curation, no static lists that go stale."
            bullets={[
              { label:"Self-growing discovery — runs every 4 hours", sub:"Scans pump.fun on-chain activity, identifies wallets that bought tokens before graduation, promotes those with 40%+ win rate", color:"#9945FF" },
              { label:"Second-degree network mapping", sub:"Wallets that co-buy alongside tracked whales are automatically added — the network compounds itself", color:"#9945FF" },
              { label:"0–100 confidence score per wallet", sub:"Win rate (50 pts) + recency decay (25 pts) + trade volume (25 pts). Inactive whales are deprioritized automatically", color:"#00C9FF" },
              { label:"Live copy-trading + signal feed", sub:"When a tracked whale buys, SolBot copies the trade (if it passes your safety threshold) and sets the WHALE signal for all subscribers", color:"#00F5A0" },
              { label:"Add your own wallets — up to 15", sub:"Know a wallet worth watching? Pin it alongside the system list. Your additions run the same confidence scoring.", color:"#FFB800" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Win Rate","up to 50 pts","The primary signal — based on actual copy-trade outcomes over time"],["Recency","up to 25 pts","Score halves every 14 days of inactivity — stale whales are deprioritized automatically"],["Volume","up to 25 pts","More confirmed observed buys = more reliable signal"]].map(([l,p,d]) => (
                  <div key={l} style={{ padding:12, borderRadius:8, background:"rgba(153,69,255,0.04)", border:"1px solid rgba(153,69,255,0.15)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:"#9945FF" }}>{l}</span>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, color:"#00F5A0" }}>{p}</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(138,170,187,0.8)" }}>{d}</span>
                  </div>
                ))}
              </div>
            }
          />

          {/* Kelly Criterion */}
          <ShowcaseCard
            border="rgba(0,245,160,0.18)" glow="rgba(0,245,160,0.04)"
            badge1={{ label:"KELLY CRITERION", color:"#00F5A0" }} badge2={{ label:"CHAD", color:"#00F5A0" }}
            title="Kelly Criterion — The Card Counter's Edge"
            body="Card counters don't bet the same amount every hand. When the count is high — when the odds are in their favor — they size up. When it's not, they size down. SolBot applies the same math to every trade. A score-60 entry and a score-85 entry are not the same bet. Kelly treats them differently."
            bullets={[
              { label:"Per-user, per-score-bucket Bayesian model", sub:"Your trades train your own model. Tony's win rate doesn't affect your position sizes — and yours don't affect anyone else's", color:"#00F5A0" },
              { label:"Quarter-Kelly default — conservative by design", sub:"Full Kelly maximizes long-run growth but creates violent drawdowns. Quarter-Kelly captures the edge with a fraction of the volatility", color:"#00C9FF" },
              { label:"Self-calibrates from your live trade history", sub:"After 20+ closed trades per score bucket, Kelly updates its win-rate and win/loss-ratio estimates from your actual results", color:"#00F5A0" },
              { label:"Auto-recalibrates when you change entry filters", sub:"Change your min score threshold and Kelly resets to conservative sizing — your old priors no longer apply to the new population", color:"#FFB800" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[["Score 60","Conservative size","32–36% estimated win rate — Kelly sizes small"],["Score 70","Moderate size","40% estimated win rate — Kelly increases the bet"],["Score 80+","Full confidence size","45–52%+ estimated win rate — Kelly sizes up to the cap"]].map(([s,l,d]) => (
                  <div key={s} style={{ padding:12, borderRadius:8, background:"rgba(0,245,160,0.03)", border:"1px solid rgba(0,245,160,0.1)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:12, fontWeight:700, color:"#00F5A0" }}>{s}</span>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, color:"#FFB800" }}>{l}</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(138,170,187,0.8)" }}>{d}</span>
                  </div>
                ))}
                <p style={{ fontFamily:"DM Mono,monospace", fontSize:10, color:"rgba(138,170,187,0.5)" }}>Cold-start uses conservative bootstrap priors until 20+ trades per bucket.</p>
              </div>
            }
          />

          {/* Negative Divergence */}
          <ShowcaseCard
            border="rgba(255,68,68,0.18)" glow="rgba(255,68,68,0.04)"
            badge1={{ label:"NEGATIVE DIVERGENCE", color:"#FF4444" }} badge2={{ label:"CHAD", color:"#FF4444" }}
            title="Negative Divergence — Lock In Profit Before the Drop"
            body="Price can hold while signals collapse underneath. Negative Divergence fires when Bot 2 detects that live confluence signals are deteriorating while you're still in profit — before the chart reflects the weakness. It's the difference between locking in gains and watching them evaporate."
            bullets={[
              { label:"Score-adaptive partial exit — not a flat percentage", sub:"Higher conviction entries exit less aggressively, letting winners run longer. Lower conviction entries exit faster to protect gains.", color:"#FF4444" },
              { label:"Only fires when you're in profit", sub:"Negative Divergence is a profit-protection signal — it never triggers a loss exit. That's what the stop-loss is for.", color:"#FFB800" },
              { label:"Re-entry allowed immediately", sub:"No exit cooldown — this is a momentum exit, not a stop-loss. If signals recover, the bot can re-enter the same token.", color:"#00F5A0" },
            ]}
            rightContent={
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <p style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, letterSpacing:"0.1em", color:"rgba(138,170,187,0.6)" }}>EXIT SIZE BY ENTRY SCORE</p>
                {[["Score 75+","30% exit","High conviction — let the winner run, take a smaller profit lock"],["Score 65–74","40% exit","Good signal — balanced between protecting gains and staying in"],["Score 60–64","50% exit","Standard — equal split between locked profit and open position"],["Score < 60","60% exit","Lower conviction — take gains fast, hold less exposure"]].map(([s,p,d]) => (
                  <div key={s} style={{ padding:12, borderRadius:8, background:"rgba(255,68,68,0.03)", border:"1px solid rgba(255,68,68,0.12)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:"#FF4444" }}>{s}</span>
                      <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:700, color:"#FFB800" }}>{p}</span>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(138,170,187,0.8)" }}>{d}</span>
                  </div>
                ))}
              </div>
            }
          />
        </div>
      </section>

      {/* ── Risk Engine ── */}
      <section style={{ padding:"96px 24px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 60% 40%,rgba(0,201,255,0.04) 0%,transparent 65%)", pointerEvents:"none" }} />
        <div style={{ maxWidth:1200, margin:"0 auto", position:"relative", zIndex:1 }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.5 }} style={{ textAlign:"center", marginBottom:56 }}>
            <Badge color="#00C9FF">RISK MANAGEMENT ENGINE</Badge>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.7rem,3.5vw,2.6rem)", fontWeight:800, color:"#F0F8FF", marginTop:16, letterSpacing:"-0.5px" }}>
              Six Systems. One Goal:{" "}<GradientText>Keep Your Capital.</GradientText>
            </h2>
          </motion.div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
            {[
              { title:"Confluence Collapse Exit", color:"#00F5A0", desc:"When the Confluence Score drops below 40% of the entry threshold, The Executioner auto-exits the full position. You're out before the price catches up to the signal deterioration. A 10-minute grace window applies after entry." },
              { title:"Negative Divergence Adaptive Exit", color:"#FFB800", desc:"Score-adaptive partial exit when price stalls on sustained volume while in profit. Score ≥75 exits 30%, lower conviction exits up to 60%." },
              { title:"Kelly Criterion Position Sizing", color:"#00C9FF", desc:"Position size calculated from your historical win rate and average payout ratio. Higher-confidence setups get larger allocations — the math decides, not sentiment." },
              { title:"Peak SOL Pump-and-Dump Gate", color:"#f5a623", desc:"Bot 10 tracks all-time high virtualSolReserves, not just current value. A token that ran to 60 SOL and dumped to 25 SOL looks early on a snapshot. The peak gate catches it." },
              { title:"Stop Loss + Trailing Moonbag", color:"#9945FF", desc:"Standard configurable stop loss on every position. High-conviction positions get a trailing stop — automatic moonbag management without watching the chart." },
              { title:"ConfluenceRadar Live Dashboard", color:"#00F5A0", desc:"10 signal badges per token with per-signal staleness. NEG DIV, @SolBotChad, and X Scout verdict badges. Live on web dashboard and SolBot mobile app." },
            ].map((item,i) => (
              <motion.div key={item.title} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:(i%3)*0.07 }}
                style={{ background:"rgba(6,16,28,0.85)", border:`1px solid ${item.color}28`, borderRadius:8, padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:item.color, display:"inline-block", flexShrink:0 }} />
                  <h3 style={{ fontFamily:"DM Sans,sans-serif", fontSize:14, fontWeight:700, color:item.color }}>{item.title}</h3>
                </div>
                <p style={{ fontSize:13, lineHeight:1.65, color:"rgba(138,170,187,0.85)" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding:"80px 24px", background:"rgba(1,8,16,0.6)", borderTop:"1px solid rgba(0,245,160,0.06)", borderBottom:"1px solid rgba(0,245,160,0.06)" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>HOW IT WORKS</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.6rem,3vw,2.2rem)", fontWeight:800, color:"#F0F8FF", marginTop:12 }}>Up and Running in Minutes.</h2>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:20 }}>
            {[
              { step:"01", title:"Subscribe & Download", body:"Pick your tier. Access SolBot on desktop at solbot.app or download the Android APK directly — no app store required. App stores ban automated crypto trading apps; we distribute directly so nothing stands between you and your alpha." },
              { step:"02", title:"Connect Your Wallet", body:"Create a dedicated Phantom wallet, fund it with SOL, and paste your private key into the app. Your key never leaves your device — it's encrypted at rest." },
              { step:"03", title:"Let It Run", body:"SolChad Edge takes over. The bot scans, scores, and trades 24/7 while you do anything else. Fund it. Forget it. Ape it." },
            ].map((item,i) => (
              <motion.div key={item.step} initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.4, delay:i*0.1 }}
                style={{ background:"rgba(8,22,36,0.6)", border:"1px solid rgba(0,245,160,0.1)", borderRadius:10, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
                <span style={{ fontFamily:"DM Mono,monospace", fontSize:40, fontWeight:900, color:"rgba(0,245,160,0.22)", lineHeight:1 }}>{item.step}</span>
                <div>
                  <h3 style={{ fontSize:15, fontWeight:700, color:"#F0F8FF", marginBottom:8 }}>{item.title}</h3>
                  <p style={{ fontSize:13, lineHeight:1.65, color:"rgba(138,170,187,0.8)" }}>{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding:"96px 24px", background:"#010810" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center", gap:48 }}>
          <div style={{ textAlign:"center" }}>
            <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.15em", color:"rgba(138,170,187,0.65)" }}>PRICING</span>
            <h2 style={{ fontFamily:"DM Sans,sans-serif", fontSize:"clamp(1.9rem,4vw,3rem)", fontWeight:800, color:"#F0F8FF", marginTop:12, letterSpacing:"-0.5px" }}>
              Pick Your Tier.<br /><GradientText>Start Aping.</GradientText>
            </h2>
            <p style={{ fontFamily:"DM Mono,monospace", fontSize:12, marginTop:12, color:"rgba(138,170,187,0.7)" }}>Monthly billing. Cancel anytime. Direct APK for Android · Desktop web dashboard included.</p>

            {/* Billing toggle */}
            <div style={{ display:"inline-flex", gap:4, marginTop:20, padding:4, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              {([["monthly","Monthly",null],["6month","6 Months","Save 15%"],["annual","Annual","Save 25%"]] as [string,string,string|null][]).map(([iv,label,badge]) => (
                <button key={iv} onClick={() => setBillingInterval(iv as "monthly"|"6month"|"annual")}
                  style={{ padding:"8px 16px", borderRadius:6, border:"none", cursor:"pointer", fontFamily:"DM Mono,monospace", fontSize:11, fontWeight:billingInterval===iv?700:400, background:billingInterval===iv?"rgba(0,245,160,0.12)":"transparent", color:billingInterval===iv?"#00F5A0":"rgba(138,170,187,0.7)", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
                  {label}
                  {badge && <span style={{ fontSize:8, fontWeight:700, padding:"2px 5px", borderRadius:3, background:"rgba(0,245,160,0.15)", color:"#00F5A0" }}>{badge}</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:16, width:"100%" }}>
            {TIERS.map((tier,i) => {
              const p = tier.price ? prices[tier.key] : null;
              const displayPrice = !p ? null : billingInterval==="monthly" ? p.monthly : billingInterval==="6month" ? p.six : p.annual;
              return (
                <motion.div key={tier.key} initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:0.45, delay:i*0.1 }}
                  style={{ position:"relative", display:"flex", flexDirection:"column", gap:20, padding:24, borderRadius:12, background:tier.highlight?"rgba(255,184,0,0.05)":"rgba(8,22,36,0.8)", border:`1px solid ${tier.highlight?"rgba(255,184,0,0.35)":`${tier.color}20`}`, boxShadow:tier.highlight?"0 0 40px rgba(255,184,0,0.06)":"none" }}>
                  {tier.highlight && <div style={{ position:"absolute", top:-20, left:"50%", transform:"translateX(-50%)", fontFamily:"DM Mono,monospace", fontSize:9, fontWeight:700, letterSpacing:"0.12em", padding:"3px 12px", borderRadius:20, background:"rgba(255,184,0,0.15)", border:"1px solid rgba(255,184,0,0.4)", color:"#FFB800", whiteSpace:"nowrap" }}>MOST POPULAR</div>}
                  <div>
                    <span style={{ fontFamily:"DM Mono,monospace", fontSize:10, fontWeight:700, letterSpacing:"0.12em", color:tier.color, background:`${tier.color}12`, border:`1px solid ${tier.color}30`, padding:"3px 8px", borderRadius:3 }}>{tier.label}</span>
                    {displayPrice ? (
                      <div style={{ marginTop:12 }}>
                        <span style={{ fontFamily:"DM Mono,monospace", fontSize:32, fontWeight:900, color:tier.color }}>${displayPrice}</span>
                        <span style={{ fontFamily:"DM Mono,monospace", fontSize:11, color:"rgba(138,170,187,0.6)" }}>/mo</span>
                      </div>
                    ) : (
                      <div style={{ fontFamily:"DM Mono,monospace", fontSize:32, fontWeight:900, color:tier.color, marginTop:12 }}>Free</div>
                    )}
                  </div>
                  <div style={{ height:1, background:`${tier.color}15` }} />
                  <ul style={{ display:"flex", flexDirection:"column", gap:8, flex:1 }}>
                    {tier.features.map(f => (
                      <li key={f} style={{ display:"flex", alignItems:"flex-start", gap:8, fontSize:12, color:"rgba(240,248,255,0.85)" }}>
                        <span style={{ color:tier.color, fontSize:10, marginTop:2, flexShrink:0, fontWeight:700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <a href={tier.price?"https://solbot.app/#pricing":"https://solbot.app/sign-in"}
                    style={{ display:"block", textAlign:"center", padding:"12px", borderRadius:8, fontFamily:"DM Mono,monospace", fontSize:12, fontWeight:700, textDecoration:"none", background:tier.highlight?`rgba(255,184,0,0.12)`:`${tier.color}10`, border:`1px solid ${tier.highlight?"rgba(255,184,0,0.5)":`${tier.color}40`}`, color:tier.color, transition:"all 0.15s" }}>
                    {tier.price ? `Subscribe — $${displayPrice}/mo` : "Start Free"}
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding:"40px 24px", borderTop:"1px solid rgba(0,245,160,0.08)", background:"rgba(1,6,14,0.98)" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <div>
            <div style={{ fontFamily:"DM Sans,sans-serif", fontWeight:800, fontSize:"1.1rem", color:"#F0F8FF" }}>SolChad</div>
            <div style={{ fontFamily:"DM Mono,monospace", fontSize:"0.6rem", letterSpacing:"0.15em", color:"rgba(138,170,187,0.5)", marginTop:4 }}>SolBot.app and SolChad.com are Divisions of USA Venture Group LLC</div>
          </div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            {[["https://solbot.app","SolBot.app"],["https://solbot.app/#pricing","Pricing"],["https://solbot.app/terms","Terms"],["https://solbot.app/privacy","Privacy"]].map(([href,label]) => (
              <a key={href} href={href} style={{ fontFamily:"DM Mono,monospace", fontSize:12, color:"rgba(138,170,187,0.6)", textDecoration:"none" }}>{label}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
