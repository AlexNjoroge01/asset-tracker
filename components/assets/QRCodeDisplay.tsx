"use client";

import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface QRCodeDisplayProps {
  assetId: string;
  assetName: string;
}

export function QRCodeDisplay({ assetId, assetName }: QRCodeDisplayProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(`/api/assets/${assetId}/qr`);
  }, [assetId]);

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>QR Code - ${assetName}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;padding:40px;font-family:sans-serif;">
        <h2>${assetName}</h2>
        <img src="${src}" width="300" height="300" />
        <p style="font-size:11px;color:#666;margin-top:8px;">Scan to track this asset</p>
      </body></html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <Card className="border-border print-qr">
      <CardHeader>
        <CardTitle className="text-base">QR Code — {assetName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-white p-2">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`QR code for ${assetName}`}
              width={180}
              height={180}
              className="rounded"
            />
          ) : (
            <Skeleton className="h-[180px] w-[180px]" />
          )}
        </div>
        <div className="flex gap-2">
          {src && (
            <Button asChild variant="default" size="sm">
              <a href={src} download={`qr-${assetName.replace(/\s+/g, "-")}.png`}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
