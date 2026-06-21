import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assets, scans, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ScanPageClient } from "@/components/scan/ScanPageClient";
import type { Asset } from "@/types";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // All active assets for QR grid
  const assetRows = await db
    .select()
    .from(assets)
    .where(eq(assets.status, "active"))
    .orderBy(assets.name);

  const assetList: Asset[] = assetRows.map((a) => ({
    id: a.id,
    name: a.name,
    category: a.category as Asset["category"],
    description: a.description,
    qrCode: a.qrCode,
    status: a.status as Asset["status"],
    createdBy: a.createdBy,
    createdAt: a.createdAt,
    latestScan: null,
  }));

  // Recent 100 scans with asset + scanner info
  const scanRows = await db
    .select({
      id: scans.id,
      assetId: scans.assetId,
      assetName: assets.name,
      assetCategory: assets.category,
      scannedAt: scans.scannedAt,
      latitude: scans.latitude,
      longitude: scans.longitude,
      accuracy: scans.accuracy,
      deviceInfo: scans.deviceInfo,
      scannerName: users.name,
    })
    .from(scans)
    .innerJoin(assets, eq(scans.assetId, assets.id))
    .leftJoin(users, eq(scans.scannedBy, users.id))
    .orderBy(desc(scans.scannedAt))
    .limit(100);

  const recentScans = scanRows.map((s) => ({
    id: s.id,
    assetId: s.assetId,
    assetName: s.assetName,
    assetCategory: s.assetCategory,
    scannedAt: s.scannedAt.toISOString(),
    latitude: s.latitude as unknown as string,
    longitude: s.longitude as unknown as string,
    accuracy: s.accuracy as unknown as string | null,
    deviceInfo: s.deviceInfo,
    scannerName: s.scannerName,
  }));

  return <ScanPageClient assets={assetList} recentScans={recentScans} />;
}
