import { useEffect, useMemo, useRef, useState } from "react";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notifications";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  recipient_username?: string | null;
  recipient_role?: string | null;
  type?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  created_by?: string | null;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  async function loadNotifications() {
    try {
      const data = await listNotifications();
      const nextItems = Array.isArray(data) ? (data as NotificationItem[]) : [];
      setItems(nextItems);
    } catch {
      setItems([]);
    }
  }

  async function handleOpenToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      setLoading(true);
      await loadNotifications();
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    setLoading(true);
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } finally {
      setMarkingId(null);
    }
  }

  useEffect(() => {
    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

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
        onClick={handleOpenToggle}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 text-lg hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-sky-800"
        aria-label="Notifications"
        title="Notifications"
      >
        <span role="img" aria-hidden="true">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-sky-950">
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="font-semibold">Notifications</div>
            <button
              type="button"
              onClick={handleMarkAllRead}
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
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  disabled={markingId === n.id}
                  className={`block w-full border-b border-slate-100 p-3 text-left text-sm dark:border-slate-800 ${
                    n.read ? "" : "bg-sky-50 dark:bg-sky-900/40"
                  } ${!n.read ? "hover:bg-sky-100 dark:hover:bg-sky-900/60" : ""} disabled:opacity-50`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold">{n.title}</div>
                    {!n.read && (
                      <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        New
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-slate-700 dark:text-slate-200">{n.message}</div>

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(n.timestamp).toLocaleString()}
                    </div>

                    {!n.read && (
                      <div className="text-xs text-sky-700 dark:text-sky-300">
                        {markingId === n.id ? "Marking..." : "Click to mark read"}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}