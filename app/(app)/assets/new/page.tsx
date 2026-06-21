import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreateAssetForm } from "@/components/assets/CreateAssetForm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function NewAssetPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 p-4 pb-3 sm:p-6 sm:pb-4">
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
      <Separator />
      <CreateAssetForm />
    </div>
  );
}
