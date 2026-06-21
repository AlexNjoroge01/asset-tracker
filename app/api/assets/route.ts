import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, scans } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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

  // Fetch latest scan per asset using DISTINCT ON (asset_id) ordered by scanned_at DESC
  const assetIds = assetRows.map((a) => a.id);

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

  const latestByAsset = new Map(latestScanRows.map((s) => [s.assetId, s]));

  const result = assetRows.map((asset) => {
    const ls = latestByAsset.get(asset.id);
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
