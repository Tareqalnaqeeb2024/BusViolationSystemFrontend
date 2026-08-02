import { request } from "./apiClient";

export const impoundService = {
  list: (params?: Record<string, unknown>) =>
    request({ url: "impounds", method: "GET", params }),
  register: (data: Record<string, unknown>) =>
    request({ url: "impounds/register", method: "POST", data }),
  release: (id: string | number, data: Record<string, unknown>) =>
    request({ url: `impounds/${id}/release`, method: "POST", data }),
  // Release endpoint that matches the C# controller: PUT /api/impounds/release
  releaseByRequest: (data: Record<string, unknown>) =>
    request({ url: "impounds/release", method: "PUT", data }),
  getById: (id: string | number) => request({ url: `impounds/${id}`, method: "GET" }),
};
