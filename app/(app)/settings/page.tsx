import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input defaultValue={session.user?.name ?? ""} readOnly className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={session.user?.email ?? ""} readOnly className="opacity-60" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input defaultValue={session.user?.role ?? "scanner"} readOnly className="opacity-60 capitalize" />
          </div>
          <p className="text-xs text-muted-foreground">
            Contact your administrator to update your profile details.
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">App:</span>{" "}
            {process.env.NEXT_PUBLIC_APP_NAME ?? "QR Asset Tracker"}
          </p>
          <p>
            <span className="text-foreground font-medium">Map tiles:</span> CartoDB Dark Matter
          </p>
          <p>
            <span className="text-foreground font-medium">Scanner:</span> html5-qrcode (browser-native)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
