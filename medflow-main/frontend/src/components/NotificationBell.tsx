import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "../api/client";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/notifications/");
      setItems(Array.isArray(data) ? (data as NotificationItem[]) : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiFetch("/notifications/mark-all-read", { method: "POST" });
      await loadNotifications();
    } catch {
      // ignore
    }
  }, [loadNotifications]);

  useEffect(() => {
    if (open) loadNotifications();
  }, [loadNotifications, open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-sky-800"
        aria-label="Notifications"
        title="Notifications"
      >
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span className="inline-flex min-w-[22px] items-center justify-center rounded-full border border-slate-300 px-2 text-xs font-semibold dark:border-slate-600">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-sky-950">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="font-semibold">Notifications</div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={!items.length || loading}
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:hover:bg-sky-900"
            >
              Mark all read
            </button>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {loading ? (
            <div className="p-3 text-sm text-slate-700 dark:text-slate-200">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-3 text-sm text-slate-700 dark:text-slate-200">No notifications</div>
          ) : (
            <div className="max-h-[360px] overflow-auto">
              {items.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-slate-100 p-3 text-sm dark:border-slate-800 ${
                    n.read ? "" : "bg-sky-50 dark:bg-sky-900/40"
                  }`}
                >
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-slate-700 dark:text-slate-200">{n.message}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
