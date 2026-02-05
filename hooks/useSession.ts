"use client";

import { useState, useEffect } from "react";

const SESSION_KEY = "remik_session_id";

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = generateSessionId();
      localStorage.setItem(SESSION_KEY, id);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
