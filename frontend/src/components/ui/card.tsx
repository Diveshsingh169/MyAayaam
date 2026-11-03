import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
};

export default function Card({
  padding = "md",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={["ui-card", `ui-card--padding-${padding}`, className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </section>
  );
}
