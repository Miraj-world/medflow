import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { initTheme } from "../theme";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes

export default function SessionManager() {
  const nav = useNavigate();
  const loc = useLocation();
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      // Only log out if a session exists
      const token = localStorage.getItem("token");
      if (!token) return;

      logout();
      initTheme(null);
      nav("/login", { replace: true });
    }, INACTIVITY_MS);
  }, [clearTimer, nav]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // If not logged in, no need to track activity
    if (!token) return;

    const onActivity = () => startTimer();
    const onScroll: EventListener = () => startTimer();

    // Start immediately on mount
    startTimer();

    window.addEventListener("mousemove", onActivity);
    window.addEventListener("mousedown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      clearTimer();
      window.removeEventListener("mousemove", onActivity);
      window.removeEventListener("mousedown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
      window.removeEventListener("scroll", onScroll);
    };
    // re-run if route changes (still keeps one timer and stays accurate)
  }, [clearTimer, loc.pathname, startTimer]);

  return null;
}
