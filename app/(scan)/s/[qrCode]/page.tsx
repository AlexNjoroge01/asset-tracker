import { Radio } from "lucide-react";
import { ScanLanding } from "@/components/scanner/ScanLanding";

interface PageProps {
  params: Promise<{ qrCode: string }>;
}

export default async function ScanLandingPage({ params }: PageProps) {
  const { qrCode } = await params;

  return (
    <div className="flex items-start justify-center p-4 pt-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Radio className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "QR Asset Tracker"}
          </h1>
          <p className="text-sm text-muted-foreground">Starting live tracking…</p>
        </div>

        <ScanLanding qrCode={qrCode} />
      </div>
    </div>
  );
}
