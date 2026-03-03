export type ThemeMode = "light" | "dark" | "system";

const THEME_KEY_PREFIX = "theme:"; // theme:<username>
const THEME_KEY_GUEST = "theme:guest";

export function systemPrefersDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
}

export function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement;
  const shouldDark = mode === "dark" || (mode === "system" && systemPrefersDark());

  if (shouldDark) root.classList.add("dark");
  else root.classList.remove("dark");
}

function keyForUser(username?: string | null): string {
  const u = (username || "").trim().toLowerCase();
  return u ? `${THEME_KEY_PREFIX}${u}` : THEME_KEY_GUEST;
}

export function getUserTheme(username?: string | null): ThemeMode {
  const key = keyForUser(username);
  const raw = localStorage.getItem(key);
  if (raw === "light" || raw === "dark" || raw === "system") return raw;

  // Default if nothing stored
  return "dark";
}

export function setUserTheme(username: string | null | undefined, mode: ThemeMode) {
  const key = keyForUser(username);
  localStorage.setItem(key, mode);
  applyThemeMode(mode);
}

export function initTheme(username?: string | null) {
  const mode = getUserTheme(username);
  applyThemeMode(mode);
  return mode;
}

export function watchSystemThemeChanges(getCurrentMode: () => ThemeMode) {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};

  const handler = () => {
    if (getCurrentMode() === "system") applyThemeMode("system");
  };

  if (typeof mq.addEventListener === "function") mq.addEventListener("change", handler);
  else mq.addListener(handler);

  return () => {
    if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", handler);
    else mq.removeListener(handler);
  };
}