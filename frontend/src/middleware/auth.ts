export function authHeader() {
  if (typeof window === "undefined") return {} as Record<string, string>;
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
