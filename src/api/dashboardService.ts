import { request } from "./apiClient";

// ==================== Enums (مطابقة للباك اند بالضبط) ====================

export enum EnPlateType {
  Private = 1,
  Taxi = 2,
  Transport = 3,
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

export enum EnVehicleType {
  PrivateCar = 1,
  Bus = 2,
  Truck = 3,
  Motorcycle = 4,
}

export enum EnImpoundReason {
  CheckpointSystem = 1,
  FormingCheckpoint = 2,
  ObstructingTraffic = 3,
  RecklessDriving = 4,
  WorkingOutsideRoute = 5,
  NoRouteSticker = 6,
  Accident = 7,
  WrongWay = 8,
}

export enum EnImpoundStatus {
  Impounded = 1,
  Released = 2,
}

export enum EnViolationStatus {
  Active = 1,
  Cancelled = 2,
}

// ==================== خرائط الأسماء (عربي) ====================

export const PLATE_TYPE_LABELS: Record<number, string> = {
  [EnPlateType.Private]: "خصوصي",
  [EnPlateType.Taxi]: "أجرة",
  [EnPlateType.Transport]: "شحن",
};

export const VIOLATION_TYPE_LABELS: Record<number, string> = {
  [EnViolationType.CheckpointSystem]: "نظام فرزة",
  [EnViolationType.FormingCheckpoint]: "تشكيل فرزة",
  [EnViolationType.ObstructingTraffic]: "عرقلة حركة السير",
  [EnViolationType.RecklessDriving]: "مستهتر",
  [EnViolationType.WorkingOutsideRoute]: "العمل في غير خطه",
  [EnViolationType.NoRouteSticker]: "بدون طبعة خط",
  [EnViolationType.WrongWay]: "عاكس خط",
};

export const VEHICLE_TYPE_LABELS: Record<number, string> = {
  [EnVehicleType.PrivateCar]: "خصوصي",
  [EnVehicleType.Bus]: "باص",
  [EnVehicleType.Truck]: "شحن",
  [EnVehicleType.Motorcycle]: "دراجة نارية",
};

export const IMPOUND_REASON_LABELS: Record<number, string> = {
  [EnImpoundReason.CheckpointSystem]: "نظام فرزة",
  [EnImpoundReason.FormingCheckpoint]: "تشكيل فرزة",
  [EnImpoundReason.ObstructingTraffic]: "عرقلة حركة السير",
  [EnImpoundReason.RecklessDriving]: "مستهتر",
  [EnImpoundReason.WorkingOutsideRoute]: "العمل في غير خطه",
  [EnImpoundReason.NoRouteSticker]: "بدون طبعة خط",
  [EnImpoundReason.Accident]: "حادث",
  [EnImpoundReason.WrongWay]: "عاكس خط",
};

export const IMPOUND_STATUS_LABELS: Record<number, { label: string; tone: "warning" | "success" }> = {
  [EnImpoundStatus.Impounded]: { label: "محجوزة", tone: "warning" },
  [EnImpoundStatus.Released]: { label: "أُفرج عنها", tone: "success" },
};

export const VIOLATION_STATUS_LABELS: Record<number, { label: string; tone: "warning" | "danger" }> = {
  [EnViolationStatus.Active]: { label: "فعالة", tone: "warning" },
  [EnViolationStatus.Cancelled]: { label: "ملغاة", tone: "danger" },
};

// ==================== DTOs ====================

export type RecentViolationDto = {
  id: number;
  plateNumber: number;
  governorateNumber: number;
  plateType: EnPlateType;
  violationType: EnViolationType;
  violationDate: string;
  notes?: string | null;
};

export type RecentImpoundDto = {
  id: number;
  plateNumber: number;
  governorateNumber: number;
  plateType: EnPlateType;
  impoundReason: EnImpoundReason;
  impoundDate: string;
  releaseDate?: string | null;
  driverName?: string | null;
  status: EnImpoundStatus;
};

export type TopViolatingVehicleDto = {
  vehicleId: number;
  plateNumber: number;
  governorateNumber: number;
  plateType: EnPlateType;
  vehicleType: EnVehicleType;
  violationsCount: number;
};

export type DashboardStatisticsResponse = {
  totalViolations: number;
  totalImpounds: number;
  totalReleases: number;
  activeImpoundsCount: number;
  recentViolations: RecentViolationDto[];
  recentImpounds: RecentImpoundDto[];
  topViolatingVehicles: TopViolatingVehicleDto[];
};

export type StatisticsPeriod = "day" | "week" | "month" | "year";

// ==================== Service ====================

export const dashboardService = {
  statistics: (period: StatisticsPeriod = "month") =>
    request<DashboardStatisticsResponse>({
      url: "dashboard/statistics",
      method: "GET",
      params: { period },
    }),
};