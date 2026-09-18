import React from 'react';

interface PageHeadingProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/** nivo page header: tight-tracked title, muted subtitle, right-aligned actions. */
export const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  actions,
}) => (
  <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="text-2xl font-[650] tracking-[-0.06em] md:text-[30px]">
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-xs text-navy-500">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </section>
);
