import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";

const FEASIBILITY_TONE = {
  Strong: { bar: "bg-track", chip: "bg-track-soft text-track" },
  Moderate: { bar: "bg-accent", chip: "bg-accent-soft text-accent" },
  Constrained: { bar: "bg-risk", chip: "bg-risk-soft text-risk" },
};

export default function Calibration() {
  const { roleId } = useParams();
  const { data, error, loading, reload } = useApi(() => api.calibration(roleId), [roleId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const tone = FEASIBILITY_TONE[data.feasibility] || FEASIBILITY_TONE.Moderate;

  return (
    <div className="animate-rise">
      <header className="max-w-3xl">
        <Eyebrow>Role calibration</Eyebrow>
        <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
          {data.title}
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-[1.7] text-muted">{data.narrative}</p>
        <p className="mt-4 text-[13px] text-muted/80">{data.label}</p>
      </header>

      <section className="mt-14">
        <div className="grid gap-5 md:grid-cols-3">
          <SkillCol title="Must-have" items={data.must_have} tone="accent" note="Non-negotiable for the search" />
          <SkillCol title="Strong signals" items={data.strong_signals} tone="sage" note="Raises confidence, not required" />
          <SkillCol title="Nice-to-have" items={data.nice_to_have} tone="muted" note="Never block a shortlist on these" />
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-12">
        <div className="surface-card p-9 lg:col-span-5 md:p-10">
          <p className="type-caption">Hiring feasibility</p>
          <div className="mt-5 flex items-baseline gap-3">
            <h2 className="font-display text-[3rem] leading-none tracking-[-0.03em]">{data.feasibility}</h2>
          </div>
          <div className="mt-7">
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted">Feasibility score</span>
              <span className="font-display text-lg tabular-nums">{data.feasibility_score} / 100</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border/70">
              <div
                className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
                style={{ width: `${data.feasibility_score}%` }}
              />
            </div>
          </div>

          {data.constraints?.length > 0 && (
            <div className="mt-9 border-t border-border pt-6">
              <p className="type-caption">What is narrowing the pool</p>
              <ul className="mt-4 space-y-2.5">
                {data.constraints.map((c) => (
                  <li key={c} className="flex items-baseline gap-3 text-[0.9375rem]">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone.bar}`} />
                    <span className="text-muted">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className="surface-card h-full p-9 md:p-10">
            <p className="type-caption">Recommendations</p>
            <p className="mt-2 text-sm text-muted">Deterministic, rule-based — each one widens the pool in a named way.</p>
            <ol className="mt-7 divide-y divide-border">
              {data.recommendations.map((rec, i) => (
                <li key={rec} className="flex gap-5 py-5 first:pt-0 last:pb-0">
                  <span className="font-display text-[1.5rem] leading-none text-accent/45 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[0.9375rem] leading-[1.65]">{rec}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link to={`/app/pipeline/${roleId}`} className="btn-primary px-6 py-3">
          Open pipeline
        </Link>
        <Link to={`/app/pipeline/${roleId}/health`} className="btn-secondary px-6 py-3">
          Pipeline health
        </Link>
      </div>
    </div>
  );
}

function SkillCol({ title, items, tone, note }) {
  const styles = {
    accent: { label: "text-accent", chip: "border-accent/25 bg-accent-soft/60 text-ink" },
    sage: { label: "text-sage", chip: "border-sage/20 bg-sage-soft/50 text-ink" },
    muted: { label: "text-muted", chip: "border-border bg-bg text-muted" },
  }[tone];
  const list = items || [];

  return (
    <div className="surface-card flex h-full flex-col p-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className={`type-caption ${styles.label}`}>{title}</p>
        <span className="text-[11px] tabular-nums text-muted">{list.length}</span>
      </div>
      <p className="mt-2 text-[13px] leading-snug text-muted">{note}</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {list.length === 0 && <li className="text-sm text-muted/70">None specified</li>}
        {list.map((item) => (
          <li key={item} className={`rounded-full border px-3 py-1.5 text-[0.875rem] font-medium ${styles.chip}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
