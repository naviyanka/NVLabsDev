import { Bell, RefreshCw, Search, X, CheckCircle, AlertTriangle, Info, LogOut, User } from "lucide-react";
import { getFullUrl } from "@/lib/backend";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getNotificationsClient, clearNotificationClient, clearAllNotificationsClient, type Notification } from "@/api/client";
import * as signalR from "@microsoft/signalr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

export function Topbar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIds = useRef<Set<number>>(new Set());
  const [isLive, setIsLive] = useState(() => {
    if (typeof window !== "undefined" && (window as any).__nexus_backend_online !== undefined) {
      return (window as any).__nexus_backend_online;
    }
    return true;
  });
  const navigate = useNavigate();

  const token = typeof window !== "undefined" ? localStorage.getItem("nexus_token") : null;
  let username = "User";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.unique_name || payload.name || "User";
    } catch (e) {
      // ignore
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("nexus_token");
    navigate({ to: "/login" });
  };

  const fetchNotifications = async () => {
    const data = await getNotificationsClient();
    setNotifications(data);

    const lastRead = Number(localStorage.getItem("nexus_notifications_read") || "0");
    setUnreadCount(data.filter(n => new Date(n.timestamp).getTime() > lastRead).length);

    // Check for new notifications to pop toast
    if (seenIds.current.size > 0) {
      data.forEach(n => {
        if (!seenIds.current.has(n.id)) {
          seenIds.current.add(n.id);
          if (n.type === "Success") {
            toast.success(n.message);
          } else if (n.type === "Error") {
            toast.error(n.message);
          } else {
            toast.info(n.message);
          }
        }
      });
    } else {
      // First load
      data.forEach(n => seenIds.current.add(n.id));
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Setup SignalR — re-read token on every (re)connect so refreshed tokens are used
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(getFullUrl("/hub/notifications"), {
        accessTokenFactory: () => localStorage.getItem("nexus_token") || ""
      })
      .withAutomaticReconnect()
      .build();

    const MAX_NOTIFICATIONS = 100;
    connection.on("ReceiveNotification", (n: Notification) => {
      // Add to state, capped to prevent unbounded memory growth
      setNotifications(prev => [n, ...prev].slice(0, MAX_NOTIFICATIONS));
      
      const lastRead = Number(localStorage.getItem("nexus_notifications_read") || "0");
      if (new Date(n.timestamp).getTime() > lastRead) {
        setUnreadCount(prev => prev + 1);
      }

      // Pop Toast
      if (!seenIds.current.has(n.id)) {
        seenIds.current.add(n.id);
        if (n.type === "Success") toast.success(n.message);
        else if (n.type === "Error" || n.type === "Critical") toast.error(n.message);
        else if (n.type === "Warning") toast.warning(n.message);
        else toast.info(n.message);
      }
    });

    connection.onreconnecting(() => {
      if (typeof window !== "undefined") (window as any).__nexus_set_backend_offline();
    });
    connection.onreconnected(() => {
      if (typeof window !== "undefined") (window as any).__nexus_set_backend_online();
    });
    connection.onclose(() => {
      if (typeof window !== "undefined") (window as any).__nexus_set_backend_offline();
    });

    connection.start()
      .then(() => {
        if (typeof window !== "undefined") (window as any).__nexus_set_backend_online();
      })
      .catch(err => {
        console.error("SignalR Topbar Error: ", err);
        if (typeof window !== "undefined") (window as any).__nexus_set_backend_offline();
      });

    const handleStatusChange = (e: any) => {
      setIsLive(e.detail.online);
    };
    window.addEventListener("nexus-backend-status", handleStatusChange as any);

    return () => {
      connection.stop();
      window.removeEventListener("nexus-backend-status", handleStatusChange as any);
    };
  }, []);

  const handleClear = async (id: number) => {
    const success = await clearNotificationClient(id);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handleClearAll = async () => {
    const success = await clearAllNotificationsClient();
    if (success) {
      setNotifications([]);
    }
  };

  const handleToggleDropdown = () => {
    const nextState = !showDropdown;
    setShowDropdown(nextState);
    if (nextState) {
      localStorage.setItem("nexus_notifications_read", Date.now().toString());
      setUnreadCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--border-c)] bg-[var(--bg-surface)] px-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-sub)]" />
          <input
            placeholder="Search servers, services, events…"
            className="mono h-9 w-[340px] rounded-md border border-[var(--border-c)] bg-[var(--bg-card)] pl-8 pr-14 text-[12px] text-[var(--text)] placeholder:text-[var(--text-ghost)] focus:border-[var(--amber)] focus:outline-none"
          />
          <kbd className="mono absolute right-2 top-1/2 -translate-y-1/2 rounded border border-[var(--border-c)] bg-[var(--bg-void)] px-1.5 py-0.5 text-[9px] text-[var(--text-sub)]">
            ⌘K
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isLive ? (
          <div className="mono flex items-center gap-1.5 rounded-full border border-[var(--teal)]/30 bg-[var(--teal-low)] px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--teal)] transition-colors">
            <span className="nx-blink h-1.5 w-1.5 rounded-full bg-[var(--teal)]" />
            LIVE
          </div>
        ) : (
          <div className="mono flex items-center gap-1.5 rounded-full border border-[var(--crit)]/30 bg-[var(--crit)]/10 px-2.5 py-1 text-[10px] tracking-[0.2em] text-[var(--crit)] transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--crit)]" />
            DEAD
          </div>
        )}
        
        <div className="relative">
          <button 
            onClick={handleToggleDropdown}
            className="relative grid h-8 w-8 place-items-center rounded-md text-[var(--text-sub)] hover:bg-[var(--bg-card)] hover:text-[var(--text)]"
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--crit)]" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-10 w-80 rounded-md border border-[var(--border-dim)] bg-[var(--bg-surface)] shadow-lg overflow-hidden flex flex-col max-h-[400px]">
              <div className="flex items-center justify-between border-b border-[var(--border-dim)] px-4 py-2 bg-[var(--bg-card)]">
                <span className="text-[12px] font-medium text-[var(--text)]">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={handleClearAll} className="text-[11px] text-[var(--blue)] hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-2">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-[12px] text-[var(--text-sub)]">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`relative group rounded border border-[var(--border-dim)] p-3 pr-8 flex gap-3 items-start ${n.type === 'Critical' ? 'bg-[var(--crit)]/10 border-[var(--crit)]/30' : 'bg-[var(--bg-card)]'}`}>
                      {n.type === "Success" && <CheckCircle size={14} className="text-[var(--green)] mt-0.5 shrink-0" />}
                      {(n.type === "Error" || n.type === "Critical") && <AlertTriangle size={14} className="text-[var(--crit)] mt-0.5 shrink-0" />}
                      {n.type === "Warning" && <AlertTriangle size={14} className="text-[var(--amber)] mt-0.5 shrink-0" />}
                      {n.type === "Info" && <Info size={14} className="text-[var(--blue)] mt-0.5 shrink-0" />}
                      
                      <div className="flex flex-col gap-1">
                        <div className="text-[11px] font-medium text-[var(--text)] break-words">{n.message}</div>
                        <div className="text-[10px] text-[var(--text-sub)] mono">{new Date(n.timestamp).toLocaleTimeString()} - {n.serverIp}</div>
                      </div>

                      <button 
                        onClick={() => handleClear(n.id)}
                        className="absolute right-2 top-2 text-[var(--text-sub)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="display grid h-8 w-8 place-items-center rounded-md bg-[var(--amber-low)] text-[12px] font-bold text-[var(--amber)] hover:bg-[var(--amber)] hover:text-[var(--bg-void)] transition-colors cursor-pointer" style={{ clipPath: "polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%)" }}>
              {username.charAt(0).toUpperCase()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-card)] border-[var(--border-dim)] text-[var(--text)] shadow-xl rounded-lg mt-2">
            <DropdownMenuLabel className="font-normal py-3 px-4">
              <div className="flex flex-col space-y-1.5">
                <p className="text-sm font-semibold leading-none text-[var(--text)]">{username}</p>
                <p className="text-xs leading-none text-[var(--text-sub)]">Administrator</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[var(--border-dim)]" />
            <DropdownMenuItem onClick={handleLogout} className="text-[var(--crit)] hover:!bg-[var(--crit)]/10 hover:!text-[var(--crit)] cursor-pointer py-2.5 px-4 font-medium transition-colors">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
