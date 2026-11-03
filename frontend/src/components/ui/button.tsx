import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export default function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={["ui-button", `ui-button--${variant}`, `ui-button--${size}`, className]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    >
      {leadingIcon && <span className="ui-button__icon">{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className="ui-button__icon">{trailingIcon}</span>}
    </button>
  );
}
