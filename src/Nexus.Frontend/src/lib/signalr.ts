import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useCallback, useEffect, useRef, useState } from "react";
import { getFullUrl } from "@/lib/backend";

// Connection state type for UI display
export type SignalRConnectionState =
  | "connected"
  | "reconnecting"
  | "disconnected";

// Singleton connection instance
let connectionInstance: HubConnection | null = null;
let connectionPromise: Promise<void> | null = null;

/**
 * Build and return the singleton SignalR hub connection.
 * Connects to /hub/notifications with JWT token from localStorage.
 */
export function getSignalRConnection(): HubConnection {
  if (connectionInstance) return connectionInstance;

  const hubUrl = getFullUrl("/hub/notifications");

  connectionInstance = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => {
        return localStorage.getItem("nexus_token") || "";
      },
    })
    .withAutomaticReconnect([0, 1000, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Warning)
    .build();

  return connectionInstance;
}

/**
 * Start the SignalR connection if not already started.
 * Returns a promise that resolves when connected.
 */
export async function startSignalRConnection(): Promise<void> {
  const connection = getSignalRConnection();

  if (connection.state === HubConnectionState.Connected) {
    return;
  }

  if (
    connection.state === HubConnectionState.Connecting ||
    connection.state === HubConnectionState.Reconnecting
  ) {
    if (connectionPromise) return connectionPromise;
  }

  connectionPromise = connection.start().catch((err) => {
    console.warn("[SignalR] Connection failed:", err);
    connectionPromise = null;
    throw err;
  });

  await connectionPromise;
  connectionPromise = null;
}

/**
 * Stop and dispose the singleton connection.
 */
export async function stopSignalRConnection(): Promise<void> {
  if (connectionInstance) {
    await connectionInstance.stop();
    connectionInstance = null;
    connectionPromise = null;
  }
}

/**
 * React hook for managing SignalR connection state and event subscriptions.
 * Provides connection state tracking, auto-connect, and typed event handlers.
 *
 * Uses a mounted ref flag to prevent lifecycle handler stacking: since SignalR's
 * onreconnecting/onreconnected/onclose do not support handler removal, registered
 * callbacks guard against state updates after the component unmounts.
 */
export function useSignalR() {
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("disconnected");
  const connectionRef = useRef<HubConnection | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const connection = getSignalRConnection();
    connectionRef.current = connection;

    // Track state changes (guarded by mounted flag)
    const updateState = () => {
      if (!mountedRef.current) return;
      switch (connection.state) {
        case HubConnectionState.Connected:
          setConnectionState("connected");
          break;
        case HubConnectionState.Reconnecting:
        case HubConnectionState.Connecting:
          setConnectionState("reconnecting");
          break;
        default:
          setConnectionState("disconnected");
          break;
      }
    };

    // Lifecycle handlers guarded by mountedRef to prevent stale updates.
    // SignalR does not expose a way to unregister onreconnecting/onreconnected/onclose,
    // so the mounted flag ensures callbacks become no-ops after unmount.
    connection.onreconnecting(() => {
      if (mountedRef.current) setConnectionState("reconnecting");
    });
    connection.onreconnected(() => {
      if (mountedRef.current) setConnectionState("connected");
    });
    connection.onclose(() => {
      if (mountedRef.current) setConnectionState("disconnected");
    });

    // Start connection
    startSignalRConnection()
      .then(() => updateState())
      .catch(() => {
        if (mountedRef.current) setConnectionState("disconnected");
      });

    return () => {
      // Mark as unmounted so lifecycle callbacks become no-ops.
      // Do not stop the singleton connection; other components may still use it.
      mountedRef.current = false;
      connectionRef.current = null;
    };
  }, []);

  /**
   * Subscribe to a SignalR event. Returns an unsubscribe function.
   */
  const on = useCallback(
    (eventName: string, handler: (...args: unknown[]) => void) => {
      const connection = connectionRef.current;
      if (!connection) return () => {};
      connection.on(eventName, handler);
      return () => {
        connection.off(eventName, handler);
      };
    },
    [],
  );

  /**
   * Invoke a hub method.
   */
  const invoke = useCallback(
    async (methodName: string, ...args: unknown[]): Promise<void> => {
      const connection = connectionRef.current;
      if (!connection || connection.state !== HubConnectionState.Connected) {
        return;
      }
      await connection.invoke(methodName, ...args);
    },
    [],
  );

  return {
    connectionState,
    connection: connectionRef.current,
    on,
    invoke,
  };
}
