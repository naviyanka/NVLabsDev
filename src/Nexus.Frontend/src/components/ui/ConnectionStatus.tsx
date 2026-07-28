import type { SignalRConnectionState } from "@/lib/signalr";

interface ConnectionStatusProps {
  state: SignalRConnectionState;
}

/**
 * A small badge component showing SignalR connection state.
 * Green dot + "Live" when connected, yellow "Reconnecting...", red "Offline".
 */
export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const config = {
    connected: {
      dotColor: "bg-emerald-500",
      label: "Live",
      textColor: "text-emerald-400",
      pulse: true,
    },
    reconnecting: {
      dotColor: "bg-yellow-500",
      label: "Reconnecting...",
      textColor: "text-yellow-400",
      pulse: true,
    },
    disconnected: {
      dotColor: "bg-red-500",
      label: "Offline",
      textColor: "text-red-400",
      pulse: false,
    },
  }[state];

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${config.dotColor}`}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${config.dotColor}`}
        />
      </span>
      <span className={`text-[10px] font-medium ${config.textColor}`}>
        {config.label}
      </span>
    </div>
  );
}
