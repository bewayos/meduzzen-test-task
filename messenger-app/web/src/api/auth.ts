import api from "./client";

export interface RegisterIn { email: string; username: string; password: string; }
export interface TokenOut { access_token: string; token_type: "bearer"; }

export async function register(data: RegisterIn): Promise<TokenOut> {
  const res = await api.post<TokenOut>("/auth/register", data);
  return res.data;
}

export async function login(username: string, password: string): Promise<TokenOut> {
  const res = await api.post<TokenOut>(`/auth/token?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  return res.data;
}
