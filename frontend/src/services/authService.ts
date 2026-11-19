import { api } from "./api";
import type { Gender, TokenResponse, User } from "@/utils/types";

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  gender: Gender;
  date_of_birth: string;
  height_cm: number;
  weight_kg: number;
}

export const authService = {
  login: (email: string, password: string, remember_me: boolean) =>
    api.post<TokenResponse>("/auth/login", { email, password, remember_me }).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<TokenResponse>("/auth/register", payload).then((r) => r.data),

  google: (credential: string) =>
    api.post<TokenResponse>("/auth/google", { credential }).then((r) => r.data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>("/auth/reset-password", { token, password }).then((r) => r.data),

  toggleFavorite: (brand: string) =>
    api.post<User>(`/users/me/favorites/${encodeURIComponent(brand)}`).then((r) => r.data),

  updateProfile: (changes: Partial<User>) => api.patch<User>("/users/me", changes).then((r) => r.data),
};
