import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { AuthResponse, User } from "../lib/types";

const TOKEN_KEY = "auth_token";

interface AuthValue {
  user: User | null;
  loading: boolean; // true while a saved token is being checked
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    api.setToken(null);
    setUser(null);
  }, []);

  // On page load: if a token was saved, check with the backend that it is still valid
  useEffect(() => {
    api.onUnauthorized(logout);
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) {
      setLoading(false);
      return;
    }
    api.setToken(saved);
    api.me().then(setUser).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const start = useCallback((res: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    api.setToken(res.token);
    setUser(res.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => start(await api.login(email, password)), [start]);
  const register = useCallback(
    async (name: string, email: string, password: string) => start(await api.register(name, email, password)),
    [start]
  );

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
