import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { scans, users } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assetId } = await params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const offset = (page - 1) * limit;

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(scans)
    .where(eq(scans.assetId, assetId));

  const rows = await db
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
    .where(eq(scans.assetId, assetId))
    .orderBy(desc(scans.scannedAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({
    scans: rows.map((s) => ({
      ...s,
      latitude: parseFloat(s.latitude as unknown as string),
      longitude: parseFloat(s.longitude as unknown as string),
      accuracy: s.accuracy ? parseFloat(s.accuracy as unknown as string) : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
