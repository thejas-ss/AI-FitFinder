import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { User } from "@/utils/types";

interface AuthState {
  token: string | null;
  user: User | null;
  remember: boolean;
  setSession: (token: string, user: User, remember?: boolean) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const KEY = "fitfinder-auth";

/**
 * "Remember me" keeps the session in localStorage (survives browser restarts);
 * otherwise it lives in sessionStorage and disappears when the tab closes.
 */
const sessionAwareStorage = {
  getItem: (name: string) => localStorage.getItem(name) ?? sessionStorage.getItem(name),
  setItem: (name: string, value: string) => {
    const remember = JSON.parse(value)?.state?.remember;
    (remember ? localStorage : sessionStorage).setItem(name, value);
    (remember ? sessionStorage : localStorage).removeItem(name);
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      remember: false,
      setSession: (token, user, remember = false) => set({ token, user, remember }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, remember: false }),
    }),
    { name: KEY, storage: createJSONStorage(() => sessionAwareStorage) },
  ),
);
