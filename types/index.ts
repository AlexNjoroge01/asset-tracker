export type UserRole = "admin" | "scanner";

export type AssetCategory =
  | "laptop"
  | "phone"
  | "router"
  | "tablet"
  | "other";

export type AssetStatus = "active" | "inactive" | "lost";

export type GpsAccuracyLevel = "high" | "medium" | "low";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface LatestScan {
  latitude: number;
  longitude: number;
  scannedAt: Date;
  accuracy: number | null;
}

export interface LiveSession {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  description: string | null;
  qrCode: string;
  status: AssetStatus;
  createdBy: string | null;
  createdAt: Date;
  latestScan: LatestScan | null;
  liveSession: LiveSession | null;
}

export interface Scan {
  id: string;
  assetId: string;
  scannedBy: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  notes: string | null;
  deviceInfo: string | null;
  scannedAt: Date;
  scannerName?: string;
}

export interface AssetWithScans extends Asset {
  scans: Scan[];
}

export interface PaginatedScans {
  scans: Scan[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  totalAssets: number;
  activeToday: number;
  lastScanTime: Date | null;
  totalScans: number;
}
