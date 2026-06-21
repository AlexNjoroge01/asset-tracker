"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Loader2, Smartphone, Tablet, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { formatCoords, formatRelativeTime } from "@/lib/utils";
import { parseDeviceInfo } from "@/lib/device";
import { updateAssetSchema, type UpdateAssetInput } from "@/lib/validations/asset";
import type { AssetWithScans } from "@/types";

const statusVariant: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/30",
  inactive: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  lost: "bg-red-500/15 text-red-400 border border-red-500/30",
};

const categoryVariant: Record<string, string> = {
  laptop: "bg-sky-500/15 text-sky-400",
  phone: "bg-green-500/15 text-green-400",
  router: "bg-orange-500/15 text-orange-400",
  tablet: "bg-purple-500/15 text-purple-400",
  other: "bg-slate-500/15 text-slate-400",
};

interface AssetDetailTabsProps {
  asset: AssetWithScans;
}

export function AssetDetailTabs({ asset }: AssetDetailTabsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<UpdateAssetInput>({
    resolver: zodResolver(updateAssetSchema),
    defaultValues: {
      name: asset.name,
      category: asset.category as UpdateAssetInput["category"],
      description: asset.description ?? "",
      status: asset.status as UpdateAssetInput["status"],
    },
  });

  async function onEditSubmit(data: UpdateAssetInput) {
    setIsUpdating(true);
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setIsUpdating(false);
    if (!res.ok) {
      toast.error("Something went wrong. Please try again.");
      return;
    }
    toast.success("Changes saved.");
    setEditOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    const res = await fetch(`/api/assets/${asset.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.info("Asset deactivated.");
      router.push("/assets");
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5">
          <Link href="/assets">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-semibold truncate">{asset.name}</h1>
            <Badge className={categoryVariant[asset.category]} variant="outline">
              {asset.category}
            </Badge>
            <Badge className={statusVariant[asset.status]} variant="outline">
              {asset.status}
            </Badge>
          </div>
          {asset.description && (
            <p className="text-sm text-muted-foreground">{asset.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate asset?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark &quot;{asset.name}&quot; as inactive. It won&apos;t appear on the map dashboard. You can reactivate it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Scan History ({asset.scans.length})</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Last Known Location</CardTitle>
              </CardHeader>
              <CardContent>
                {asset.latestScan ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-mono text-xs">
                        {formatCoords(asset.latestScan.latitude, asset.latestScan.longitude)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last scan</span>
                      <span>{formatRelativeTime(asset.latestScan.scannedAt)}</span>
                    </div>
                    {asset.latestScan.accuracy && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span>±{Math.round(asset.latestScan.accuracy)}m</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No scans recorded yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-sm">Asset Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total scans</span>
                    <span>{asset.scans.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{formatRelativeTime(asset.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QR ID</span>
                    <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {asset.qrCode}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scan History */}
        <TabsContent value="history" className="mt-4">
          {asset.scans.length === 0 ? (
            <Card className="border-border border-dashed">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No scans yet. Scan the QR code to start tracking.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Scanned By</TableHead>
                    <TableHead className="font-mono text-xs">Coordinates</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asset.scans.map((scan) => {
                    const device = parseDeviceInfo(scan.deviceInfo);
                    return (
                      <TableRow key={scan.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatRelativeTime(scan.scannedAt)}
                        </TableCell>
                        <TableCell className="text-sm">{scan.scannerName ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatCoords(scan.latitude, scan.longitude)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {scan.accuracy ? `±${Math.round(scan.accuracy)}m` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {device ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {device.type === "mobile" ? (
                                <Smartphone className="h-3 w-3 shrink-0" />
                              ) : device.type === "tablet" ? (
                                <Tablet className="h-3 w-3 shrink-0" />
                              ) : (
                                <Monitor className="h-3 w-3 shrink-0" />
                              )}
                              <span className="truncate max-w-[140px]">
                                {device.device} · {device.os} · {device.browser}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {scan.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* QR Code */}
        <TabsContent value="qr" className="mt-4">
          <QRCodeDisplay assetId={asset.id} assetName={asset.name} />
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update the details for this asset.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="laptop">Laptop</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="router">Router</SelectItem>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea className="resize-none" rows={3} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
