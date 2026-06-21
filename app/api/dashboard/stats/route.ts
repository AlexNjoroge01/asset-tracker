import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assets, scans } from "@/lib/db/schema";
import { eq, gte, count, max, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [[{ totalAssets }], [{ totalScans }], [{ lastScanTime }], activeTodayRows] =
    await Promise.all([
      db
        .select({ totalAssets: count() })
        .from(assets)
        .where(eq(assets.status, "active")),
      db.select({ totalScans: count() }).from(scans),
      db.select({ lastScanTime: max(scans.scannedAt) }).from(scans),
      db
        .selectDistinct({ assetId: scans.assetId })
        .from(scans)
        .where(gte(scans.scannedAt, oneDayAgo)),
    ]);

  return NextResponse.json({
    totalAssets,
    activeToday: activeTodayRows.length,
    lastScanTime,
    totalScans,
  });
}
