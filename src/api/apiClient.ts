// import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

// const BASE_URL =
//   (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
//   "http://localhost:5206/api";

// const TOKEN_KEY = "auth_token";

// export function getToken(): string | null {
//   if (typeof window === "undefined") return null;
//   return window.localStorage.getItem(TOKEN_KEY);
// }
// export function setToken(token: string | null) {
//   if (typeof window === "undefined") return;
//   if (token) window.localStorage.setItem(TOKEN_KEY, token);
//   else window.localStorage.removeItem(TOKEN_KEY);
// }

// export const apiClient: AxiosInstance = axios.create({
//   baseURL: BASE_URL,
//   timeout: 20_000,
//   headers: { "Content-Type": "application/json", Accept: "application/json" },
// });

// apiClient.interceptors.request.use((config) => {
//   const token = getToken();
//   if (token) {
//     config.headers = config.headers ?? {};
//     (config.headers as any).Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// apiClient.interceptors.response.use(
//   (res) => res,
//   (error) => {
//     const status = error?.response?.status;
//     const message =
//       error?.response?.data?.message ||
//       error?.response?.data?.error ||
//       error?.message ||
//       "حدث خطأ غير متوقع";
//     if (status === 401 && typeof window !== "undefined") {
//       setToken(null);
//     }
//     return Promise.reject({ status, message, raw: error });
//   },
// );

// export async function request<T>(config: AxiosRequestConfig): Promise<T> {
//   const res = await apiClient.request<T>(config);
//   return res.data;
// }






import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  // "https://busviolationsystembackend-production.up.railway.app/api/";
  "https://busviolationsystembackend.onrender.com/api/";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_info";

export interface UserInfo {
  fullName: string;
  userName: string;
  role: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function setUserInfo(user: UserInfo | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

export function getUserInfo(): UserInfo | null {
  if (typeof window === "undefined") return null;
  const data = window.localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function logout() {
  setToken(null);
  setUserInfo(null);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "حدث خطأ غير متوقع";
    if (status === 401 && typeof window !== "undefined") {
      logout();
      window.location.href = "/login";
    }
    return Promise.reject({ status, message, raw: error });
  }
);

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.request<T>(config);
  return res.data;
}