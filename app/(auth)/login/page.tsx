import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { QrCode } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <QrCode className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {process.env.NEXT_PUBLIC_APP_NAME ?? "QR Asset Tracker"}
        </h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-lg" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
