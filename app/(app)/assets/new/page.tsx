import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateAssetForm } from "@/components/assets/CreateAssetForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewAssetPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold">New Asset</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new asset and generate its QR code
          </p>
        </div>
      </div>
      <CreateAssetForm />
    </div>
  );
}
