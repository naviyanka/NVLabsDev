/**
 * Captures uncaught errors during SSR so they can be reported
 * in the response instead of being swallowed by the framework.
 */

let lastCapturedError: Error | null = null;

// Capture unhandled errors during SSR
if (typeof process !== "undefined") {
  process.on("uncaughtException", (err) => {
    lastCapturedError = err instanceof Error ? err : new Error(String(err));
  });
}

export function consumeLastCapturedError(): Error | null {
  const err = lastCapturedError;
  lastCapturedError = null;
  return err;
}
