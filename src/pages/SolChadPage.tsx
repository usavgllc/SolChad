import React, { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

// ── Data ──────────────────────────────────────────────────────────────────────

const TEN_BOTS = [
  {
    num: "01", name: "Base Score Bot", tag: "SAFETY LAYER", color: "#00F5A0",
    desc: "Runs RugCheck, honeypot detection, and mint/freeze authority analysis on every candidate. Scores every token 0–100 before any other signal fires. If it fails here, it never reaches your bot.",
  },
  {
    num: "02", name: "Volume Momentum Bot", tag: "MOMENTUM", color: "#00C9FF",
    desc: "Tracks DexScreener price velocity and volume acceleration every 15 seconds. Fires a Negative Divergence signal the moment price stalls on sustained volume — your exit trigger before the chart moves.",
  },
  {
    num: "03", name: "Social Signal Bot", tag: "X SCOUT", color: "#FFB800",
    desc: "Runs X Scout legitimacy scoring on tokens clearing the safety threshold — a 5-dimension forensic analysis of every X account mentioning the token, powered by Claude AI. Applies a direct score bonus to tokens called by @SolBotChad.",
  },
  {
    num: "04", name: "Whale Detection Bot", tag: "WHALE INTEL", color: "#00C9FF",
    desc: "Dual-layer whale tracking. Layer 1: passive real-time alerts when a tracked high-conviction wallet buys — zero API cost. Layer 2: active scan of each token's recent transactions for smart-money buyers by SOL balance.",
  },
  {
    num: "05", name: "Graduation Signal Bot", tag: "BONDING CURVE", color: "#f5a623",
    desc: "Monitors every pump.fun bonding curve in real time via Helius gRPC. Scores each token's progress toward graduation (0–20 pts) and feeds it into the Confluence board. Tokens near the threshold get elevated signal weight.",
  },
  {
    num: "06", name: "Insider Clustering Bot", tag: "CLUSTER INTEL", color: "#00F5A0",
    desc: "Detects when 3 or more tracked profitable wallets buy the same token within a short window using in-memory whale-watcher events — zero API cost. When a cluster fires, the Confluence Score jumps immediately.",
  },
  {
    num: "07", name: "Time-Weighted Scoring Bot", tag: "SIGNAL FRESHNESS", color: "#00C9FF",
    desc: "Applies recency decay to every signal on the board. Volume spikes, price acceleration, and buy momentum are weighted by how recently they occurred — older signals are discounted automatically.",
  },
  {
    num: "08", name: "Developer Reputation Bot", tag: "DEV INTEL", color: "#FFB800",
    desc: "Scores the token deployer's full on-chain history — prior launch success rates, rug patterns, and wallet connections. Runs on tokens already clearing the safety score threshold to preserve RPC credits.",
  },
  {
    num: "09", name: "The Executioner", tag: "POSITION MANAGER", color: "#00F5A0",
    desc: "Watches the live Confluence Score for every open position every 10 seconds. Auto-exits on Confluence Collapse — when the score drops below 40% of the entry threshold. Takes a score-adaptive partial profit on Negative Divergence.",
  },
  {
    num: "10", name: "Early Momentum Executor", tag: "CHAD ONLY", color: "#9945FF",
    desc: "Fires immediately the moment P1 safety checks pass on a new launch — no queue, no polling delay. Detects velocity: 3+ unique wallets buying within 30 seconds, all below the 35 SOL bonding curve threshold. The peak SOL gate catches pump-and-dump retraces.",
  },
];

const XSCOUT_DIMS = [
  { label: "Social Graph Quality", pct: 25, detail: "KOL tier weights — named accounts, not follower counts. Solana co-founders, top traders, pump.fun team." },
  { label: "Forensic Account History", pct: 20, detail: "Account age vs. token launch timestamp. Dormancy spikes — old accounts suddenly active at launch are flagged." },
  { label: "Engagement Authenticity", pct: 20, detail: "RT-farm detection, spam ratio, shill phrase density, unique author ratio. Coordinated campaigns don't pass." },
  { label: "Professionalism", pct: 10, detail: "Verified badge, bio link health, ecosystem affiliation. Rugs don't have working websites." },
  { label: "Narrative + Claude AI", pct: 25, detail: "Claude Haiku analyzes up to 30 tweets: meme originality, community language, shill density. Returns STRONG / WATCH / RUG_FILTER." },
];

const RISK_ENGINE = [
  { title: "Confluence Collapse Exit", color: "#00F5A0", desc: "When the Confluence Score drops below 40% of the entry threshold, The Executioner auto-exits the full position. A 10-minute grace window applies after entry." },
  { title: "Negative Divergence Adaptive Exit", color: "#FFB800", desc: "Score-adaptive partial exit when price stalls on sustained volume while in profit. Score ≥75 exits 30%, lower conviction exits up to 60%." },
  { title: "Kelly Criterion Position Sizing", color: "#00C9FF", desc: "Position size calculated from your historical win rate and average payout ratio. Higher-confidence setups get larger allocations — the math decides, not sentiment." },
  { title: "Peak SOL Pump-and-Dump Gate", color: "#f5a623", desc: "Bot 10 tracks all-time high virtualSolReserves, not just current value. A token that ran to 60 SOL and dumped to 25 SOL looks early on a snapshot. The peak gate catches it." },
  { title: "Stop Loss + Trailing Moonbag", color: "#9945FF", desc: "Standard configurable stop loss on every position. High-conviction positions get a trailing stop — automatic moonbag management without watching the chart." },
  { title: "ConfluenceRadar Live Dashboard", color: "#00F5A0", desc: "10 signal badges per token with per-signal staleness. NEG DIV, @SolBotChad, and X Scout verdict badges. Live on web dashboard and SolBot mobile app." },
];

// ── Components ─────────────────────────────────────────────────────────────

function StatsTicker() {
  const items = [
    { label: "Tokens Scanned / Hr", value: "12,400+" },
    { label: "Scan Latency", value: "<200ms" },
    { label: "On-chain Pass Rate", value: "~3%" },
    { label: "Uptime", value: "99.9%" },
    { label: "Bots Per Subscriber", value: "10" },
    { label: "Position Checks / 10s", value: "All Open" },
    { label: "X Scout Dimensions", value: "5" },
    { label: "Chain", value: "Solana" },
  ];
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(0,245,160,0.1)", borderBottom: "1px solid rgba(0,245,160,0.1)", padding: "12px 0", background: "rgba(0,245,160,0.02)" }}>
      <div className="ticker-track" style={{ display: "flex", gap: 48, whiteSpace: "nowrap", width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: "#00F5A0" }}>{item.value}</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(138,170,187,0.6)" }}>{item.label}</span>
            <span style={{ color: "rgba(0,245,160,0.3)", marginLeft: 8 }}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function BotCard({ bot, index }: { bot: typeof TEN_BOTS[0]; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: (index % 3) * 0.07 }}
      style={{
        background: "rgba(6,16,28,0.85)",
        border: `1px solid ${bot.color}30`,
        borderRadius: 8,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 32, fontWeight: 900, color: `${bot.color}55`, lineHeight: 1 }}>{bot.num}</span>
        <span style={{ fontFamily: "DM Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", color: bot.color, background: `${bot.color}12`, border: `1px solid ${bot.color}25`, padding: "3px 8px", borderRadius: 3, whiteSpace: "nowrap" }}>{bot.tag}</span>
      </div>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#F0F8FF", marginBottom: 8 }}>{bot.name}</h3>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(138,170,187,0.85)" }}>{bot.desc}</p>
      </div>
    </motion.article>
  );
}

function SectionBadge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "5px 12px", borderRadius: 4, background: `${color}10`, border: `1px solid ${color}30`, fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color }}>
      {children}
    </span>
  );
}

function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: "linear-gradient(90deg, #00F5A0, #00C9FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
      {children}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolChadPage() {
  const [xScoutScore] = useState(81);

  return (
    <div style={{ minHeight: "100vh", background: "#020B14", color: "#F0F8FF", overflowX: "hidden" }}>

      {/* ── Header ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(2,11,20,0.88)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,245,160,0.08)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#F0F8FF", letterSpacing: "-0.5px" }}>SolChad</span>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(0,201,255,0.65)", marginTop: 3 }}>QUANTITATIVE EDGE</span>
          </div>
          <a
            href="https://solbot.app"
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 8, background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.25)", textDecoration: "none", transition: "all 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,245,160,0.14)"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = "rgba(0,245,160,0.08)"}
          >
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#00F5A0", letterSpacing: "1px" }}>SolBot</span>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.5rem", letterSpacing: "0.15em", color: "rgba(0,201,255,0.65)", marginTop: 3 }}>POWERED BY SOLCHAD</span>
            </div>
            <span style={{ color: "#00F5A0", fontSize: "0.85rem", opacity: 0.6 }}>→</span>
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "96px 24px 72px", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, background: "rgba(0,245,160,0.04)", borderRadius: "50%", filter: "blur(140px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", left: "20%", width: 400, height: 400, background: "rgba(0,201,255,0.035)", borderRadius: "50%", filter: "blur(100px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 760, textAlign: "center", position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          {/* Avatar */}
          <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 110, damping: 14 }}>
            <div className="avatar-glow" style={{ width: 140, height: 140, borderRadius: "50%", border: "2.5px solid #00F5A0", overflow: "hidden" }}>
              <img src="/solchad.png" alt="SolChad mascot — the quantitative trading edge behind SolBot" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00F5A0", display: "inline-block" }} />
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "#00F5A0", letterSpacing: "3px", fontWeight: 700 }}>SOLCHAD EDGE</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00F5A0", display: "inline-block" }} />
            </div>

            <h1 style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.9rem, 5vw, 3.4rem)", fontWeight: 800, color: "#F0F8FF", letterSpacing: "-1px", lineHeight: 1.12, textAlign: "center" }}>
              The Others Exit on Price.{" "}
              <GradientText>Chad Exits on Signal Deterioration.</GradientText>
            </h1>

            <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "rgba(138,170,187,0.9)", lineHeight: 1.7, maxWidth: 580, textAlign: "center" }}>
              Before the chart moves. Before the panic. A{" "}
              <strong style={{ color: "#F0F8FF" }}>10-bot quantitative trading desk</strong>{" "}
              runs 24/7 for each Chad subscriber — with a dedicated position manager that exits on Confluence Collapse, not on loss.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
              <a
                href="https://solbot.app/#pricing"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "linear-gradient(90deg, #00F5A0, #00C9FF)", color: "#020B14", fontSize: 14, fontWeight: 800, textDecoration: "none", transition: "filter 0.15s, transform 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.1)"; (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.filter = "none"; (e.currentTarget as HTMLAnchorElement).style.transform = "none"; }}
              >
                Upgrade to Chad — $349/mo →
              </a>
              <a
                href="https://solbot.app"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)", fontSize: 14, fontWeight: 600, textDecoration: "none" }}
              >
                Already on Chad? Open the app →
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <StatsTicker />

      {/* ── Section 1: Confluence Collapse ── */}
      <section id="confluence" style={{ padding: "96px 24px", position: "relative", overflow: "hidden" }} aria-labelledby="confluence-heading">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,245,160,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 32, position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <SectionBadge color="#00F5A0">THE PROFESSIONAL EDGE</SectionBadge>
            <h2 id="confluence-heading" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.8rem, 4.5vw, 3.2rem)", fontWeight: 800, color: "#F0F8FF", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              Normies Are Still Holding Onto Hope.{" "}
              <GradientText>Chad Already Left.</GradientText>
            </h2>
            <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "rgba(138,170,187,0.9)", lineHeight: 1.7, maxWidth: 680 }}>
              Price is a lagging indicator. By the time the chart breaks, the exit has already cost you. Bot 9 — The Executioner — watches the live Confluence Score for every open position every 10 seconds. The moment signals start collapsing, it sells. Before the chart moves. Before the Telegram channel panics.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(0,245,160,0.3)", background: "rgba(0,245,160,0.08)" }}>
            {[
              { label: "RETAIL TRADER", detail: "Watches price. Exits after the drop. Holds bags.", color: "rgba(138,170,187,0.82)" },
              { label: "STANDARD BOT", detail: "Exits on stop loss. Still reacts to price. Still late.", color: "#FFB800" },
              { label: "CHAD — BOT 9", detail: "Exits on Confluence Collapse. Before the price moves.", color: "#00F5A0" },
            ].map(row => (
              <div key={row.label} style={{ background: "rgba(2,11,20,0.75)", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: row.color }}>{row.label}</span>
                <p style={{ fontSize: 12, textAlign: "center", lineHeight: 1.6, color: "rgba(240,248,255,0.7)" }}>{row.detail}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section 2: Global Signal Cache ── */}
      <section id="infrastructure" style={{ padding: "96px 24px", background: "rgba(1,8,16,0.6)", borderTop: "1px solid rgba(0,201,255,0.08)", borderBottom: "1px solid rgba(0,201,255,0.08)", overflow: "hidden" }} aria-labelledby="infra-heading">
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64 }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 24 }}>
            <SectionBadge color="#00C9FF">THE INFRASTRUCTURE ADVANTAGE</SectionBadge>
            <h2 id="infra-heading" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#F0F8FF", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              Ten Bots. One Shared Ground Truth.
            </h2>
            <p style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", color: "rgba(138,170,187,0.9)", lineHeight: 1.7 }}>
              Every Chad subscriber's 10-bot team draws from the same{" "}
              <strong style={{ color: "#F0F8FF" }}>Global Signal Cache</strong>{" "}
              — updated continuously across all active tokens. No bot burns individual API rate limits. No subscriber waits for a stale feed.
            </p>
            <p style={{ fontSize: "clamp(0.9rem, 1.6vw, 1rem)", color: "rgba(138,170,187,0.8)", lineHeight: 1.7 }}>
              A single-user independent bot hitting DexScreener, X, and Helius directly runs into rate limits within minutes at Chad's scan volume. The shared cache removes that ceiling entirely.{" "}
              <strong style={{ color: "#F0F8FF" }}>No per-user bot can do this at any price.</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Bot 2 momentum refresh", value: "Every 15 seconds" },
                { label: "Bot 9 position evaluation", value: "Every 10 seconds" },
                { label: "API rate limits burned per subscriber", value: "Zero" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(0,201,255,0.1)" }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(138,170,187,0.7)" }}>{row.label}</span>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: "#00C9FF" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.15 }} style={{ flex: "1 1 320px" }}>
            <div style={{ background: "rgba(0,201,255,0.03)", border: "1px solid rgba(0,245,160,0.3)", borderRadius: 8, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00C9FF", display: "inline-block", animation: "pulse 2s infinite" }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#00C9FF" }}>GLOBAL SIGNAL CACHE — LIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { token: "BONK", score: 82, signals: ["GRAD", "WHALE", "SOC"], active: true },
                  { token: "PEPE2", score: 71, signals: ["CLUST", "MOM", "TW"], active: true },
                  { token: "CINO", score: 67, signals: ["GRAD", "DEV", "MOM"], active: true },
                  { token: "AISM", score: 44, signals: ["SOC"], active: false },
                ].map(row => (
                  <div key={row.token} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 4, background: "rgba(0,0,0,0.3)", border: `1px solid ${row.active ? "rgba(0,245,160,0.25)" : "rgba(138,170,187,0.08)"}` }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, fontWeight: 700, color: "#F0F8FF" }}>{row.token}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {row.signals.map(s => (
                        <span key={s} style={{ fontFamily: "DM Mono, monospace", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 2, background: row.active ? "rgba(0,245,160,0.12)" : "rgba(138,170,187,0.06)", color: row.active ? "#00F5A0" : "rgba(138,170,187,0.6)" }}>{s}</span>
                      ))}
                    </div>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, fontWeight: 700, color: row.score > 70 ? "#00F5A0" : row.score > 50 ? "#FFB800" : "rgba(138,170,187,0.7)" }}>{row.score}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 12, textAlign: "center", color: "rgba(138,170,187,0.55)" }}>Shared across all Chad subscribers · Signals updated continuously</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 3: X Scout ── */}
      <section id="xscout" style={{ padding: "96px 24px", position: "relative", overflow: "hidden" }} aria-labelledby="xscout-heading">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(255,184,0,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 64, position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7 }} style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: 24 }}>
            <SectionBadge color="#FFB800">BOT 03 — X SCOUT INTELLIGENCE</SectionBadge>
            <h2 id="xscout-heading" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 800, color: "#F0F8FF", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              5-Dimension X Forensics. Powered by Claude AI.
            </h2>
            <p style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", color: "rgba(138,170,187,0.9)", lineHeight: 1.7 }}>
              X Scout doesn't just count mentions. It runs a forensic legitimacy analysis across five dimensions on every X account talking about a token — and sends them to{" "}
              <strong style={{ color: "#F0F8FF" }}>Claude AI</strong>{" "}
              for narrative and shill detection that no rule-based system can match.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {XSCOUT_DIMS.map(dim => (
                <div key={dim.label} style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 0", borderBottom: "1px solid rgba(255,184,0,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 12, fontWeight: 700, color: "#FFB800" }}>{dim.label}</span>
                    <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(255,184,0,0.6)" }}>{dim.pct}%</span>
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(138,170,187,0.75)", lineHeight: 1.5 }}>{dim.detail}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.7, delay: 0.15 }} style={{ flex: "1 1 320px" }}>
            <div style={{ background: "rgba(255,184,0,0.03)", border: "1px solid rgba(255,184,0,0.25)", borderRadius: 8, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFB800", display: "inline-block" }} />
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#FFB800" }}>X SCOUT — LIVE ANALYSIS</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 4, background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.25)", marginBottom: 16 }}>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 13, fontWeight: 700, color: "#F0F8FF" }}>$EXAMPLE</span>
                <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 3, background: "rgba(0,245,160,0.15)", color: "#00F5A0" }}>🔥 STRONG — {xScoutScore}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { dim: "Social Graph", score: 78, note: "KOL mention: @blknoiz06" },
                  { dim: "Forensics", score: 90, note: "Account history organic" },
                  { dim: "Engagement", score: 74, note: "High unique author ratio" },
                  { dim: "Narrative (Claude)", score: 82, note: "Original memes, real lore building" },
                ].map(d => (
                  <div key={d.dim} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, color: "rgba(138,170,187,0.7)" }}>{d.dim}</span>
                      <span style={{ fontFamily: "DM Mono, monospace", fontSize: 11, fontWeight: 700, color: d.score >= 75 ? "#00F5A0" : "#FFB800" }}>{d.score}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", width: `${d.score}%`, borderRadius: 2, background: d.score >= 75 ? "linear-gradient(90deg, #00F5A0, #00C9FF)" : "#FFB800", transition: "width 0.6s ease" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(138,170,187,0.5)" }}>{d.note}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "DM Mono, monospace", fontSize: 10, marginTop: 12, textAlign: "center", color: "rgba(138,170,187,0.5)" }}>Only fires on tokens pre-scoring ≥60 · Claude AI narrative analysis</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 4: All 10 Bots ── */}
      <section id="bots" style={{ padding: "96px 24px", background: "rgba(1,8,16,0.5)", borderTop: "1px solid rgba(0,201,255,0.08)" }} aria-labelledby="bots-heading">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(138,170,187,0.65)" }}>THE CHAD BOT TEAM</span>
            <h2 id="bots-heading" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#F0F8FF", marginTop: 12, letterSpacing: "-0.5px", lineHeight: 1.15 }}>
              Ten Specialized Bots.{" "}
              <GradientText>All Running for You.</GradientText>
            </h2>
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: 13, marginTop: 12, maxWidth: 520, margin: "12px auto 0", color: "rgba(138,170,187,0.75)" }}>
              Each Chad subscriber gets all 10 bots running in parallel — a dedicated team, not a shared queue.
            </p>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {TEN_BOTS.slice(0, 9).map((bot, i) => <BotCard key={bot.num} bot={bot} index={i} />)}
            <div style={{ gridColumn: "2 / 3" }}><BotCard bot={TEN_BOTS[9]} index={9} /></div>
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ padding: "64px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "28px 32px", borderRadius: 8, background: "linear-gradient(135deg, rgba(0,245,160,0.06) 0%, rgba(0,201,255,0.06) 100%)", border: "1px solid rgba(0,245,160,0.3)" }}>
          <div>
            <span style={{ fontFamily: "DM Mono, monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: "rgba(0,245,160,0.6)" }}>SOLCHAD EDGE</span>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "1.1rem", color: "#F0F8FF", marginTop: 6, lineHeight: 1.4 }}>Ready to deploy your 10-bot trading team?</p>
          </div>
          <a
            href="https://solbot.app/#pricing"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 10, background: "linear-gradient(90deg, #00F5A0, #00C9FF)", color: "#020B14", fontSize: 14, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap", transition: "filter 0.15s" }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.1)"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.filter = "none"}
          >
            Upgrade to Chad — $349/mo →
          </a>
        </div>
      </motion.section>

      {/* ── Section 5: Risk Engine ── */}
      <section id="risk" style={{ padding: "96px 24px", position: "relative", overflow: "hidden" }} aria-labelledby="risk-heading">
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 40%, rgba(0,201,255,0.04) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionBadge color="#00C9FF">RISK MANAGEMENT ENGINE</SectionBadge>
            <h2 id="risk-heading" style={{ fontFamily: "DM Sans, sans-serif", fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)", fontWeight: 800, color: "#F0F8FF", marginTop: 16, letterSpacing: "-0.5px" }}>
              Six Systems. One Goal:{" "}
              <GradientText>Keep Your Capital.</GradientText>
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {RISK_ENGINE.map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 3) * 0.07 }} style={{ background: "rgba(6,16,28,0.85)", border: `1px solid ${item.color}28`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, display: "inline-block", flexShrink: 0 }} />
                  <h3 style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 700, color: item.color }}>{item.title}</h3>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(138,170,187,0.85)" }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid rgba(0,245,160,0.08)", background: "rgba(1,6,14,0.98)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#F0F8FF" }}>SolChad</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(138,170,187,0.5)", marginTop: 4 }}>SolBot.app and SolChad.com are Divisions of USA Venture Group LLC</div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <a href="https://solbot.app" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(138,170,187,0.6)", textDecoration: "none" }}>SolBot.app</a>
            <a href="https://solbot.app/#pricing" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(138,170,187,0.6)", textDecoration: "none" }}>Pricing</a>
            <a href="https://solbot.app/terms" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(138,170,187,0.6)", textDecoration: "none" }}>Terms</a>
            <a href="https://solbot.app/privacy" style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "rgba(138,170,187,0.6)", textDecoration: "none" }}>Privacy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
