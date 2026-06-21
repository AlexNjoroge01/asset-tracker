import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Asset } from "@/types";

const AssetMapInner = dynamic(() => import("./AssetMapInner"), {
  ssr: false,
  loading: () => (
    <Skeleton className="w-full h-full rounded-none" />
  ),
});

interface AssetMapProps {
  assets: Asset[];
  selectedAssetId?: string | null;
  onAssetSelect?: (id: string) => void;
}

export function AssetMap(props: AssetMapProps) {
  return <AssetMapInner {...props} />;
}
