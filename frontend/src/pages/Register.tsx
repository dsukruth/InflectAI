import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MatrixCanvas from "@/components/auth/MatrixCanvas";
import GlowInput from "@/components/auth/GlowInput";
import "@/components/auth/GlowInput.css";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/inflect-logo.png";

const passwordChecks = [
  { test: (p: string) => p.length >= 8, msg: "Password must be 8+ characters" },
  { test: (p: string) => /\d/.test(p), msg: "Include at least one number" },
  { test: (p: string) => /[A-Z]/.test(p), msg: "Include at least one uppercase letter" },
];

const Register = () => {
  const { session, loading } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [confirmError, setConfirmError] = useState("");

  if (!loading && session) return <Navigate to="/app/research" replace />;

  const validateEmail = () => {
    if (!email) setEmailError("Email is required.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("Enter a valid email.");
    else setEmailError("");
  };

  const validatePassword = () => {
    const errs = passwordChecks.filter((c) => !c.test(password)).map((c) => c.msg);
    setPasswordErrors(errs);
  };

  const validateConfirm = () => {
    setConfirmError(password !== confirm ? "Passwords don't match" : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    validateEmail();
    validatePassword();
    validateConfirm();

    const pwErrs = passwordChecks.filter((c) => !c.test(password));
    if (!email || emailError || pwErrs.length > 0 || password !== confirm) return;

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setSubmitting(false);

    if (authError) {
      if (authError.status === 409 || authError.status === 422 || authError.message?.toLowerCase().includes("already")) {
        setError("already_exists");
      } else {
        setError("Couldn't create account. Try again.");
      }
      return;
    }
    navigate("/app/research", { replace: true });
  };

  const emailValid = email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length > 0 && passwordChecks.every((c) => c.test(password));
  const confirmValid = confirm.length > 0 && password === confirm;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      <MatrixCanvas />

      {/* Volumetric glows */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div style={{
          position: "absolute", top: "25%", left: "15%", width: "40%", height: "40%",
          background: "radial-gradient(ellipse, rgba(0, 212, 255, 0.06) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "20%", right: "20%", width: "35%", height: "35%",
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
          <h1 className="font-display text-xl font-bold text-foreground text-center mb-8">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1.5 font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.08em" }}>Email</label>
              <GlowInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={validateEmail}
                placeholder="you@example.com"
                hasError={!!emailError}
                isValid={emailValid}
              />
              {emailError && <p style={{ color: "hsl(var(--destructive))", fontSize: 12, marginTop: 6 }}>{emailError}</p>}
            </div>

            <div>
              <label className="block mb-1.5 font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.08em" }}>Password</label>
              <GlowInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={validatePassword}
                placeholder="Min 8 chars, 1 number, 1 uppercase"
                hasError={passwordErrors.length > 0}
                isValid={passwordValid}
              />
              {passwordErrors.map((e) => (
                <p key={e} style={{ color: "hsl(var(--destructive))", fontSize: 12, marginTop: 6 }}>{e}</p>
              ))}
            </div>

            <div>
              <label className="block mb-1.5 font-mono" style={{ color: "hsl(var(--muted-foreground))", fontSize: 11, letterSpacing: "0.08em" }}>Confirm Password</label>
              <GlowInput
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onBlur={validateConfirm}
                placeholder="Re-enter password"
                hasError={!!confirmError}
                isValid={confirmValid}
              />
              {confirmError && <p style={{ color: "hsl(var(--destructive))", fontSize: 12, marginTop: 6 }}>{confirmError}</p>}
            </div>

            {error && error !== "already_exists" && (
              <p style={{ color: "hsl(var(--destructive))", fontSize: 12 }}>{error}</p>
            )}
            {error === "already_exists" && (
              <p style={{ color: "hsl(var(--destructive))", fontSize: 12 }}>
                Account already exists.{" "}
                <Link to="/login" style={{ color: "hsl(var(--accent))" }}>Log in instead →</Link>
              </p>
            )}

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
              {submitting ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "hsl(var(--muted-foreground))" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium" style={{ color: "hsl(var(--accent))" }}>Log in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
