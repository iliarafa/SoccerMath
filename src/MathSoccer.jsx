import { useState, useEffect, useRef, useCallback } from "react";

const GOAL_AT = 5;
const WIN_AT = 3;
const BOT = {
  easy: { min: 4000, max: 7000, err: 0.35 },
  medium: { min: 2200, max: 4500, err: 0.15 },
  hard: { min: 1000, max: 2200, err: 0.05 },
};

const genProblem = () => {
  const ops = ["+", "−", "×"];
  const op = ops[Math.floor(Math.random() * 3)];
  let a, b, ans;
  if (op === "+") { a = 10 + Math.floor(Math.random() * 80); b = 10 + Math.floor(Math.random() * 80); ans = a + b; }
  else if (op === "−") { a = 20 + Math.floor(Math.random() * 80); b = 1 + Math.floor(Math.random() * a); ans = a - b; }
  else { a = 2 + Math.floor(Math.random() * 12); b = 2 + Math.floor(Math.random() * 12); ans = a * b; }
  return { a, b, op, ans };
};

// Player formation positions (percentage-based on field)
// Red team (left/P1): GK, 2 DEF, 2 MID, 1 FWD
const RED_BASE = [
  { x: 6, y: 50 },
  { x: 22, y: 28 }, { x: 22, y: 72 },
  { x: 40, y: 35 }, { x: 40, y: 65 },
  { x: 55, y: 50 },
];
// Blue team (right/P2): GK, 2 DEF, 2 MID, 1 FWD
const BLUE_BASE = [
  { x: 94, y: 50 },
  { x: 78, y: 28 }, { x: 78, y: 72 },
  { x: 60, y: 35 }, { x: 60, y: 65 },
  { x: 45, y: 50 },
];

const getFormation = (base, possession, streak, isAttacking) => {
  const shift = isAttacking ? (streak / GOAL_AT) * 18 : -(streak / GOAL_AT) * 12;
  return base.map((p, i) => ({
    x: Math.min(94, Math.max(6, p.x + (i === 0 ? shift * 0.3 : shift))),
    y: p.y + (Math.sin(Date.now() / 1200 + i * 1.5) * 1.5),
  }));
};

export default function MathSoccer() {
  const [screen, setScreen] = useState("menu");
  const [vsMode, setVsMode] = useState(null);
  const [diff, setDiff] = useState("medium");
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [poss, setPoss] = useState(null);
  const [streak, setStreak] = useState(0);
  const [prob, setProb] = useState(null);
  const [input, setInput] = useState("");
  const [msg, setMsg] = useState("");
  const [active, setActive] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [goalAnim, setGoalAnim] = useState(false);
  const [goalSide, setGoalSide] = useState(null);
  const [winner, setWinner] = useState(null);
  const [showKickoff, setShowKickoff] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [tick, setTick] = useState(0);
  const [negative, setNegative] = useState(false);

  const botTimer = useRef(null);
  const activeRef = useRef(false);
  const probRef = useRef(null);
  const possRef = useRef(null);
  const streakRef = useRef(0);
  const scoresRef = useRef({ p1: 0, p2: 0 });
  const vsModeRef = useRef(null);
  const animFrame = useRef(null);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { probRef.current = prob; }, [prob]);
  useEffect(() => { possRef.current = poss; }, [poss]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { scoresRef.current = scores; }, [scores]);
  useEffect(() => { vsModeRef.current = vsMode; }, [vsMode]);

  // Animation tick for player sway
  useEffect(() => {
    if (screen !== "playing") return;
    const id = setInterval(() => setTick(t => t + 1), 400);
    return () => clearInterval(id);
  }, [screen]);

  const p2Label = vsMode === "bot" ? "BOT" : "P2";

  const startRound = useCallback(() => {
    const p = genProblem();
    setProb(p);
    probRef.current = p;
    setInput("");
    setNegative(false);
    setActive(true);
    activeRef.current = true;
    setMsg("");
    setWrongShake(false);

    if (vsModeRef.current === "bot") {
      const d = BOT[diff] || BOT.medium;
      const delay = d.min + Math.random() * (d.max - d.min);
      if (botTimer.current) clearTimeout(botTimer.current);
      botTimer.current = setTimeout(() => {
        if (!activeRef.current) return;
        if (Math.random() > d.err) {
          processAnswer("p2", probRef.current?.ans);
        }
      }, delay);
    }
  }, [diff]);

  const processAnswer = useCallback((player, val) => {
    if (!activeRef.current || !probRef.current) return;
    const num = parseInt(val);
    if (isNaN(num)) return;
    if (num !== probRef.current.ans) {
      setWrongShake(true);
      setTimeout(() => setWrongShake(false), 500);
      setInput("");
      setNegative(false);

      // Wrong answer = turnover to the OTHER player
      const other = player === "p1" ? "p2" : "p1";
      setActive(false);
      activeRef.current = false;
      if (botTimer.current) clearTimeout(botTimer.current);

      setPoss(other);
      possRef.current = other;
      setStreak(1);
      streakRef.current = 1;

      const otherName = other === "p1" ? "P1" : p2Label;
      setMsg(`Wrong! ${otherName} takes over!`);

      setTimeout(() => startRound(), 1000);
      return;
    }

    setActive(false);
    activeRef.current = false;
    if (botTimer.current) clearTimeout(botTimer.current);

    const curPoss = possRef.current;
    const curStreak = streakRef.current;
    let newPoss, newStreak;

    if (curPoss === null || curPoss !== player) {
      newPoss = player;
      newStreak = 1;
      const name = player === "p1" ? "P1" : p2Label;
      setMsg(`${name} INTERCEPTS!`);
    } else {
      newPoss = curPoss;
      newStreak = curStreak + 1;
    }

    setPoss(newPoss);
    possRef.current = newPoss;
    setStreak(newStreak);
    streakRef.current = newStreak;

    if (newStreak >= GOAL_AT) {
      const ns = { ...scoresRef.current };
      ns[player]++;
      setScores(ns);
      scoresRef.current = ns;
      setGoalAnim(true);
      setGoalSide(player);
      setMsg("GOAL!");

      if (ns[player] >= WIN_AT) {
        setTimeout(() => {
          setGoalAnim(false);
          setWinner(player);
          setScreen("gameover");
        }, 2800);
        return;
      }

      setTimeout(() => {
        setGoalAnim(false);
        setGoalSide(null);
        setPoss(null);
        possRef.current = null;
        setStreak(0);
        streakRef.current = 0;
        setShowKickoff(true);
        setTimeout(() => {
          setShowKickoff(false);
          startRound();
        }, 1200);
      }, 2500);
      return;
    }

    setTimeout(() => startRound(), 800);
  }, [p2Label, startRound]);

  const handleNumpad = (val) => {
    if (!active) return;
    if (val === "clear") { setInput(""); setNegative(false); return; }
    if (val === "neg") { setNegative(n => !n); return; }
    if (val === "submit") {
      const finalVal = negative ? `-${input}` : input;
      processAnswer("p1", finalVal);
      return;
    }
    if (input.length < 5) setInput(prev => prev + val);
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (screen !== "playing" || !activeRef.current) return;
      if (e.key >= "0" && e.key <= "9") handleNumpad(e.key);
      else if (e.key === "Backspace") setInput(prev => prev.slice(0, -1));
      else if (e.key === "Enter") {
        const finalVal = negative ? `-${input}` : input;
        processAnswer("p1", finalVal);
      }
      else if (e.key === "-") setNegative(n => !n);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, input, negative, processAnswer]);

  const beginGame = (mode, difficulty) => {
    setVsMode(mode);
    vsModeRef.current = mode;
    setDiff(difficulty || "medium");
    setScores({ p1: 0, p2: 0 });
    scoresRef.current = { p1: 0, p2: 0 };
    setPoss(null);
    possRef.current = null;
    setStreak(0);
    streakRef.current = 0;
    setGoalAnim(false);
    setGoalSide(null);
    setWinner(null);
    setInput("");
    setNegative(false);
    setScreen("playing");
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { setCountdown(null); startRound(); return; }
    const t = setTimeout(() => setCountdown(countdown - 1), 800);
    return () => clearTimeout(t);
  }, [countdown, startRound]);

  useEffect(() => {
    return () => { if (botTimer.current) clearTimeout(botTimer.current); };
  }, []);

  // Ball position on field
  const ballX = poss === "p1"
    ? 50 + (streak / GOAL_AT) * 40
    : poss === "p2"
      ? 50 - (streak / GOAL_AT) * 40
      : 50;
  const ballY = 50;

  // --- MENU ---
  if (screen === "menu") {
    return (
      <div style={S.wrap}>
        <style>{globalCSS}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease-out" }}>
          <div style={S.menuBall}>⚽</div>
          <h1 style={S.title}>MATH<br/>SOCCER</h1>
          <p style={S.subtitle}>ANSWER FAST · SCORE GOALS</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "center", marginTop: 40 }}>
            <button onClick={() => { setVsMode("bot"); setScreen("difficulty"); }} style={{ ...S.btn, borderColor: "#22c55e", color: "#16a34a" }}
              onMouseEnter={e => e.target.style.background = "#22c55e15"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >VS BOT</button>
            <button onClick={() => beginGame("human")} style={{ ...S.btn, borderColor: "#fbbf24", color: "#fbbf24" }}
              onMouseEnter={e => e.target.style.background = "#fbbf2415"}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >VS HUMAN</button>
          </div>

          <button
            onClick={() => setScreen("rules")}
            style={{ ...S.link, color: "#ffffff", marginTop: 24 }}
          >HOW TO PLAY</button>
        </div>
      </div>
    );
  }

  // --- DIFFICULTY ---
  if (screen === "difficulty") {
    return (
      <div style={S.wrap}>
        <style>{globalCSS}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease-out" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: 3, marginBottom: 36, color: "#1e293b" }}>DIFFICULTY</h2>
          {[["easy", "EASY", "#22c55e"], ["medium", "MEDIUM", "#f59e0b"], ["hard", "HARD", "#ef4444"]].map(([k, l, c]) => (
            <button key={k} onClick={() => beginGame("bot", k)} style={{ ...S.btn, borderColor: c, color: c, marginBottom: 12 }}
              onMouseEnter={e => e.target.style.background = `${c}15`}
              onMouseLeave={e => e.target.style.background = "transparent"}
            >{l}</button>
          ))}
          <br />
          <button onClick={() => setScreen("menu")} style={S.link}>← BACK</button>
        </div>
      </div>
    );
  }

  // --- RULES ---
  if (screen === "rules") {
    return (
      <div style={S.wrap}>
        <style>{globalCSS}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease-out", maxWidth: 320 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: 3, marginBottom: 36, color: "#ffffff" }}>HOW TO PLAY</h2>
          <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 2.2, textAlign: "left" }}>
            Solve math problems faster than your opponent.<br/><br/>
            Fastest correct answer → ball possession.<br/><br/>
            5 consecutive answers → ⚽ GOAL!<br/><br/>
            One interception resets the streak.<br/><br/>
            First to {WIN_AT} goals wins the match.
          </div>
          <br />
          <button onClick={() => setScreen("menu")} style={S.link}>← BACK</button>
        </div>
      </div>
    );
  }

  // --- GAME OVER ---
  if (screen === "gameover") {
    const w = winner === "p1" ? "PLAYER 1" : (vsMode === "bot" ? "BOT" : "PLAYER 2");
    return (
      <div style={S.wrap}>
        <style>{globalCSS}</style>
        <div style={{ textAlign: "center", animation: "fadeUp 0.6s ease-out" }}>
          <div style={{ fontSize: 72, marginBottom: 12 }}>🏆</div>
          <div style={S.finalScore}>{scores.p1} : {scores.p2}</div>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#16a34a", letterSpacing: 3, marginBottom: 36 }}>{w} WINS</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <button onClick={() => beginGame(vsMode, diff)} style={{ ...S.btn, borderColor: "#22c55e", color: "#16a34a", padding: "12px 32px" }}>REMATCH</button>
            <button onClick={() => setScreen("menu")} style={{ ...S.btn, borderColor: "#cbd5e1", color: "#64748b", padding: "12px 32px" }}>MENU</button>
          </div>
        </div>
      </div>
    );
  }

  // --- PLAYING ---
  const redPlayers = getFormation(RED_BASE, poss, streak, poss === "p1");
  const bluePlayers = getFormation(BLUE_BASE, poss, streak, poss === "p2");

  return (
    <div style={S.wrap}>
      <style>{globalCSS}</style>

      <div style={S.gameContainer}>
        <div style={S.gameInner}>

        {/* SCOREBOARD */}
        <div style={S.scoreboard}>
          <div style={{ ...S.scoreTeam, color: poss === "p1" ? "#1e293b" : "#94a3b8" }}>
            <div style={S.scoreLabel}>P1</div>
            <div style={S.scoreNum}>{scores.p1}</div>
          </div>
          <div style={S.scoreDivider}>:</div>
          <div style={{ ...S.scoreTeam, color: poss === "p2" ? "#1e293b" : "#94a3b8" }}>
            <div style={S.scoreNum}>{scores.p2}</div>
            <div style={S.scoreLabel}>{p2Label}</div>
          </div>
        </div>

        {/* STREAK INDICATOR */}
        <div style={S.streakBar}>
          {Array.from({ length: GOAL_AT }).map((_, i) => {
            const filled = poss === "p2" && i < streak;
            return <div key={`l${i}`} style={{
              ...S.streakDot,
              background: filled ? "#3b82f6" : "#e2e8f0",
              boxShadow: filled ? "0 0 8px #3b82f660" : "none",
            }} />;
          }).reverse()}
          <div style={{ ...S.streakDot, width: 8, height: 8, background: "#94a3b8", boxShadow: "0 0 6px #94a3b860" }}>⚽</div>
          {Array.from({ length: GOAL_AT }).map((_, i) => {
            const filled = poss === "p1" && i < streak;
            return <div key={`r${i}`} style={{
              ...S.streakDot,
              background: filled ? "#22c55e" : "#e2e8f0",
              boxShadow: filled ? "0 0 8px #22c55e60" : "none",
            }} />;
          })}
        </div>

        {/* FIELD */}
        <div style={S.field}>
          {/* grass stripes */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${i * 12.5}%`, width: "12.5%",
              background: i % 2 === 0 ? "#2d8a3e" : "#34993f",
            }} />
          ))}
          {/* Field lines */}
          <div style={S.fieldBorder} />
          <div style={S.centerLine} />
          <div style={S.centerCircle} />
          <div style={S.centerDot} />
          {/* Penalty areas */}
          <div style={{ ...S.penaltyBox, left: 0 }} />
          <div style={{ ...S.penaltyBox, right: 0 }} />
          {/* Goal areas */}
          <div style={{ ...S.goalBox, left: 0 }} />
          <div style={{ ...S.goalBox, right: 0 }} />
          {/* Goals */}
          <div style={{ ...S.goalNet, left: -6 }} />
          <div style={{ ...S.goalNet, right: -6 }} />

          {/* Players - Red (P1) */}
          {redPlayers.map((p, i) => (
            <div key={`r${i}`} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              width: i === 0 ? 14 : 12, height: i === 0 ? 14 : 12,
              borderRadius: "50%",
              background: i === 0 ? "#dc2626" : "#ef4444",
              border: "2px solid #fca5a5",
              boxShadow: "0 2px 4px #00000060",
              transition: "left 0.6s ease, top 0.6s ease",
              zIndex: 3,
            }} />
          ))}

          {/* Players - Blue (P2/Bot) */}
          {bluePlayers.map((p, i) => (
            <div key={`b${i}`} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              width: i === 0 ? 14 : 12, height: i === 0 ? 14 : 12,
              borderRadius: "50%",
              background: i === 0 ? "#1d4ed8" : "#3b82f6",
              border: "2px solid #93c5fd",
              boxShadow: "0 2px 4px #00000060",
              transition: "left 0.6s ease, top 0.6s ease",
              zIndex: 3,
            }} />
          ))}

          {/* Ball */}
          <div style={{
            position: "absolute",
            left: `${ballX}%`, top: `${ballY}%`,
            transform: "translate(-50%, -50%)",
            fontSize: 16, zIndex: 5,
            transition: "left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            filter: "drop-shadow(0 2px 3px #00000080)",
          }}>⚽</div>

          {/* Goal animation overlay */}
          {goalAnim && (
            <div style={S.goalOverlay}>
              <div style={S.goalText}>GOAL!</div>
            </div>
          )}

        </div>

        {/* MESSAGE */}
        <div style={S.msgBar}>
          {msg && !goalAnim && countdown === null && (
            <span style={{ animation: "fadeUp 0.3s ease-out" }}>{msg}</span>
          )}
        </div>

        {/* PROBLEM + ANSWER */}
        {countdown !== null && !goalAnim && (
          <div style={S.problemArea}>
            <div style={S.countdownText}>
              {countdown || "GO!"}
            </div>
          </div>
        )}
        {prob && countdown === null && !goalAnim && (
          <div style={S.problemArea}>
            <div style={S.problemText}>
              {prob.a} {prob.op} {prob.b}
            </div>
          </div>
        )}
        </div>{/* end gameInner */}

        {/* NUMPAD WITH INPUT */}
        {!goalAnim && (
          <div style={S.numpad}>
            {/* Answer display row */}
            <div style={{
              ...S.answerDisplay,
              animation: wrongShake ? "shake 0.3s ease" : "none",
              background: wrongShake ? "#ffcdd2" : "#f5f5f5",
            }}>
              {negative && input.length > 0 ? "−" : ""}{input || " "}
              <button
                onClick={() => handleNumpad("clear")}
                style={S.answerClear}
              >
                ✕
              </button>
            </div>
            {/* Number rows */}
            {[
              ["7", "8", "9"],
              ["4", "5", "6"],
              ["1", "2", "3"],
              ["neg", "0", "submit"],
            ].map((row, ri) => (
              <div key={ri} style={S.numpadRow}>
                {row.map((key) => {
                  const isSubmit = key === "submit";
                  const isNeg = key === "neg";
                  return (
                    <button
                      key={key}
                      onClick={() => handleNumpad(key)}
                      disabled={!active}
                      style={{
                        ...S.numKey,
                        ...(isSubmit ? S.numKeySubmit : {}),
                        ...(isNeg ? S.numKeyClear : {}),
                        opacity: !active ? 0.5 : 1,
                      }}
                    >
                      {isSubmit ? "⚽" : isNeg ? "±" : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* VS HUMAN note */}
        {vsMode === "human" && countdown === null && !goalAnim && (
          <div style={{ textAlign: "center", marginTop: 4, fontFamily: MONO, fontSize: 10, color: "#64748b", flexShrink: 0, padding: "0 8px" }}>
            P2: use keyboard (numbers + Enter)
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 6, flexShrink: 0, padding: "0 8px" }}>
          <button onClick={() => {
            if (botTimer.current) clearTimeout(botTimer.current);
            setActive(false); activeRef.current = false;
            setScreen("menu");
          }} style={S.link}>QUIT</button>
        </div>
      </div>
    </div>
  );
}

// ============ STYLES ============
const FONT = `'Marcellus', serif`;
const MONO = `'Marcellus', serif`;

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Marcellus&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body, #root { height: 100%; overflow: hidden; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-6px); } 75% { transform:translateX(6px); } }
  @keyframes goalPulse { 0% { transform:translate(-50%,-50%) scale(0.3); opacity:0; } 50% { transform:translate(-50%,-50%) scale(1.1); opacity:1; } 100% { transform:translate(-50%,-50%) scale(1); opacity:1; } }
  @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
`;

const S = {
  wrap: {
    width: "100%", height: "100vh", background: "#001e00",
    fontFamily: FONT, color: "#1e293b", display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "env(safe-area-inset-top, 12px) 0 env(safe-area-inset-bottom, 12px) 0",
    userSelect: "none", overflow: "hidden",
  },
  menuBall: {
    fontSize: 56, marginBottom: 8,
  },
  title: {
    fontSize: 64, fontWeight: 800, letterSpacing: 6, lineHeight: 1.05,
    color: "#ffffff", marginBottom: 8,
  },
  subtitle: {
    fontFamily: MONO, fontSize: 11, letterSpacing: 3, color: "#60a5fa",
  },
  btn: {
    fontFamily: FONT, fontSize: 18, fontWeight: 700, letterSpacing: 3,
    padding: "14px 48px", border: "2px solid", borderRadius: 6,
    background: "transparent", cursor: "pointer", width: 240,
    transition: "all 0.15s",
  },
  link: {
    fontFamily: MONO, fontSize: 12, background: "none", border: "none",
    color: "#64748b", cursor: "pointer", letterSpacing: 1, padding: 8,
  },
  rules: {
    marginTop: 36, padding: "16px 24px", background: "#f1f5f9",
    borderRadius: 10, maxWidth: 320, textAlign: "left", margin: "36px auto 0",
    fontFamily: MONO, fontSize: 11, color: "#475569", lineHeight: 1.6,
  },
  rulesTitle: {
    fontFamily: FONT, fontSize: 13, letterSpacing: 2, color: "#16a34a",
    marginBottom: 8, fontWeight: 700,
  },
  // Game container for playing screen
  gameContainer: {
    width: "100%", maxWidth: 420, padding: "0",
    display: "flex", flexDirection: "column",
    height: "100%", overflow: "hidden",
  },
  // Inner padding for non-numpad elements
  gameInner: {
    padding: "16px 8px 0",
  },
  // Scoreboard
  scoreboard: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "4px 0 0", gap: 0, flexShrink: 0,
  },
  scoreTeam: {
    display: "flex", alignItems: "center", gap: 8, flex: 1,
    justifyContent: "center",
  },
  scoreLabel: {
    fontSize: 12, fontWeight: 700, letterSpacing: 2, opacity: 0.6,
  },
  scoreNum: {
    fontSize: 44, fontWeight: 700, fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1,
  },
  scoreDivider: {
    fontSize: 36, fontWeight: 800, color: "#94a3b8", padding: "0 4px",
  },
  // Streak bar
  streakBar: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 5, padding: "16px 0", flexShrink: 0,
  },
  streakDot: {
    width: 12, height: 12, borderRadius: 2,
    transition: "all 0.3s", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 7,
  },
  streakDotEmpty: "#e2e8f0",
  // Field
  field: {
    position: "relative", width: "100%", paddingBottom: "52%",
    borderRadius: 8, overflow: "hidden",
    boxShadow: "0 4px 24px #00000040, inset 0 0 40px #00000020",
    border: "3px solid #1e5631", flexShrink: 0,
  },
  fieldBorder: {
    position: "absolute", top: "4%", left: "3%", right: "3%", bottom: "4%",
    border: "2px solid rgba(255,255,255,0.35)", zIndex: 2,
  },
  centerLine: {
    position: "absolute", top: "4%", bottom: "4%", left: "50%",
    width: 2, background: "rgba(255,255,255,0.3)", transform: "translateX(-50%)",
    zIndex: 2,
  },
  centerCircle: {
    position: "absolute", top: "50%", left: "50%", width: "18%", height: "30%",
    border: "2px solid rgba(255,255,255,0.3)", borderRadius: "50%",
    transform: "translate(-50%,-50%)", zIndex: 2,
  },
  centerDot: {
    position: "absolute", top: "50%", left: "50%", width: 6, height: 6,
    background: "rgba(255,255,255,0.4)", borderRadius: "50%",
    transform: "translate(-50%,-50%)", zIndex: 2,
  },
  penaltyBox: {
    position: "absolute", top: "20%", width: "16%", height: "60%",
    border: "2px solid rgba(255,255,255,0.3)", zIndex: 2,
  },
  goalBox: {
    position: "absolute", top: "32%", width: "8%", height: "36%",
    border: "2px solid rgba(255,255,255,0.25)", zIndex: 2,
  },
  goalNet: {
    position: "absolute", top: "38%", width: 6, height: "24%",
    background: "rgba(255,255,255,0.15)", zIndex: 2, borderRadius: 2,
  },
  goalOverlay: {
    position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)",
    zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center",
  },
  goalText: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    fontSize: 48, fontWeight: 800, letterSpacing: 6,
    color: "#fff", textShadow: "0 0 30px #fbbf24, 0 0 60px #f59e0b40",
    animation: "goalPulse 0.6s ease-out",
    fontFamily: FONT,
  },
  // Message
  msgBar: {
    textAlign: "center", height: 18, marginTop: 4,
    fontFamily: MONO, fontSize: 11, letterSpacing: 1, color: "#64748b",
    flexShrink: 0,
  },
  // Problem area
  problemArea: {
    textAlign: "center", padding: "12px 0 30px", flexShrink: 0,
  },
  problemText: {
    fontSize: 32, fontWeight: 700, fontFamily: "system-ui, -apple-system, sans-serif",
    letterSpacing: 2, color: "#1e293b",
  },
  countdownText: {
    fontSize: 32, fontWeight: 700, fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#ef4444", letterSpacing: 2,
    animation: "fadeUp 0.3s ease-out",
  },
  answerDisplay: {
    margin: "4px 0 0", width: "100%", padding: "12px 16px",
    fontSize: 28, fontWeight: 400, fontFamily: "system-ui, -apple-system, sans-serif", textAlign: "center",
    background: "#f5f5f5", borderRadius: 0, border: "1px solid #e0e0e0",
    color: "#1e293b", minHeight: 50, lineHeight: "28px",
    position: "relative",
  },
  answerClear: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    width: 32, height: 32, borderRadius: "50%", border: "2px solid #9e9e9e",
    background: "transparent", color: "#9e9e9e", fontSize: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  },
  // Numpad
  numpad: {
    width: "100%", margin: "0", flexShrink: 0,
  },
  numpadRow: {
    display: "flex", gap: 0, marginBottom: 0, justifyContent: "center",
  },
  numKey: {
    flex: 1, height: 56, fontSize: 28, fontWeight: 400,
    fontFamily: "system-ui, -apple-system, sans-serif", border: "1px solid #e0e0e0", borderRadius: 0,
    background: "#ffffff", color: "#1e293b", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.1s", lineHeight: 1,
    WebkitTapHighlightColor: "transparent",
  },
  numKeySubmit: {
    background: "#374151", borderColor: "#374151", color: "#ffffff", fontSize: 24,
  },
  numKeyClear: {
    color: "#1e293b", fontSize: 24,
  },
  finalScore: {
    fontSize: 72, fontWeight: 700, fontFamily: "system-ui, -apple-system, sans-serif", margin: "16px 0",
    color: "#1e293b", letterSpacing: 4,
  },
};
