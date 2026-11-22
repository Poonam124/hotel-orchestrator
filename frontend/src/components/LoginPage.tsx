import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError(null);
  };

  return (
    <main className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <h1>{isLogin ? "Sign in" : "Create account"}</h1>
        <p className="sub">Hotel offers, cheapest price per hotel.</p>

        {!isLogin && (
          <label className="field">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}

        <label className="field">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            autoComplete="email" required />
        </label>

        <label className="field">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? 1 : 8} required />
          {!isLogin && <span className="muted">At least 8 characters</span>}
        </label>

        {error && <div className="banner error" role="alert">{error}</div>}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
        </button>

        <p className="hint">
          {isLogin ? "New here?" : "Already have an account?"}
          <button type="button" className="link" onClick={switchMode}>
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </p>
      </form>
    </main>
  );
}
