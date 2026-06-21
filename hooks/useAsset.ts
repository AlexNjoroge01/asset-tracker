"use client";

import useSWR from "swr";
import type { AssetWithScans } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAsset(id: string) {
  const { data, error, isLoading, mutate } = useSWR<AssetWithScans>(
    `/api/assets/${id}`,
    fetcher
  );

  return { asset: data, error, isLoading, mutate };
}
