import { create } from "zustand";

export type AuthState = {
  token: string | null;
  login: (t: string) => void;
  logout: () => void;
  setToken: (t: string | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("access_token") : null,
  login: (t) => {
    localStorage.setItem("access_token", t);
    set({ token: t });
  },
  setToken: (t) => {
    if (t) localStorage.setItem("access_token", t);
    else localStorage.removeItem("access_token");
    set({ token: t });
  },
  logout: () => {
    localStorage.removeItem("access_token");
    set({ token: null });
  },
}));
