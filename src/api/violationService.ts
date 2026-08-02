import { request } from "./apiClient";

export enum EnViolationStatus {
  Active = 1,
  Cancelled = 2,
}

export enum EnViolationType {
  CheckpointSystem = 1,
  FormingCheckpoint = 2,
  ObstructingTraffic = 3,
  RecklessDriving = 4,
  WorkingOutsideRoute = 5,
  NoRouteSticker = 6,
  WrongWay = 7,
}

export enum EnPlateType {
  Private = 1,
  Taxi = 2,
  Transport = 3,
}

export type ViolationItem = {
  id: number;
  vehiclePlateNumber?: number | null;
  vehicleGovernorateNumber?: number | null;
  vehiclePlateType?: EnPlateType | null;
  violationType: EnViolationType;
  violationDate: string;
  notes?: string | null;
  status: EnViolationStatus;
  impoundId?: number | null;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
};

export type ViolationListParams = {
  PlateNumber?: number;
  GovernorateNumber?: number;
  pageNumber?: number;
  pageSize?: number;
};

export const violationService = {
  list: (params?: ViolationListParams) =>
    request<PagedResult<ViolationItem>>({ url: "Violations", method: "GET", params }),
  getById: (id: string | number) =>
    request<ViolationItem>({ url: `Violations/${id}`, method: "GET" }),
  register: (data: Record<string, unknown>) =>
    request<ViolationItem>({ url: "Violations/Register", method: "POST", data }),
  cancel: (id: string | number) =>
    request<void>({ url: `Violations/${id}/cancel`, method: "POST" }),
  remove: (id: string | number) =>
    request<void>({ url: `Violations/${id}`, method: "DELETE" }),
};