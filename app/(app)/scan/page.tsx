import { ScanLine } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { QRScannerWrapper } from "@/components/scanner/QRScannerWrapper";

export default async function ScanPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <ScanLine className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-sm font-semibold">Scan Asset</h1>
          <p className="text-xs text-muted-foreground">
            Point your camera at an asset QR code
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-6">
        <QRScannerWrapper />
      </div>
    </div>
  );
}
