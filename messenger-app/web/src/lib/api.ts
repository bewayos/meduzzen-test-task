import { useAuth } from "../store/auth";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function api<T>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const token =
    useAuth.getState().token ?? localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> | undefined),
  };

  const isFormData =
    typeof FormData !== "undefined" && opts.body instanceof FormData;

  if (!isFormData && !("Content-Type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (res.json() as unknown) as T;
}
