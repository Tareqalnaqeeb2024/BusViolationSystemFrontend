import { request } from "./apiClient";

export const authService = {
  login: (username: string, password: string) =>
    request<{ token: string; user: unknown }>({
      url: "auth/login",
      method: "POST",
      data: { username, password },
    }),
  me: () => request<unknown>({ url: "auth/me", method: "GET" }),
  logout: () => request<void>({ url: "auth/logout", method: "POST" }),
};
