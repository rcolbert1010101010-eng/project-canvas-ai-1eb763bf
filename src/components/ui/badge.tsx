import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        info: "border-transparent bg-info/10 text-info",
        // Status variants
        todo: "border-transparent bg-muted text-muted-foreground",
        "in-progress": "border-transparent bg-info/10 text-info",
        blocked: "border-transparent bg-destructive/10 text-destructive",
        done: "border-transparent bg-success/10 text-success",
        // Priority variants
        "priority-low": "border-transparent bg-muted text-muted-foreground",
        "priority-medium": "border-transparent bg-warning/10 text-warning",
        "priority-high": "border-transparent bg-destructive/10 text-destructive",
        // Decision status
        proposed: "border-transparent bg-warning/10 text-warning",
        accepted: "border-transparent bg-success/10 text-success",
        deprecated: "border-transparent bg-muted text-muted-foreground",
        // Impact variants
        "impact-low": "border-transparent bg-muted text-muted-foreground",
        "impact-medium": "border-transparent bg-warning/10 text-warning",
        "impact-high": "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
