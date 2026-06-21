"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { createAssetSchema, type CreateAssetInput } from "@/lib/validations/asset";

export function CreateAssetForm() {
  const [createdAsset, setCreatedAsset] = useState<{ id: string; name: string } | null>(null);

  const form = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: { name: "", category: "laptop", description: "" },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: CreateAssetInput) {
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    const asset = await res.json();
    setCreatedAsset({ id: asset.id, name: asset.name });
    toast.success("Asset created. QR code ready to download.");
    form.reset();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
      {/* ── Left: Asset Details ── */}
      <div className="flex flex-col p-4 gap-5 sm:p-6 sm:gap-6">
        <div>
          <h2 className="text-base font-semibold">Asset Details</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Fill in the information about the asset below.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dell Laptop #4" {...field} />
                  </FormControl>
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this asset..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Asset
            </Button>
          </form>
        </Form>
      </div>

      {/* ── Right: QR Code ── */}
      <div className="flex flex-col p-4 gap-5 sm:p-6 sm:gap-6">
        <div>
          <h2 className="text-base font-semibold">QR Code</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generated automatically when the asset is created.
          </p>
        </div>

        {createdAsset ? (
          <QRCodeDisplay assetId={createdAsset.id} assetName={createdAsset.name} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/10 p-12 text-center gap-4 min-h-64">
            <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
              <QrCode className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No QR code yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Complete the form and click &ldquo;Create Asset&rdquo; to generate your QR code.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
