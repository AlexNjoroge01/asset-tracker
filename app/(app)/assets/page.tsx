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
import { assets, scans } from "@/lib/db/schema";
import { and, eq, desc, inArray } from "drizzle-orm";
import type { Asset, AssetCategory, AssetStatus } from "@/types";

export const dynamic = "force-dynamic";

async function getAssets(params: {
  status?: string;
  category?: string;
}): Promise<Asset[]> {
  const conditions = [];
  if (params.status)   conditions.push(eq(assets.status,   params.status   as AssetStatus));
  if (params.category) conditions.push(eq(assets.category, params.category as AssetCategory));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const assetRows = await db
    .select()
    .from(assets)
    .where(where)
    .orderBy(assets.createdAt);

  if (assetRows.length === 0) return [];

  const assetIds = assetRows.map((a) => a.id);

  const latestScanRows = await db
    .selectDistinctOn([scans.assetId], {
      assetId:   scans.assetId,
      latitude:  scans.latitude,
      longitude: scans.longitude,
      scannedAt: scans.scannedAt,
      accuracy:  scans.accuracy,
    })
    .from(scans)
    .where(inArray(scans.assetId, assetIds))
    .orderBy(scans.assetId, desc(scans.scannedAt));

  const latestByAsset = new Map(latestScanRows.map((s) => [s.assetId, s]));

  return assetRows.map((asset) => {
    const ls = latestByAsset.get(asset.id);
    return {
      ...asset,
      category: asset.category as Asset["category"],
      status:   asset.status   as Asset["status"],
      latestScan: ls
        ? {
            latitude:  parseFloat(ls.latitude  as unknown as string),
            longitude: parseFloat(ls.longitude as unknown as string),
            scannedAt: ls.scannedAt,
            accuracy:  ls.accuracy ? parseFloat(ls.accuracy as unknown as string) : null,
          }
        : null,
    };
  });
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
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center justify-between gap-3">
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
        <div className="rounded-lg border border-border overflow-x-auto">
          <Suspense fallback={<AssetTableSkeleton />}>
            <AssetTable assets={assetList} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
