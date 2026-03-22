import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixCanvas from "@/components/auth/MatrixCanvas";
import GlowInput from "@/components/auth/GlowInput";
import "@/components/auth/GlowInput.css";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/inflect-logo.png";

const Login = () => {
  const { session, loading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/app/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const attemptsRef = useRef(0);
  const lockedUntilRef = useRef(0);

  if (!loading && session) return <Navigate to="/app/home" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (Date.now() < lockedUntilRef.current) {
      setError("Too many attempts. Try again later.");
      return;
    }
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 5) {
        lockedUntilRef.current = Date.now() + 15 * 60 * 1000;
        setError("Too many attempts. Try again later.");
      } else if (authError.message?.toLowerCase().includes("network") || authError.status === 0) {
        setError("Login failed. Check your connection.");
      } else {
        setError("Incorrect email or password.");
      }
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  const hasError = !!error;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover z-0">
        <source src="/videos/login_bg.mp4" type="video/mp4" />
      </video>
      <div className="fixed inset-0 z-0 bg-background/50" />

      {/* Volumetric glows */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div style={{
          position: "absolute", top: "30%", left: "20%", width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(0, 212, 255, 0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "15%", width: "35%", height: "35%",
          background: "radial-gradient(ellipse, rgba(240, 165, 0, 0.04) 0%, transparent 70%)",
        }} />
      </div>

      <div className="fixed inset-0 z-[5] pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(8,12,20,0.7) 0%, transparent 100%)" }} />

      <div
        className="absolute w-full z-[10]"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", maxWidth: 420, padding: "0 16px" }}
      >
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Inflect" style={{ height: 40 }} className="object-contain" />
        </div>

        <div
          className="glass-panel"
          style={{
            padding: 40,
            boxShadow:
              "0 0 0 1px rgba(0,212,255,0.1) inset, 0 0 60px rgba(0,212,255,0.04), 0 24px 80px rgba(0,0,0,0.6), 0 0 120px rgba(240,165,0,0.03)",
          }}
        >
          <h1 className="font-display text-xl font-bold text-foreground text-center mb-8">Welcome back</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.08em" }}>
                Email
              </label>
              <GlowInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                hasError={hasError}
                isValid={email.includes("@") && email.includes(".")}
              />
            </div>

            <div>
              <label className="block mb-1.5 font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.08em" }}>
                Password
              </label>
              <GlowInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                hasError={hasError}
                isValid={password.length >= 8}
              />
            </div>

            {error && <p style={{ color: "hsl(var(--destructive))", fontSize: 12 }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="glow-button w-full cursor-pointer transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--gold-deep, 36 100% 36%)))",
                color: "hsl(var(--primary-foreground))",
                fontWeight: 700,
                borderRadius: 10,
                padding: 13,
                fontSize: 15,
                opacity: submitting ? 0.7 : 1,
                border: "none",
                boxShadow: "0 0 20px rgba(240,165,0,0.15)",
              }}
            >
              {submitting ? "Logging in…" : "Log In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 10 }}>or</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={async () => {
              setError("");
              setSubmitting(true);
              const { error: authError } = await supabase.auth.signInWithPassword({
                email: "demo@inflect.app",
                password: "Demo1234",
              });
              setSubmitting(false);
              if (authError) {
                setError("Demo login failed. Try again.");
                return;
              }
              navigate(redirectTo, { replace: true });
            }}
            className="glow-button w-full cursor-pointer transition-all duration-200"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 600,
              borderRadius: 10,
              padding: 13,
              fontSize: 14,
            }}
          >
            Try Demo Account
          </button>

          <p className="text-center text-sm mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
            Don't have an account?{" "}
            <Link to="/register" className="font-medium" style={{ color: "hsl(var(--accent))" }}>Sign up →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
