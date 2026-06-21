import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { db } from "@/lib/db";
import { assets, scans } from "@/lib/db/schema";
import { eq, gte, count, max } from "drizzle-orm";
import type { DashboardStats } from "@/types";

async function getStats(): Promise<DashboardStats> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [[{ totalAssets }], [{ totalScans }], [{ lastScanTime }], activeTodayRows] =
      await Promise.all([
        db.select({ totalAssets: count() }).from(assets).where(eq(assets.status, "active")),
        db.select({ totalScans: count() }).from(scans),
        db.select({ lastScanTime: max(scans.scannedAt) }).from(scans),
        db.selectDistinct({ assetId: scans.assetId }).from(scans).where(gte(scans.scannedAt, oneDayAgo)),
      ]);

    return {
      totalAssets,
      activeToday: activeTodayRows.length,
      lastScanTime: lastScanTime ?? null,
      totalScans,
    };
  } catch {
    return { totalAssets: 0, activeToday: 0, lastScanTime: null, totalScans: 0 };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const stats = await getStats();

  return <DashboardShell initialStats={stats} />;
}
