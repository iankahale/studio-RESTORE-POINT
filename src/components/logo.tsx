
"use client";

import { AnimatedLogo } from "@/components/animated-logo";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn(
        "flex items-center gap-3",
        "group-data-[collapsible=icon]:gap-0",
        className
    )}>
        <AnimatedLogo />
        <span className={cn(
            "text-lg font-bold tracking-tight text-foreground transition-all duration-300 ease-in-out",
            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:-ml-4"
        )}>
            Beyond Borders Logistics
        </span>
    </div>
  );
};
