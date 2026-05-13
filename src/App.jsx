import { useState, useEffect,useRef } from "react";
import {
  registerUser, loginUser,
  fetchMovies, fetchMovie,
  saveLog, fetchUserLogs, deleteLog,
  sendChatMessage, getRecommendations
} from "./api";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0c0c10;
    --bg2:       #13131a;
    --bg3:       #1a1a24;
    --bg4:       #22222f;
    --border:    #2a2a3a;
    --border2:   #353548;
    --cream:     #ede8df;
    --cream2:    #c8c0b0;
    --muted:     #7a7590;
    --dim:       #4a4760;
    --rose:      #c4748a;
    --rose2:     #e8a0b4;
    --rose-bg:   rgba(196,116,138,0.12);
    --serif:     'DM Serif Display', Georgia, serif;
    --sans:      'DM Sans', system-ui, sans-serif;
  }

  html, body, #root { height: 100%; }
  body {
    background: var(--bg);
    color: var(--cream);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  button, input, textarea, select { font-family: var(--sans); }
  input, textarea { outline: none; }

  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up   { animation: fadeUp 0.45s ease both; }
  .fade-up-2 { animation: fadeUp 0.45s 0.08s ease both; }
  .fade-up-3 { animation: fadeUp 0.45s 0.16s ease both; }

  body::after {
    content: '';
    position: fixed; inset: 0; z-index: 9999;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.025;
  }
`;

const GENRES = ["All", "Action", "Comedy", "Drama", "Horror", "Animation", "Sci-Fi", "Thriller", "Romance", "Documentary"];

// ── Helpers ───────────────────────────────────────────────────────────

function statusStyle(s) {
  if (s === "watched")   return { bg: "rgba(90,184,138,0.13)", color: "#5ab88a", border: "rgba(90,184,138,0.3)" };
  if (s === "watchlist") return { bg: "var(--rose-bg)", color: "var(--rose2)", border: "rgba(196,116,138,0.3)" };
  return                        { bg: "rgba(224,90,90,0.12)", color: "#e07a7a", border: "rgba(224,90,90,0.3)" };
}
function statusLabel(s) {
  return s === "watched" ? "✓ Watched" : s === "watchlist" ? "+ Watchlist" : "✕ Dropped";
}

function Stars({ n, size = 13 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= n ? "#d4956a" : "var(--border2)" }}>★</span>
      ))}
    </span>
  );
}

function Avatar({ name, size = 34 }) {
  const colors = ["#c4748a","#7a8ec4","#74c49a","#c4a474","#9a74c4"];
  const idx    = (name || "U").charCodeAt(0) % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: colors[idx], display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.38, color: "#0c0c10" }}>
      {(name || "U")[0].toUpperCase()}
    </div>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 30, fontSize: 13, cursor: "pointer",
      fontFamily: "var(--sans)", fontWeight: active ? 500 : 400, transition: "all 0.15s",
      background: active ? "var(--rose-bg)" : "transparent",
      color:      active ? "var(--rose2)"   : "var(--muted)",
      border:     active ? "1px solid rgba(196,116,138,0.4)" : "1px solid var(--border)",
    }}>{children}</button>
  );
}

function RoseBtn({ children, onClick, style = {}, disabled = false }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? "var(--dim)" : "var(--rose)",
      color: "#0c0c10", border: "none", borderRadius: 8,
      padding: "10px 22px", fontWeight: 600, fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "var(--sans)", transition: "background 0.15s", ...style,
    }}>{children}</button>
  );
}

function GhostBtn({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: "transparent", color: "var(--cream2)", border: "1px solid var(--border)",
      borderRadius: 8, padding: "9px 20px", fontSize: 14, cursor: "pointer",
      fontFamily: "var(--sans)", ...style,
    }}>{children}</button>
  );
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: "var(--bg2)", border: "1px solid var(--border)",
      borderRadius: 14, ...style,
    }}>{children}</div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 260, background: "var(--bg3)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite" }} />
      </div>
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ height: 16, background: "var(--bg3)", borderRadius: 4, marginBottom: 8, width: "80%" }} />
        <div style={{ height: 12, background: "var(--bg3)", borderRadius: 4, marginBottom: 8, width: "50%" }} />
        <div style={{ height: 12, background: "var(--bg3)", borderRadius: 4, width: "40%" }} />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 20 }}>
        {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────

function Nav({ user, page, setPage, logout }) {
  return (
    <nav style={{ background: "rgba(12,12,16,0.92)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50,
      display: "flex", alignItems: "center", padding: "0 36px", height: 58 }}>
      <div onClick={() => setPage("home")} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 7, marginRight: 32 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--rose2)", fontStyle: "italic" }}>Velvet</span>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--rose)", display: "inline-block", marginBottom: 4 }} />
      </div>
      {[["home","Browse"],["recs","For You"],["profile","Profile"]].map(([p, label]) => (
        <button key={p} onClick={() => setPage(p)} style={{
          background: "none", border: "none", cursor: "pointer", fontSize: 14,
          color: page === p ? "var(--cream)" : "var(--muted)",
          fontWeight: page === p ? 500 : 400, marginRight: 20,
          fontFamily: "var(--sans)",
          borderBottom: page === p ? "1px solid var(--rose)" : "1px solid transparent",
          paddingBottom: 2,
        }}>{label}</button>
      ))}
      
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>
          <span style={{ color: "var(--cream2)", fontWeight: 500 }}>{user.name}</span>
        </span>
        <button onClick={logout} style={{ background: "none", border: "1px solid var(--border)",
          borderRadius: 6, padding: "5px 12px", fontSize: 12, color: "var(--muted)",
          cursor: "pointer", fontFamily: "var(--sans)" }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

// ── Log Modal ─────────────────────────────────────────────────────────

function LogModal({ movie, existing, onSave, onClose, loading }) {
  const [status, setStatus] = useState(existing?.status  || "watched");
  const [rating, setRating] = useState(existing?.rating  || 4);
  const [hover,  setHover]  = useState(0);
  const [text,   setText]   = useState(existing?.review  || "");

  const statusOpts = [
    { key: "watched",   label: "✓ Watched"   },
    { key: "watchlist", label: "+ Watchlist"  },
    { key: "dropped",   label: "✕ Dropped"   },
  ];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="fade-up" style={{ background: "var(--bg2)", border: "1px solid var(--border2)",
        borderRadius: 16, padding: 28, width: 420, maxWidth: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 19 }}>{movie.title}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{movie.year}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)",
            fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {statusOpts.map(o => {
              const st = statusStyle(o.key);
              return (
                <button key={o.key} onClick={() => setStatus(o.key)} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12.5,
                  cursor: "pointer", fontFamily: "var(--sans)",
                  background: status === o.key ? st.bg : "var(--bg3)",
                  color:      status === o.key ? st.color : "var(--muted)",
                  border:     status === o.key ? `1px solid ${st.border}` : "1px solid var(--border)",
                }}>{o.label}</button>
              );
            })}
          </div>
        </div>

        {status === "watched" && (
          <>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Your Rating</div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                    style={{ fontSize: 30, cursor: "pointer",
                      color: i <= (hover || rating) ? "#d4956a" : "var(--border2)" }}>★</span>
                ))}
                <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 8 }}>{rating} / 5</span>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Review (optional)</div>
              <textarea value={text} onChange={e => setText(e.target.value)}
                placeholder="What did you think?" rows={3}
                style={{ width: "100%", background: "var(--bg3)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "var(--cream)", resize: "vertical" }} />
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <RoseBtn disabled={loading}
            onClick={() => onSave({ status, rating: status === "watched" ? rating : null, review: text })}>
            {loading ? "Saving..." : "Save"}
          </RoseBtn>
        </div>
      </div>
    </div>
  );
}

// ── Movie Card ────────────────────────────────────────────────────────

function MovieCard({ movie, log, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => onClick(movie)}
      style={{ cursor: "pointer", background: "var(--bg2)",
        border: `1px solid ${hov ? "var(--border2)" : "var(--border)"}`,
        borderRadius: 14, overflow: "hidden",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        transition: "transform 0.2s, border-color 0.2s",
        boxShadow: hov ? "0 16px 40px rgba(0,0,0,0.4)" : "none" }}>

      {/* Poster */}
      <div style={{ height: 260, background: "var(--bg3)", position: "relative",
        borderBottom: "1px solid var(--border)", overflow: "hidden" }}>
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 48 }}>🎬</div>
        )}
        {log && (
          <div style={{ position: "absolute", top: 10, right: 10, fontSize: 11,
            padding: "3px 9px", borderRadius: 20, fontWeight: 500,
            background: statusStyle(log.status).bg,
            color: statusStyle(log.status).color,
            border: `1px solid ${statusStyle(log.status).border}` }}>
            {statusLabel(log.status)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontFamily: "var(--serif)", fontSize: 15, marginBottom: 3,
          lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {movie.title}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
          {movie.year} · {movie.genre?.split(',')[0]}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stars n={Math.round(movie.rating || 0)} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{movie.rating}</span>
        </div>
      </div>
    </div>
  );
}

// ── Auth Page ─────────────────────────────────────────────────────────

function AuthPage({ onAuth }) {
  const [mode,    setMode]    = useState("login");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pass,    setPass]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const iStyle = {
    width: "100%", display: "block", marginBottom: 14,
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "11px 14px", fontSize: 14, color: "var(--cream)",
  };
  const lStyle = { fontSize: 11, color: "var(--muted)", textTransform: "uppercase",
    letterSpacing: "1px", display: "block", marginBottom: 6 };

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!email || !pass) { setErr("Please fill in all fields."); setLoading(false); return; }
        const data = await loginUser(email, pass);
        if (data.message) { setErr(data.message); setLoading(false); return; }
        onAuth(data.user, data.token);
      } else {
        if (!name || !email || !pass || !confirm) { setErr("Please fill in all fields."); setLoading(false); return; }
        if (pass !== confirm) { setErr("Passwords don't match."); setLoading(false); return; }
        const data = await registerUser(name, email, pass);
        if (data.message && !data.token) { setErr(data.message); setLoading(false); return; }
        onAuth(data.user, data.token);
      }
    } catch (e) {
      setErr("Could not connect to server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 20% 50%, rgba(196,116,138,0.07) 0%, transparent 60%)" }} />
      <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "60px 64px", borderRight: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--serif)", fontSize: 48, color: "var(--rose2)", fontStyle: "italic", marginBottom: 8 }}>Velvet</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 22, color: "var(--cream)", lineHeight: 1.4, marginBottom: 20, maxWidth: 340 }}>
            Every film you've ever loved, in one place.
          </div>
          <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.8, maxWidth: 320 }}>
            Discover, log, and rate films. Build your watchlist. See what others think.
          </p>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
            {["Browse a curated library of films","Rate & review what you've watched","Build your personal watchlist","Track your viewing history"].map(f => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--cream2)" }}>
                <span style={{ color: "var(--rose)", fontSize: 16 }}>◆</span> {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: 440, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div className="fade-up" style={{ width: "100%" }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 26, marginBottom: 6 }}>
              {mode === "login" ? "Welcome back" : "Join Velvet"}
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 28 }}>
              {mode === "login" ? "Sign in to your account" : "Create your free account"}
            </p>

            {mode === "signup" && (<><label style={lStyle}>Name</label>
              <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} style={iStyle} /></>)}

            <label style={lStyle}>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={iStyle} />

            <label style={lStyle}>Password</label>
            <input type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} style={iStyle} />

            {mode === "signup" && (<><label style={lStyle}>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} style={iStyle} /></>)}

            {err && <div style={{ color: "#e07a7a", fontSize: 13, marginBottom: 14 }}>{err}</div>}

            <RoseBtn onClick={submit} disabled={loading} style={{ width: "100%", padding: "12px", fontSize: 15 }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </RoseBtn>

            <p style={{ textAlign: "center", marginTop: 18, fontSize: 13.5, color: "var(--muted)" }}>
              {mode === "login" ? "No account? " : "Already a member? "}
              <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}
                style={{ background: "none", border: "none", color: "var(--rose2)", cursor: "pointer",
                  fontSize: 13.5, fontFamily: "var(--sans)" }}>
                {mode === "login" ? "Sign up free" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────

function HomePage({ token, userId, openMovie }) {
  const [movies,  setMovies]  = useState([]);
  const [logs,    setLogs]    = useState({});
  const [search,  setSearch]  = useState("");
  const [genre,   setGenre]   = useState("All");
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("popularity");

  // Fetch movies whenever search or genre changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      const moviesData = await fetchMovies(search, genre, sort);
      setMovies(Array.isArray(moviesData) ? moviesData : []);
      setLoading(false);
    }
    const timeout = setTimeout(load, 400);
    return () => clearTimeout(timeout);
  }, [search, genre, sort]);

  // Load user logs separately once on mount
  useEffect(() => {
    async function loadLogs() {
      const logsData = await fetchUserLogs(token, userId);
      const logsMap  = {};
      if (Array.isArray(logsData)) {
        logsData.forEach(log => { logsMap[log.tmdbId] = log; });
      }
      setLogs(logsMap);
    }
    loadLogs();
  }, [token, userId]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 32px" }}>
      <div className="fade-up" style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 38, fontStyle: "italic",
          color: "var(--cream)", lineHeight: 1.15, marginBottom: 8 }}>
          What are you watching<br />tonight?
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)" }}>Browse our library, log your films, and rate what you've seen.</p>
      </div>

      <div className="fade-up-2" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 32, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px", maxWidth: 360 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
            color: "var(--dim)", fontSize: 15 }}>⌕</span>
          <input type="text" placeholder="Search any film..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", background: "var(--bg2)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "10px 14px 10px 36px", fontSize: 14, color: "var(--cream)" }} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GENRES.map(g => <Pill key={g} active={genre === g} onClick={() => setGenre(g)}>{g}</Pill>)}
        </div>
      </div>

      <select value={sort} onChange={e => setSort(e.target.value)}
        style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "8px 12px", fontSize: 13, color: "var(--cream)", cursor: "pointer",
          fontFamily: "var(--sans)" }}>
        <option value="popularity">Most Popular</option>
        <option value="rating">Highest Rated</option>
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      {loading ? <SkeletonGrid /> : (
        <div className="fade-up-3" style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 20, marginTop: 20 }}>
          {movies.map(m => (
            <MovieCard key={m.tmdbId} movie={m} log={logs[String(m.tmdbId)]}
              onClick={() => openMovie(m)} />
          ))}
          {movies.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎬</div>
              No films found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Movie Page ────────────────────────────────────────────────────────

function MoviePage({ movie, token, userId, goBack }) {
  const [fullMovie, setFullMovie] = useState(null);
  const [log,       setLog]       = useState(null);
  const [modal,     setModal]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [movieData, logsData] = await Promise.all([
        fetchMovie(movie.tmdbId),
        fetchUserLogs(token, userId)
      ]);
      setFullMovie(movieData);
      if (Array.isArray(logsData)) {
        const found = logsData.find(l => l.tmdbId === String(movie.tmdbId));
        setLog(found || null);
      }
      setLoading(false);
    }
    load();
  }, [movie.tmdbId, token, userId]);

  async function handleSave(entry) {
    setSaving(true);
    
    const movieToLog = fullMovie || movie;
    
    console.log('Full movie object:', movieToLog);
    console.log('tmdbId being sent:', movieToLog.tmdbId);
    console.log('Entry:', entry);

    try {
      const result = await saveLog(
        token,
        String(movieToLog.tmdbId),
        movieToLog.title,
        movieToLog.poster,
        movieToLog.genre,
        movieToLog.year,
        entry.status,
        entry.rating,
        entry.review
      );
      
      console.log('Save result:', result);

      const logsData = await fetchUserLogs(token, userId);
      if (Array.isArray(logsData)) {
        const found = logsData.find(l => l.tmdbId === String(movieToLog.tmdbId));
        setLog(found || null);
      }
    } catch(e) {
      console.error('Save failed:', e);
    }

    setSaving(false);
    setModal(false);
  }

  if (loading) return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ height: 20, width: 120, background: "var(--bg3)", borderRadius: 4, marginBottom: 28 }} />
      <div style={{ display: "flex", gap: 32, marginBottom: 32 }}>
        <div style={{ width: 200, height: 295, background: "var(--bg3)", borderRadius: 12, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, justifyContent: "center" }}>
          <div style={{ height: 14, width: "40%", background: "var(--bg3)", borderRadius: 4 }} />
          <div style={{ height: 32, width: "80%", background: "var(--bg3)", borderRadius: 4 }} />
          <div style={{ height: 14, width: "60%", background: "var(--bg3)", borderRadius: 4 }} />
          <div style={{ height: 14, width: "50%", background: "var(--bg3)", borderRadius: 4 }} />
          <div style={{ height: 20, width: "30%", background: "var(--bg3)", borderRadius: 4 }} />
          <div style={{ height: 38, width: 140, background: "var(--bg3)", borderRadius: 8, marginTop: 8 }} />
        </div>
      </div>
      <div style={{ height: 120, background: "var(--bg3)", borderRadius: 12, marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
      </div>
      <div style={{ height: 80, background: "var(--bg3)", borderRadius: 12, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)", animation: "shimmer 1.5s infinite" }} />
      </div>
      <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
    </div>
  );

  const m = fullMovie || movie;

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 32px" }}>
      <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--muted)",
        cursor: "pointer", fontSize: 14, marginBottom: 28, fontFamily: "var(--sans)" }}>
        ← Back to Browse
      </button>

      <div className="fade-up" style={{ display: "flex", gap: 32, marginBottom: 32, flexWrap: "wrap" }}>
        <div style={{ width: 200, height: 295, flexShrink: 0, background: "var(--bg3)",
          border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          {m.poster ? (
            <img src={m.poster} alt={m.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 90 }}>🎬</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 12, color: "var(--rose)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 8 }}>{m.genre}</div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, lineHeight: 1.15, marginBottom: 6 }}>{m.title}</h1>
          <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", color: "var(--muted)", fontSize: 15, marginBottom: 14 }}>"{m.tagline}"</p>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            {m.year} &nbsp;·&nbsp; {m.runtime} &nbsp;·&nbsp; Dir. {m.director}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Stars n={Math.round(m.rating || 0)} size={16} />
            <span style={{ fontSize: 22, fontFamily: "var(--serif)", color: "#d4956a" }}>{m.rating}</span>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>/ 5</span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {log ? (
              <>
                <div style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13.5, fontWeight: 500,
                  background: statusStyle(log.status).bg, color: statusStyle(log.status).color,
                  border: `1px solid ${statusStyle(log.status).border}` }}>
                  {statusLabel(log.status)} {log.rating ? `· ${log.rating}★` : ""}
                </div>
                <GhostBtn onClick={() => setModal(true)}>Edit log</GhostBtn>
              </>
            ) : (
              <RoseBtn onClick={() => setModal(true)}>+ Log this film</RoseBtn>
            )}
          </div>
        </div>
      </div>

      <div className="fade-up-2">
        <Card style={{ padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Synopsis</div>
          <p style={{ fontSize: 14.5, color: "var(--cream2)", lineHeight: 1.8 }}>{m.synopsis}</p>
        </Card>
        <Card style={{ padding: "22px 24px", marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "var(--dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Cast</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(m.cast || []).map(name => (
              <div key={name} style={{ background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "6px 14px", fontSize: 13, color: "var(--cream2)" }}>{name}</div>
            ))}
          </div>
        </Card>
      </div>

      <div className="fade-up-3">
        <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 16 }}>Reviews</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(m.reviews || []).length === 0 && !log?.review && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 14 }}>
              No reviews yet. Be the first!
            </div>
          )}
          {(m.reviews || []).map((r, i) => (
            <Card key={i} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar name={r.user?.name || "U"} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.user?.name || "User"}</div>
                  <Stars n={r.rating} />
                </div>
              </div>
              <p style={{ fontSize: 14, color: "var(--cream2)", lineHeight: 1.7 }}>{r.text}</p>
            </Card>
          ))}
          {log?.review && (
            <Card style={{ padding: "18px 20px", border: "1px solid rgba(196,116,138,0.3)",
              background: "rgba(196,116,138,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--rose)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#0c0c10" }}>You</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Your review</div>
                  {log.rating && <Stars n={log.rating} />}
                </div>
              </div>
              <p style={{ fontSize: 14, color: "var(--cream2)", lineHeight: 1.7 }}>{log.review}</p>
            </Card>
          )}
        </div>
      </div>

      {modal && <LogModal movie={m} existing={log} onSave={handleSave}
        onClose={() => setModal(false)} loading={saving} />}
    </div>
  );
}

// ── Profile Page ──────────────────────────────────────────────────────

function ProfilePage({ user, token }) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchUserLogs(token, user.id);
      setLogs(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    load();
  }, [token, user.id]);

  const watched   = logs.filter(l => l.status === "watched");
  const watchlist = logs.filter(l => l.status === "watchlist");
  const dropped   = logs.filter(l => l.status === "dropped");
  const ratings   = watched.map(l => l.rating).filter(Boolean);
  const avg       = ratings.length
    ? (ratings.reduce((a,b) => a+b, 0) / ratings.length).toFixed(1)
    : "—";

  function LogList({ items, empty }) {
    if (items.length === 0) return (
      <Card style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>{empty}</p>
      </Card>
    );
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map(l => (
          <Card key={l._id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            {l.poster ? (
              <img src={l.poster} alt={l.title}
                style={{ width: 40, height: 60, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 40, height: 60, borderRadius: 6, background: "var(--bg3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎬</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 15,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {l.title || "Unknown title"}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                {l.year} · {l.genre?.split(',')[0]}
              </div>
              {l.review && (
                <div style={{ fontSize: 12.5, color: "var(--dim)", fontStyle: "italic", marginTop: 4 }}>
                  "{l.review}"
                </div>
              )}
            </div>
            {l.rating && <Stars n={l.rating} />}
            <button
              onClick={async () => {
                await deleteLog(token, l.tmdbId);
                setLogs(prev => prev.filter(log => log.tmdbId !== l.tmdbId));
              }}
              style={{ background: "rgba(224,90,90,0.12)", border: "1px solid rgba(224,90,90,0.3)",
                color: "#e07a7a", borderRadius: 6, padding: "4px 10px", fontSize: 12,
                cursor: "pointer", fontFamily: "var(--sans)", flexShrink: 0 }}>
              Remove
            </button>
          </Card>
          
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "44px 32px" }}>
      <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 20,
        marginBottom: 36, paddingBottom: 32, borderBottom: "1px solid var(--border)" }}>
        <Avatar name={user.name} size={64} />
        <div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: 26 }}>{user.name}</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>Velvet member</p>
        </div>
      </div>

      <div className="fade-up-2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 40 }}>
        {[[watched.length,"Films watched"],[watchlist.length,"On watchlist"],[avg,"Avg rating"]].map(([val,label]) => (
          <Card key={label} style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 32, color: "var(--rose2)" }}>{val}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{label}</div>
          </Card>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 88, background: "var(--bg2)", borderRadius: 12,
              border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite" }} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 16 }}>Watched</h2>
            <LogList items={watched} empty="You haven't logged any films as watched yet." />
          </div>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 16 }}>Watchlist</h2>
            <LogList items={watchlist} empty="Your watchlist is empty." />
          </div>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 20, marginBottom: 16 }}>Dropped</h2>
            <LogList items={dropped} empty="You haven't dropped any films." />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────

function Chatbot({ token }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm Velvet's film assistant. Ask me for recommendations, or anything about the films in our library." }
  ]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== "system");
      const data    = await sendChatMessage(token, userMsg.content, history);
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Try again!" }]);
    }
    setLoading(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 300,
        width: 56, height: 56, borderRadius: "50%",
        background: "var(--rose)", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, boxShadow: "0 8px 32px rgba(196,116,138,0.4)",
        transition: "transform 0.2s",
      }}>
        {open ? "×" : "✦"}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 300,
          width: 360, height: 500, background: "var(--bg2)",
          border: "1px solid var(--border2)", borderRadius: 16,
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          {/* Header */}
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--rose)", fontSize: 16 }}>✦</span>
            <div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--cream)" }}>Velvet Assistant</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Powered by Claude</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start"
              }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 12, fontSize: 13.5, lineHeight: 1.6,
                  background: m.role === "user" ? "var(--rose)" : "var(--bg3)",
                  color:      m.role === "user" ? "#0c0c10"    : "var(--cream2)",
                  borderBottomRightRadius: m.role === "user" ? 4 : 12,
                  borderBottomLeftRadius:  m.role === "user" ? 12 : 4,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: "var(--bg3)", padding: "10px 14px", borderRadius: 12, fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)",
            display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about films..."
              style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "9px 12px", fontSize: 13.5,
                color: "var(--cream)", fontFamily: "var(--sans)" }}
            />
            <button onClick={send} disabled={loading || !input.trim()} style={{
              background: "var(--rose)", border: "none", borderRadius: 8,
              width: 38, height: 38, cursor: "pointer", fontSize: 16,
              color: "#0c0c10", flexShrink: 0,
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}>→</button>
          </div>
        </div>
      )}
    </>
  );
}

function RecsPage({ token }) {
  const [recs,    setRecs]    = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getRecommendations(token);
      setRecs(data.recommendations || []);
      setMessage(data.message || "");
      setLoading(false);
    }
    load();
  }, [token]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "44px 32px" }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 38, fontStyle: "italic", marginBottom: 8 }}>For You</h1>
        <p style={{ fontSize: 15, color: "var(--muted)" }}>Personalised picks based on your watch history.</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 110, background: "var(--bg2)", borderRadius: 14,
              border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                animation: "shimmer 1.5s infinite" }} />
            </div>
          ))}
        </div>
      ) : message ? (
        <Card style={{ padding: 24 }}>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>{message}</p>
        </Card>
      ) : (
        <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {recs.map((rec, i) => (
            <Card key={i} style={{ padding: "20px 22px", display: "flex", gap: 18, alignItems: "flex-start" }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: "var(--rose-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0, border: "1px solid rgba(196,116,138,0.3)" }}>
                🎬
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 18, marginBottom: 3 }}>{rec.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                  {rec.year} · {rec.genre}
                </div>
                <div style={{ fontSize: 13.5, color: "var(--rose2)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{rec.reason}"
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("auth");
  const [user,   setUser]   = useState(null);
  const [token,  setToken]  = useState(null);
  const [page,   setPage]   = useState("home");
  const [movie,  setMovie]  = useState(null);

  // Persist login across page refreshes
  useEffect(() => {
  const savedToken = localStorage.getItem("velvet_token");
  const savedUser  = localStorage.getItem("velvet_user");
  if (savedToken && savedUser) {
    // Check if token is expired by decoding it
    try {
      const payload = JSON.parse(atob(savedToken.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        localStorage.removeItem("velvet_token");
        localStorage.removeItem("velvet_user");
        setScreen("auth");
      } else {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setScreen("app");
      }
    } catch(e) {
      localStorage.removeItem("velvet_token");
      localStorage.removeItem("velvet_user");
      setScreen("auth");
    }
  }
}, []);

  function login(userData, jwt) {
    setUser(userData);
    setToken(jwt);
    setScreen("app");
    localStorage.setItem("velvet_token", jwt);
    localStorage.setItem("velvet_user", JSON.stringify(userData));
  }

  function logout() {
    setScreen("auth");
    setUser(null);
    setToken(null);
    setPage("home");
    setMovie(null);
    localStorage.removeItem("velvet_token");
    localStorage.removeItem("velvet_user");
  }

  function openMovie(m) {
    console.log('Opening movie:', m);
    setMovie(m);
    setPage("movie");
  }
  
  
  function navigate(p)  { setPage(p); setMovie(null); }

  if (screen === "auth") return (
    <> <style>{CSS}</style> <AuthPage onAuth={login} /> </>
  );

  return (
  <>
    <style>{CSS}</style>
    <Nav user={user} page={page} setPage={navigate} logout={logout} />
    {page === "home"    && <HomePage token={token} userId={user.id} openMovie={openMovie} />}
    {page === "movie"   && movie && <MoviePage movie={movie} token={token} userId={user.id} goBack={() => navigate("home")} />}
    {page === "recs"    && <RecsPage token={token} />}
    {page === "profile" && <ProfilePage user={user} token={token} />}
    <Chatbot token={token} />
  </>
);
}