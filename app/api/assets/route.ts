import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, scans, trackingSessions } from "@/lib/db/schema";
import { eq, and, desc, inArray, gt } from "drizzle-orm";
import { createAssetSchema } from "@/lib/validations/asset";
import type { AssetCategory, AssetStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const conditions = [];
  if (status) conditions.push(eq(assets.status, status as AssetStatus));
  if (category) conditions.push(eq(assets.category, category as AssetCategory));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const assetRows = await db
    .select()
    .from(assets)
    .where(whereClause);

  if (assetRows.length === 0) return NextResponse.json([]);

  const assetIds = assetRows.map((a) => a.id);

  // Fetch latest historical scan per asset
  const latestScanRows = await db
    .selectDistinctOn([scans.assetId], {
      assetId: scans.assetId,
      latitude: scans.latitude,
      longitude: scans.longitude,
      scannedAt: scans.scannedAt,
      accuracy: scans.accuracy,
    })
    .from(scans)
    .where(inArray(scans.assetId, assetIds))
    .orderBy(scans.assetId, desc(scans.scannedAt));

  // Fetch most recent active live tracking session per asset (updated within last 30s)
  const liveRows = await db
    .selectDistinctOn([trackingSessions.assetId], {
      assetId: trackingSessions.assetId,
      latitude: trackingSessions.latitude,
      longitude: trackingSessions.longitude,
      accuracy: trackingSessions.accuracy,
      updatedAt: trackingSessions.updatedAt,
    })
    .from(trackingSessions)
    .where(
      and(
        inArray(trackingSessions.assetId, assetIds),
        eq(trackingSessions.isActive, true),
        gt(trackingSessions.updatedAt, new Date(Date.now() - 30_000))
      )
    )
    .orderBy(trackingSessions.assetId, desc(trackingSessions.updatedAt));

  const latestByAsset = new Map(latestScanRows.map((s) => [s.assetId, s]));
  const liveByAsset = new Map(liveRows.map((l) => [l.assetId, l]));

  const result = assetRows.map((asset) => {
    const ls = latestByAsset.get(asset.id);
    const live = liveByAsset.get(asset.id);
    return {
      ...asset,
      latestScan: ls
        ? {
            latitude: parseFloat(ls.latitude as unknown as string),
            longitude: parseFloat(ls.longitude as unknown as string),
            scannedAt: ls.scannedAt,
            accuracy: ls.accuracy ? parseFloat(ls.accuracy as unknown as string) : null,
          }
        : null,
      liveSession: live
        ? {
            latitude: parseFloat(live.latitude as unknown as string),
            longitude: parseFloat(live.longitude as unknown as string),
            accuracy: live.accuracy ? parseFloat(live.accuracy as unknown as string) : null,
            updatedAt: live.updatedAt,
          }
        : null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [asset] = await db
    .insert(assets)
    .values({
      ...parsed.data,
      qrCode: crypto.randomUUID(),
      createdBy: session.user.id,
    })
    .returning();

  return NextResponse.json(asset, { status: 201 });
}
