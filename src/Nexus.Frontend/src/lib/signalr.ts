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
 */
export function useSignalR() {
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("disconnected");
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connection = getSignalRConnection();
    connectionRef.current = connection;

    // Track state changes
    const updateState = () => {
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

    connection.onreconnecting(() => setConnectionState("reconnecting"));
    connection.onreconnected(() => setConnectionState("connected"));
    connection.onclose(() => setConnectionState("disconnected"));

    // Start connection
    startSignalRConnection()
      .then(() => updateState())
      .catch(() => setConnectionState("disconnected"));

    return () => {
      // Do not stop the singleton connection on unmount;
      // other components may still use it.
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
