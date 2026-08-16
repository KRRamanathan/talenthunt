const STATUS = {
  on_track: { cls: "bg-track-soft text-track", dot: "bg-track", label: "On track" },
  at_risk: { cls: "bg-accent-soft text-accent", dot: "bg-accent", label: "At risk" },
  blocked: { cls: "bg-risk-soft text-risk", dot: "bg-risk", label: "Blocked" },
  urgent: { cls: "bg-risk-soft text-risk", dot: "bg-risk", label: "Urgent" },
  high: { cls: "bg-accent-soft text-accent", dot: "bg-accent", label: "High" },
  normal: { cls: "bg-sage-soft text-sage", dot: "bg-sage", label: "Normal" },
};

export function StatusPill({ status, className = "" }) {
  const meta = STATUS[status] || { cls: "bg-accent-soft text-accent", dot: "bg-accent", label: status };
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.cls} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`eyebrow-rule ${className}`}>
      <span className="h-px w-6 shrink-0 bg-accent" />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="animate-rise space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-10 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-72 lg:col-span-2" />
      </div>
      <p className="type-caption flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Waking the API — free-tier backends can take 30–60 seconds after idle
      </p>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="animate-rise mx-auto max-w-xl py-10">
      <div className="surface-card overflow-hidden">
        <div className="h-1 w-full bg-risk/70" />
        <div className="px-9 py-10">
          <Eyebrow className="text-risk">Request failed</Eyebrow>
          <h2 className="mt-5 font-display text-[1.75rem] tracking-tight">We couldn’t load this view</h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted">
            {error?.message || "The API did not respond."}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted/80">
            If this is the first request after idle, the free-tier backend may still be waking up.
          </p>
          {onRetry && (
            <button className="btn-primary mt-8" onClick={onRetry} type="button">
              Retry request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="animate-rise surface-card mx-auto max-w-lg px-10 py-16 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border bg-bg">
        <span className="h-2 w-2 rounded-full bg-accent/60" />
      </div>
      <h3 className="mt-6 font-display text-[1.625rem] tracking-tight">{title}</h3>
      <p className="mx-auto mt-3 max-w-sm text-[0.9375rem] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function FitScore({ score, size = "md" }) {
  const tone = score >= 85 ? "text-ink" : score >= 75 ? "text-ink" : "text-muted";
  const sizes = {
    sm: "text-[1.0625rem]",
    md: "text-[1.375rem]",
    lg: "text-[2rem]",
  };
  return (
    <div className="flex shrink-0 flex-col items-end leading-none">
      <span className={`font-display tracking-tight tabular-nums ${sizes[size]} ${tone}`}>{score}%</span>
      <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">Match</span>
    </div>
  );
}

export function Meter({ value, max = 100, tone = "accent" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = { accent: "bg-accent", ink: "bg-ink", track: "bg-track" }[tone] || "bg-accent";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/70">
      <div className={`h-full rounded-full transition-all duration-500 ${bg}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
