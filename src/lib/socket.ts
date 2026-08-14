import { io, Socket } from "socket.io-client";

export interface FailedScanPayload {
  code: string;
  member: string;
  message: string;
}

/**
 * REST clients may use NEXT_PUBLIC_TMS_API_URL with an `/api` suffix, but
 * Socket.io is served from the HTTP server root — strip the suffix for sockets.
 */
export function getSocketServerUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_TMS_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_TMS_API_URL environment variable is not set");
  }
  return apiUrl.replace(/\/api\/?$/, "");
}

/**
 * Create a Socket.IO client. Pass an auth token when available (coach memory JWT).
 * Full cookie-based handshake requires API support — see SECURITY_AUDIT_TRACKER.md.
 */
export function createTmsSocket(authToken?: string | null): Socket {
  return io(getSocketServerUrl(), {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    auth: authToken ? { token: authToken } : undefined,
  });
}

export function formatFailedScanToast(payload: FailedScanPayload): string {
  const member = payload.member?.trim() || "Member";
  const message = payload.message?.trim() || payload.code || "Scan failed";
  return `${member}: ${message}`;
}
