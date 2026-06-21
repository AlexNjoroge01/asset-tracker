import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { User, Palette, Info } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account, appearance, and preferences.
        </p>
      </div>

      <Tabs defaultValue="appearance">
        <TabsList className="mb-2">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" />
            About
          </TabsTrigger>
        </TabsList>

        {/* ── Appearance ── */}
        <TabsContent value="appearance" className="mt-4">
          <AppearanceTab />
        </TabsContent>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  defaultValue={session.user?.name ?? ""}
                  readOnly
                  className="opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  defaultValue={session.user?.email ?? ""}
                  readOnly
                  className="opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  defaultValue={session.user?.role ?? "scanner"}
                  readOnly
                  className="opacity-70 capitalize"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Contact your administrator to update profile details.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── About ── */}
        <TabsContent value="about" className="mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">App Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Application</span>
                <span className="font-medium">
                  {process.env.NEXT_PUBLIC_APP_NAME ?? "QR Asset Tracker"}
                </span>
              </div>
              <Separator className="opacity-40" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Map tiles</span>
                <span className="font-medium">CartoDB Dark Matter</span>
              </div>
              <Separator className="opacity-40" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scanner engine</span>
                <span className="font-medium">html5-qrcode</span>
              </div>
              <Separator className="opacity-40" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database</span>
                <span className="font-medium">Neon PostgreSQL</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
