import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assets, scans, users } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AssetDetailTabs } from "@/components/assets/AssetDetailTabs";
import type { AssetWithScans } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const [asset] = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      description: assets.description,
      qrCode: assets.qrCode,
      status: assets.status,
      createdBy: assets.createdBy,
      createdAt: assets.createdAt,
      latestScanLat: sql<string>`(SELECT latitude FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanLng: sql<string>`(SELECT longitude FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanAt: sql<string>`(SELECT scanned_at FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanAccuracy: sql<string>`(SELECT accuracy FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
    })
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1);

  if (!asset) notFound();

  const scanRows = await db
    .select({
      id: scans.id,
      assetId: scans.assetId,
      scannedBy: scans.scannedBy,
      latitude: scans.latitude,
      longitude: scans.longitude,
      accuracy: scans.accuracy,
      notes: scans.notes,
      deviceInfo: scans.deviceInfo,
      scannedAt: scans.scannedAt,
      scannerName: users.name,
    })
    .from(scans)
    .leftJoin(users, eq(scans.scannedBy, users.id))
    .where(eq(scans.assetId, id))
    .orderBy(desc(scans.scannedAt));

  const assetWithScans: AssetWithScans = {
    ...(asset as unknown as AssetWithScans),
    latestScan: asset.latestScanLat
      ? {
          latitude: parseFloat(asset.latestScanLat),
          longitude: parseFloat(asset.latestScanLng!),
          scannedAt: new Date(asset.latestScanAt!),
          accuracy: asset.latestScanAccuracy ? parseFloat(asset.latestScanAccuracy) : null,
        }
      : null,
    scans: scanRows.map((s) => ({
      ...s,
      latitude: parseFloat(s.latitude as unknown as string),
      longitude: parseFloat(s.longitude as unknown as string),
      accuracy: s.accuracy ? parseFloat(s.accuracy as unknown as string) : null,
      scannerName: s.scannerName ?? undefined,
    })),
  };

  return <AssetDetailTabs asset={assetWithScans} />;
}
