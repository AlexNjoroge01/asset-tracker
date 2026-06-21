"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const QRScanner = dynamic(
  () => import("./QRScanner").then((m) => m.QRScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center gap-3 px-4">
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="w-full aspect-square max-w-sm rounded-xl" />
      </div>
    ),
  }
);

export function QRScannerWrapper() {
  return <QRScanner />;
}
