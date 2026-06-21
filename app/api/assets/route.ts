import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, scans } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createAssetSchema } from "@/lib/validations/asset";
import type { AssetCategory, AssetStatus } from "@/types";

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

  const rows = await db
    .select({
      id: assets.id,
      name: assets.name,
      category: assets.category,
      description: assets.description,
      qrCode: assets.qrCode,
      status: assets.status,
      createdBy: assets.createdBy,
      createdAt: assets.createdAt,
      latestScanLat: sql<string>`(
        SELECT latitude FROM scans
        WHERE asset_id = ${assets.id}
        ORDER BY scanned_at DESC LIMIT 1
      )`,
      latestScanLng: sql<string>`(
        SELECT longitude FROM scans
        WHERE asset_id = ${assets.id}
        ORDER BY scanned_at DESC LIMIT 1
      )`,
      latestScanAt: sql<string>`(
        SELECT scanned_at FROM scans
        WHERE asset_id = ${assets.id}
        ORDER BY scanned_at DESC LIMIT 1
      )`,
      latestScanAccuracy: sql<string>`(
        SELECT accuracy FROM scans
        WHERE asset_id = ${assets.id}
        ORDER BY scanned_at DESC LIMIT 1
      )`,
    })
    .from(assets)
    .where(whereClause);

  const result = rows.map((r) => ({
    ...r,
    latestScan: r.latestScanLat
      ? {
          latitude: parseFloat(r.latestScanLat),
          longitude: parseFloat(r.latestScanLng!),
          scannedAt: new Date(r.latestScanAt!),
          accuracy: r.latestScanAccuracy ? parseFloat(r.latestScanAccuracy) : null,
        }
      : null,
    latestScanLat: undefined,
    latestScanLng: undefined,
    latestScanAt: undefined,
    latestScanAccuracy: undefined,
  }));

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
