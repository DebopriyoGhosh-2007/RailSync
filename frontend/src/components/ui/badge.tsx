import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        // Functional Status Variants
        success: "border-transparent bg-[#22c55e] text-white", // green
        warning: "border-transparent bg-[#f59e0b] text-white", // amber
        critical: "border-transparent bg-[#ef4444] text-white", // red
        info: "border-transparent bg-[#3b82f6] text-white", // blue
        unavailable: "border-transparent bg-[#9ca3af] text-white", // gray
        // Department Variants
        eng: "border-transparent bg-[#475569] text-white",
        sig: "border-transparent bg-[#0d9488] text-white",
        trc: "border-transparent bg-[#8b5cf6] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
