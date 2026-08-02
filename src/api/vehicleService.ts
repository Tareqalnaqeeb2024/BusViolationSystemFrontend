import { request } from "./apiClient";

export const vehicleService = {
  // Match backend Swagger: GET /api/Vehicles/search?PlateNumber=...&GovernorateNumber=...&PlateType=...
  search: (params: { PlateNumber?: string; GovernorateNumber?: string; PlateType?: string }) =>
    request({ url: "Vehicles/search", method: "GET", params }),
  getById: (id: string | number) => request({ url: `vehicles/${id}`, method: "GET" }),
};
