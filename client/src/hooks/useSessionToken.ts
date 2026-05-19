import { useEffect, useState } from "react";
import { nanoid } from "nanoid";

const SESSION_KEY = "nutrisense_session_token";

export function useSessionToken(): string {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const newToken = nanoid(32);
    localStorage.setItem(SESSION_KEY, newToken);
    return newToken;
  });

  useEffect(() => {
    if (!token) {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) {
        setToken(existing);
      } else {
        const newToken = nanoid(32);
        localStorage.setItem(SESSION_KEY, newToken);
        setToken(newToken);
      }
    }
  }, [token]);

  return token;
}
