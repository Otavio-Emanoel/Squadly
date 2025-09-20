export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

export type ApiError = {
  message: string;
  status?: number;
  details?: unknown;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...options, headers, credentials: "include" });

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const err: ApiError = {
      message: (data && (data.message || data.error)) || res.statusText,
      status: res.status,
      details: data,
    };
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/api/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post<AuthResponse>("/api/users", { name, email, password }),
};
