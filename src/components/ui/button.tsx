import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/ui";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "small" | "medium" | "large";
  children: ReactNode;
};

export function Button({ className, variant = "primary", size = "medium", children, ...props }: ButtonProps) {
  return (
    <button className={cn("button", `button--${variant}`, `button--${size}`, className)} {...props}>
      {children}
    </button>
  );
}
