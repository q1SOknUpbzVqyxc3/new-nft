import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/ui";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const descriptionId = error || hint ? `${inputId}-description` : undefined;

    return (
      <label className="field" htmlFor={inputId}>
        {label ? <span className="field__label">{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn("field__input", error && "field__input--error", className)}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionId}
          {...props}
        />
        {error || hint ? (
          <span id={descriptionId} className={cn("field__message", error && "field__message--error")}>
            {error ?? hint}
          </span>
        ) : null}
      </label>
    );
  }
);

TextField.displayName = "TextField";
