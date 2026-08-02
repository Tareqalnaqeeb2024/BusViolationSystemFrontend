// Mock data used for the Dashboard until the real API is wired.
export type MockViolation = {
  id: string;
  plate: string;
  plateType: "خصوصي" | "أجرة" | "شحن";
  location: string;
  date: string;
  status: "pending" | "processed" | "cancelled";
};

export type MockImpound = {
  id: string;
  plate: string;
  reason: string;
  date: string;
  status: "active" | "released";
};

export const MOCK_STATS = {
  totalViolations: 1287,
  todayViolations: 24,
  activeImpounds: 63,
  releasedThisMonth: 41,
};

export const MOCK_MONTHLY = [
  { month: "يناير", violations: 82, impounds: 28 },
  { month: "فبراير", violations: 96, impounds: 33 },
  { month: "مارس", violations: 110, impounds: 41 },
  { month: "أبريل", violations: 143, impounds: 52 },
  { month: "مايو", violations: 128, impounds: 45 },
  { month: "يونيو", violations: 168, impounds: 58 },
  { month: "يوليو", violations: 155, impounds: 49 },
];

export const MOCK_BY_TYPE = [
  { name: "أجرة", value: 612 },
  { name: "خصوصي", value: 431 },
  { name: "شحن", value: 244 },
];

export const MOCK_RECENT_VIOLATIONS: MockViolation[] = [
  { id: "V-1042", plate: "2356-1", plateType: "أجرة", location: "بيت بوس", date: "2026-07-26 09:14", status: "pending" },
  { id: "V-1041", plate: "8891-3", plateType: "خصوصي", location: "شميلة", date: "2026-07-26 08:52", status: "processed" },
  { id: "V-1040", plate: "1204-2", plateType: "شحن", location: "دار سلم", date: "2026-07-25 22:03", status: "processed" },
  { id: "V-1039", plate: "7712-1", plateType: "أجرة", location: "بيت بوس", date: "2026-07-25 19:41", status: "cancelled" },
  { id: "V-1038", plate: "3320-4", plateType: "خصوصي", location: "شميلة", date: "2026-07-25 17:12", status: "pending" },
];

export const MOCK_RECENT_IMPOUNDS: MockImpound[] = [
  { id: "I-207", plate: "2356-1", reason: "تكرار المخالفة", date: "2026-07-26", status: "active" },
  { id: "I-206", plate: "5540-2", reason: "عدم دفع مخالفات", date: "2026-07-25", status: "active" },
  { id: "I-205", plate: "1102-1", reason: "قيادة بدون رخصة", date: "2026-07-24", status: "released" },
  { id: "I-204", plate: "9987-3", reason: "مخالفات متعددة", date: "2026-07-23", status: "released" },
];
