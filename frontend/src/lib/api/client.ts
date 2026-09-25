/**
 * Single place that knows whether we're talking to the real backend or
 * running against local mocks. Every service in lib/api/* goes through
 * this file — nothing else in the app should reference `fetch` directly
 * or read `import.meta.env` for API config.
 *
 * Mock mode (default, VITE_USE_MOCKS!=="false") keeps the whole app usable
 * without Docker: OTP codes surface in the UI banner, data persists to
 * localStorage exactly as before, and the new sections (OCR import, GST
 * desk, calendar, AI chat, reviews) run on in-memory fakes.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
export { BASE_URL };
const TOKEN_KEY = "gig:session-token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Mock-mode session: mirrors the backend's cookie session in localStorage. */
export const mockSessionStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(mobile: string) {
    localStorage.setItem(TOKEN_KEY, `mock-session:${mobile}`);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export function mockDelay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include", // send the httpOnly session cookie
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    let message = `Request to ${path} failed with ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep default message */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
