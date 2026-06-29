"use client";

import useSWR from "swr";
import type { Asset } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAssets(params?: { status?: string; category?: string }) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  const qs = query.toString();

  const { data, error, isLoading, mutate } = useSWR<Asset[]>(
    `/api/assets${qs ? `?${qs}` : ""}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  return { assets: data ?? [], error, isLoading, mutate };
}
