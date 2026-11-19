import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
        pending:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        approved:
          "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
        resolved:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        rejected:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
        outline: "border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
