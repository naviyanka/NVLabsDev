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

// Listeners that are notified of connection state changes.
// Registered once on the singleton connection, these callbacks fan out
// state changes to all mounted useSignalR hook instances.
type StateListener = (state: SignalRConnectionState) => void;
const stateListeners = new Set<StateListener>();

function notifyListeners(state: SignalRConnectionState) {
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Build and return the singleton SignalR hub connection.
 * Connects to /hub/notifications with JWT token from localStorage.
 * Lifecycle handlers (onreconnecting, onreconnected, onclose) are registered
 * exactly once here so they don't accumulate across mount/unmount cycles.
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

  // Register lifecycle handlers once per connection lifetime.
  // These fan out state changes to all active useSignalR subscribers.
  connectionInstance.onreconnecting(() => {
    notifyListeners("reconnecting");
  });
  connectionInstance.onreconnected(() => {
    notifyListeners("connected");
  });
  connectionInstance.onclose(() => {
    notifyListeners("disconnected");
  });

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
 * Lifecycle handlers (onreconnecting, onreconnected, onclose) are registered
 * once in getSignalRConnection(). This hook subscribes to a lightweight
 * listener set that fans out state changes, avoiding handler accumulation
 * across mount/unmount cycles.
 */
export function useSignalR() {
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("disconnected");
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connection = getSignalRConnection();
    connectionRef.current = connection;

    // Derive current state from connection
    const getCurrentState = (): SignalRConnectionState => {
      switch (connection.state) {
        case HubConnectionState.Connected:
          return "connected";
        case HubConnectionState.Reconnecting:
        case HubConnectionState.Connecting:
          return "reconnecting";
        default:
          return "disconnected";
      }
    };

    // Subscribe to state changes from the singleton lifecycle handlers
    const listener: StateListener = (state) => {
      setConnectionState(state);
    };
    stateListeners.add(listener);

    // Start connection
    startSignalRConnection()
      .then(() => setConnectionState(getCurrentState()))
      .catch(() => setConnectionState("disconnected"));

    return () => {
      // Unsubscribe from state notifications on unmount
      stateListeners.delete(listener);
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
