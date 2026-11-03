import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
};

export default function Input({
  label,
  hint,
  error,
  leadingIcon,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="ui-field">
      {label && (
        <label className="ui-field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={["ui-input-wrap", error ? "ui-input-wrap--error" : ""].join(" ")}>
        {leadingIcon && <span className="ui-input-wrap__icon">{leadingIcon}</span>}
        <input
          id={inputId}
          className={["ui-input", className].filter(Boolean).join(" ")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {error ? (
        <p className="ui-field__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ui-field__hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
