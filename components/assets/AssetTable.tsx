"use client";

import Link from "next/link";
import { MoreHorizontal, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatCoords, formatRelativeTime } from "@/lib/utils";
import type { Asset } from "@/types";

interface AssetTableProps {
  assets: Asset[];
  onDeleted?: () => void;
}

const statusVariant: Record<string, string> = {
  active: "bg-green-500/15 text-green-400 border border-green-500/30",
  inactive: "bg-slate-500/15 text-slate-400 border border-slate-500/30",
  lost: "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse",
};

const categoryVariant: Record<string, string> = {
  laptop: "bg-sky-500/15 text-sky-400",
  phone: "bg-green-500/15 text-green-400",
  router: "bg-orange-500/15 text-orange-400",
  tablet: "bg-purple-500/15 text-purple-400",
  other: "bg-slate-500/15 text-slate-400",
};

export function AssetTable({ assets, onDeleted }: AssetTableProps) {
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"?`)) return;
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.info("Asset deactivated.");
      onDeleted?.();
    } else {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Last Seen</TableHead>
            <TableHead className="hidden md:table-cell font-mono text-xs">Coordinates</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow key={asset.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/assets/${asset.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {asset.name}
                </Link>
                {/* Show last-seen inline on mobile where the column is hidden */}
                <p className="sm:hidden text-[11px] text-muted-foreground mt-0.5">
                  {asset.latestScan
                    ? formatRelativeTime(asset.latestScan.scannedAt)
                    : "Never scanned"}
                </p>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge
                  className={categoryVariant[asset.category] ?? categoryVariant.other}
                  variant="outline"
                >
                  {asset.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={statusVariant[asset.status]} variant="outline">
                  {asset.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                {asset.latestScan
                  ? formatRelativeTime(asset.latestScan.scannedAt)
                  : "Never"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className="font-mono text-xs text-muted-foreground">
                  {asset.latestScan
                    ? formatCoords(
                        asset.latestScan.latitude,
                        asset.latestScan.longitude
                      )
                    : "—"}
                </span>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/assets/${asset.id}`} className="flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5" />
                        View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                      onClick={() => handleDelete(asset.id, asset.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  );
}
