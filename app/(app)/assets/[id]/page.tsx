import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assets, scans, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { AssetDetailTabs } from "@/components/assets/AssetDetailTabs";
import type { AssetWithScans } from "@/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssetDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;

  const [asset] = await db
    .select()
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

  const parsedScans = scanRows.map((s) => ({
    ...s,
    latitude: parseFloat(s.latitude as unknown as string),
    longitude: parseFloat(s.longitude as unknown as string),
    accuracy: s.accuracy ? parseFloat(s.accuracy as unknown as string) : null,
    scannerName: s.scannerName ?? undefined,
  }));

  const latest = parsedScans[0] ?? null;

  const assetWithScans: AssetWithScans = {
    id: asset.id,
    name: asset.name,
    category: asset.category as AssetWithScans["category"],
    description: asset.description,
    qrCode: asset.qrCode,
    status: asset.status as AssetWithScans["status"],
    createdBy: asset.createdBy,
    createdAt: asset.createdAt,
    latestScan: latest
      ? {
          latitude: latest.latitude,
          longitude: latest.longitude,
          scannedAt: latest.scannedAt,
          accuracy: latest.accuracy,
        }
      : null,
    scans: parsedScans,
  };

  return <AssetDetailTabs asset={assetWithScans} />;
}
