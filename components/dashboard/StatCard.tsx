import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ label, value, icon: Icon, description }: StatCardProps) {
  return (
    <Card className="border-border">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
        </div>
        <div className="mt-2">
          <p className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
