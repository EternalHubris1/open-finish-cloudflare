import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "of-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary-border bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(220,62,54,.16)] hover:brightness-110 hover:shadow-[0_12px_34px_rgba(233,84,72,.24)]",
        destructive:
          "border border-destructive-border bg-destructive text-destructive-foreground shadow-sm hover:brightness-110",
        outline:
          "border [border-color:var(--button-outline)] shadow-xs hover:border-white/20 hover:bg-white/[.065] active:shadow-none",
        secondary:
          "border border-secondary-border bg-secondary text-secondary-foreground hover:border-white/15 hover:bg-secondary/80",
        ghost: "border border-transparent hover:bg-white/[.055]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // @replit changed sizes
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
