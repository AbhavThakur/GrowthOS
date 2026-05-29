import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, Zap, ArrowRight, WifiOff, Wifi } from "lucide-react";

export default function AuthGate({ children }) {
  const {
    user,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    continueOffline,
  } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // user === undefined means still resolving
  if (user === undefined) {
    return (
      <div style={s.splash}>
        <div style={s.splashInner}>
          <div style={s.splashLogo}>
            <div style={s.splashDot} />
            <span style={s.splashName}>Growth OS</span>
          </div>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // Signed in — render children
  if (user) return children;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") await login(email, password, remember);
      else if (mode === "signup") await signup(email, password);
      else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      const msg =
        err?.code?.replace("auth/", "").replaceAll("-", " ") ??
        "Something went wrong";
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(remember);
    } catch (err) {
      const msg =
        err?.code?.replace("auth/", "").replaceAll("-", " ") ??
        "Something went wrong";
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    } finally {
      setLoading(false);
    }
  };

  const T = {
    login: { heading: "Welcome back", sub: "Sign in to Growth OS" },
    signup: { heading: "Get started", sub: "Create your Growth OS account" },
    reset: {
      heading: "Reset password",
      sub: "We'll send a link to your email",
    },
  };

  return (
    <div style={s.page}>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.orb3} />
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoBadge}>
            <Zap size={16} color="#2dd4bf" />
          </div>
          <span style={s.logoText}>Growth OS</span>
        </div>

        <h1 style={s.heading}>{T[mode].heading}</h1>
        <p style={s.sub}>{T[mode].sub}</p>

        {resetSent ? (
          <div style={s.successBox}>
            <div style={s.successIcon}>✉️</div>
            <div style={s.successTitle}>Check your inbox</div>
            <div style={s.successMsg}>Reset link sent to {email}</div>
            <button
              style={s.textLink}
              onClick={() => {
                setMode("login");
                setResetSent(false);
              }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form style={s.form} onSubmit={handleSubmit}>
            <div style={s.field}>
              <label style={s.label}>Email</label>
              <input
                style={s.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>
            {mode !== "reset" && (
              <div style={s.field}>
                <div style={s.labelRow}>
                  <label style={s.label}>Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      style={s.textLink}
                      onClick={() => setMode("reset")}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div style={s.pwWrap}>
                  <input
                    style={{ ...s.input, paddingRight: 44 }}
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    style={s.eyeBtn}
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}
            {mode === "login" && (
              <label style={s.checkRow}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ accentColor: "var(--teal)" }}
                />
                <span style={s.checkLabel}>Stay signed in</span>
              </label>
            )}
            {error && <div style={s.errorBox}>{error}</div>}
            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : "Send reset link"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>
        )}

        {!resetSent && (
          <div style={s.switchRow}>
            {mode === "login" ? (
              <>
                <span style={s.switchText}>No account?</span>
                <button
                  style={s.textLink2}
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                >
                  Create one →
                </button>
              </>
            ) : mode === "signup" ? (
              <>
                <span style={s.switchText}>Have an account?</span>
                <button
                  style={s.textLink2}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in →
                </button>
              </>
            ) : (
              <button
                style={s.textLink2}
                onClick={() => {
                  setMode("login");
                  setError("");
                  setResetSent(false);
                }}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        )}

        {!resetSent && loginWithGoogle && (
          <button
            style={s.googleBtn}
            type="button"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continue with Google
          </button>
        )}

        <div style={s.divider}>
          <span style={s.dividerText}>or</span>
        </div>

        <button style={s.offlineBtn} onClick={continueOffline}>
          <WifiOff size={14} /> Continue without account{" "}
          <span style={s.offlineSub}>(data stays local)</span>
        </button>

        <div style={s.hint}>
          <Wifi size={11} /> Same Firebase as WealthOS — data syncs when signed
          in
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    position: "relative",
    overflow: "hidden",
  },
  orb1: {
    position: "fixed",
    width: 600,
    height: 600,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 70%)",
    top: -200,
    left: -200,
    pointerEvents: "none",
  },
  orb2: {
    position: "fixed",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
    bottom: -150,
    right: -100,
    pointerEvents: "none",
  },
  orb3: {
    position: "fixed",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
    top: "50%",
    right: "25%",
    pointerEvents: "none",
  },
  splash: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  splashInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  splashLogo: { display: "flex", alignItems: "center", gap: 10 },
  splashDot: {
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: "var(--teal)",
    boxShadow: "0 0 12px rgba(45,212,191,0.6)",
  },
  splashName: {
    fontFamily: "var(--sans)",
    fontWeight: 700,
    fontSize: 18,
    color: "var(--text)",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(20,23,32,0.88)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    boxShadow:
      "0 32px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(45,212,191,0.04)",
  },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background:
      "linear-gradient(135deg, rgba(45,212,191,0.2), rgba(45,212,191,0.06))",
    border: "1px solid rgba(45,212,191,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--sans)",
    fontWeight: 800,
    fontSize: 17,
    color: "var(--text)",
    letterSpacing: "-0.02em",
  },
  heading: {
    fontFamily: "var(--sans)",
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--text)",
    marginBottom: 6,
  },
  sub: { fontSize: 14, color: "var(--muted)", marginBottom: 28 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text2)",
    letterSpacing: "0.02em",
  },
  input: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s",
    width: "100%",
  },
  pwWrap: { position: "relative" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    padding: 2,
    display: "flex",
    alignItems: "center",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  checkLabel: { fontSize: 13, color: "var(--muted)" },
  errorBox: {
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.25)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 13,
    color: "#f87171",
  },
  btn: {
    background: "linear-gradient(135deg, #2dd4bf, #0d9488)",
    border: "none",
    borderRadius: 10,
    padding: "13px 20px",
    color: "#0d0f12",
    fontFamily: "var(--sans)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.15s",
    boxShadow: "0 4px 16px rgba(45,212,191,0.3)",
    marginTop: 4,
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
    fontSize: 13,
  },
  switchText: { color: "var(--muted)" },
  textLink: {
    background: "none",
    border: "none",
    color: "var(--teal)",
    cursor: "pointer",
    fontSize: 12,
    fontFamily: "var(--sans)",
    fontWeight: 600,
    padding: 0,
  },
  textLink2: {
    background: "none",
    border: "none",
    color: "var(--teal)",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "var(--sans)",
    fontWeight: 600,
    padding: 0,
  },
  googleBtn: {
    width: "100%",
    marginTop: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  divider: {
    position: "relative",
    margin: "20px 0 16px",
    textAlign: "center",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  dividerText: {
    fontSize: 11,
    color: "var(--muted)",
    background: "rgba(20,23,32,0.88)",
    padding: "0 12px",
    position: "relative",
    top: -9,
  },
  offlineBtn: {
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "11px 16px",
    color: "var(--text2)",
    fontFamily: "var(--sans)",
    fontSize: 13,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "all 0.15s",
  },
  offlineSub: { fontSize: 11, color: "var(--muted)" },
  hint: {
    marginTop: 16,
    fontSize: 11,
    color: "var(--muted)",
    display: "flex",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    lineHeight: 1.6,
    textAlign: "center",
  },
  successBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    alignItems: "center",
    padding: "20px 0",
    textAlign: "center",
  },
  successIcon: { fontSize: 36 },
  successTitle: { fontWeight: 700, color: "var(--text)", fontSize: 15 },
  successMsg: { fontSize: 13, color: "var(--muted)" },
};
