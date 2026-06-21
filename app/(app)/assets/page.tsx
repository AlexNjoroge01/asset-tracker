import { Suspense } from "react";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetFilters } from "@/components/assets/AssetFilters";
import { AssetTable } from "@/components/assets/AssetTable";
import { AssetTableSkeleton } from "@/components/assets/AssetTableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assets } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { Asset, AssetCategory, AssetStatus } from "@/types";

async function getAssets(params: {
  status?: string;
  category?: string;
}): Promise<Asset[]> {
  const conditions = [];
  if (params.status) conditions.push(eq(assets.status, params.status as AssetStatus));
  if (params.category) conditions.push(eq(assets.category, params.category as AssetCategory));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

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
      latestScanLat: sql<string>`(SELECT latitude FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanLng: sql<string>`(SELECT longitude FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanAt: sql<string>`(SELECT scanned_at FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
      latestScanAccuracy: sql<string>`(SELECT accuracy FROM scans WHERE asset_id = ${assets.id} ORDER BY scanned_at DESC LIMIT 1)`,
    })
    .from(assets)
    .where(where)
    .orderBy(assets.createdAt);

  return rows.map((r) => ({
    ...r,
    latestScan: r.latestScanLat
      ? {
          latitude: parseFloat(r.latestScanLat),
          longitude: parseFloat(r.latestScanLng!),
          scannedAt: new Date(r.latestScanAt!),
          accuracy: r.latestScanAccuracy ? parseFloat(r.latestScanAccuracy) : null,
        }
      : null,
  })) as Asset[];
}

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

export default async function AssetsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const assetList = await getAssets(params);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {assetList.length} asset{assetList.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Asset
          </Link>
        </Button>
      </div>

      <Suspense fallback={null}>
        <AssetFilters />
      </Suspense>

      {assetList.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No assets yet"
          description="Create your first asset to start tracking it with a QR code."
          actionLabel="Create Asset"
          actionHref="/assets/new"
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Suspense fallback={<AssetTableSkeleton />}>
            <AssetTable assets={assetList} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
