"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AUTH_KEY = "invoice_auth";
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function login(user: string, pass: string) {
  const valid =
    user === process.env.NEXT_PUBLIC_APP_USER &&
    pass === process.env.NEXT_PUBLIC_APP_PASS;
  if (valid) {
    localStorage.setItem(AUTH_KEY, "true");
    notify();
  }
  return valid;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
  notify();
}

export function useAuth() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(isAuthenticated());
    sync();
    setChecked(true);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const signOut = useCallback(() => {
    logout();
    router.push("/login");
  }, [router]);

  return { checked, authed, signOut };
}
