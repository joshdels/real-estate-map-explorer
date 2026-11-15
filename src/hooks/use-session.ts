"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getSession, type Session } from "@/lib/session";

const sessionListeners = new Set<() => void>();
let sessionKey = "null";
let sessionValue: Session | null = null;

function subscribeToSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

// useSyncExternalStore needs a stable reference while the value is unchanged.
function sessionSnapshot(): Session | null {
  const current = getSession();
  const key = JSON.stringify(current);
  if (key !== sessionKey) {
    sessionKey = key;
    sessionValue = current;
  }
  return sessionValue;
}

/**
 * The local demo session. It is null during server render and hydration, then
 * read from session storage. Call the returned function after changing it.
 */
export function useSession(): [Session | null, () => void] {
  const session = useSyncExternalStore(subscribeToSession, sessionSnapshot, () => null);
  const refresh = useCallback(() => sessionListeners.forEach((listener) => listener()), []);
  return [session, refresh];
}
