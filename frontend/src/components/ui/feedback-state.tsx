import type { ReactNode } from "react";

type StateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: StateProps) {
  return (
    <section className="ui-feedback-state" aria-live="polite">
      <span className="ui-feedback-state__symbol" aria-hidden="true">◇</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="ui-feedback-state__action">{action}</div>}
    </section>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="ui-loading-state" role="status">
      <span className="ui-loading-state__spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, action }: StateProps) {
  return (
    <section className="ui-feedback-state ui-feedback-state--error" role="alert">
      <span className="ui-feedback-state__symbol" aria-hidden="true">!</span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="ui-feedback-state__action">{action}</div>}
    </section>
  );
}
