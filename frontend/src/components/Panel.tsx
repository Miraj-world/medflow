import type { PropsWithChildren } from "react";

export const Panel = ({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>) => (
  <section className="panel">
    <div className="panel-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);
