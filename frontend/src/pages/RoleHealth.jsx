import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

const STEP_STATE = {
  done: { dot: "bg-track", text: "text-ink", label: "Done" },
  current: { dot: "bg-accent", text: "text-ink", label: "In progress" },
  upcoming: { dot: "bg-border", text: "text-muted", label: "Upcoming" },
};

export default function RoleHealth() {
  const { roleId } = useParams();
  const { data, error, loading, reload } = useApi(
    () =>
      Promise.all([api.role(roleId), api.health(roleId), api.market(roleId)]).then(([role, health, market]) => ({
        role,
        health,
        market,
      })),
    [roleId]
  );

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { role, health, market } = data;
  const parts = [
    ["Candidate volume", health.breakdown.candidate_volume],
    ["Candidate quality", health.breakdown.candidate_quality],
    ["Pipeline velocity", health.breakdown.pipeline_velocity],
    ["Client responsiveness", health.breakdown.client_responsiveness],
  ];
  const scoreTone =
    health.status === "on_track" ? "bg-track" : health.status === "at_risk" ? "bg-accent" : "bg-risk";

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>{role.client_name} · pipeline health</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em]">{role.title}</h1>
        </div>
        <StatusPill status={health.status} className="mb-2" />
      </header>

      <section className="mt-12 grid gap-5 lg:grid-cols-12">
        <div className="surface-card p-9 lg:col-span-5 md:p-10">
          <p className="type-caption">Pipeline health</p>
          <p className="mt-5 font-display text-[4rem] leading-none tracking-[-0.035em] tabular-nums">
            {health.score}
            <span className="text-[1.75rem] text-muted"> / 100</span>
          </p>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-border/70">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scoreTone}`}
              style={{ width: `${health.score}%` }}
            />
          </div>
          <p className="mt-7 border-t border-border pt-6 text-[0.9375rem] leading-[1.7]">{health.recommendation}</p>
        </div>

        <div className="surface-card p-9 lg:col-span-7 md:p-10">
          <p className="type-caption">Score breakdown</p>
          <p className="mt-2 text-sm text-muted">Four deterministic components, 25 points each.</p>
          <div className="mt-8 space-y-6">
            {parts.map(([label, score]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between text-[0.9375rem]">
                  <span>{label}</span>
                  <span className="tabular-nums text-muted">{score} / 25</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${(score / 25) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-[1.75rem] tracking-tight">SLA tracking</h2>
          <p className="font-display text-[1.375rem] tracking-tight text-muted">{health.sla.label}</p>
        </div>

        <ol className="mt-8 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {health.sla.timeline.map((step) => {
            const s = STEP_STATE[step.state] || STEP_STATE.upcoming;
            return (
              <li key={step.step} className="rounded-xl border border-border bg-paper px-4 py-4">
                <span className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
                  <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">{s.label}</span>
                </span>
                <p className={`mt-2.5 text-[0.9375rem] font-medium leading-snug ${s.text}`}>{step.step}</p>
              </li>
            );
          })}
        </ol>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Shortlist SLA", health.sla.shortlist_sla],
            ["Interview SLA", health.sla.interview_sla],
            ["Client response SLA", health.sla.client_response_sla],
          ].map(([k, v]) => (
            <div key={k} className="surface-card px-6 py-5">
              <dt className="text-[12.5px] text-muted">{k}</dt>
              <dd className="mt-1.5 text-[1.0625rem] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6">
          <h2 className="font-display text-[1.75rem] tracking-tight">Why candidates are being rejected</h2>
          <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.7] text-muted">{health.rejections.insight}</p>

          <ul className="mt-8 space-y-5">
            {health.rejections.breakdown.map((row) => (
              <li key={row.reason}>
                <div className="flex items-baseline justify-between text-[0.9375rem]">
                  <span>{row.reason}</span>
                  <span className="tabular-nums text-muted">{row.pct}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-risk/70" style={{ width: `${row.pct}%` }} />
                </div>
              </li>
            ))}
            {health.rejections.breakdown.length === 0 && (
              <li className="text-[0.9375rem] text-muted">No rejections recorded yet.</li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-6">
          <div className="surface-card h-full p-9 md:p-10">
            <p className="type-caption text-accent">Sample market intelligence</p>
            <h2 className="mt-3 font-display text-[1.75rem] tracking-tight">Talent market</h2>

            <dl className="mt-7 divide-y divide-border">
              {[
                ["Candidate supply", market.candidate_supply],
                ["Competition", market.competition],
                ["Expected salary", market.estimated_salary_range],
                ["Average notice", market.average_notice_period],
                ["Hiring difficulty", `${market.hiring_difficulty} / 10`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-[13px] text-muted">{k}</dt>
                  <dd className="text-[0.9375rem] font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 border-t border-border pt-6 text-[1.0625rem] leading-[1.6]">{market.narrative}</p>

            <ul className="mt-5 space-y-2.5">
              {market.recommendations.map((r) => (
                <li key={r} className="flex items-baseline gap-3 text-[0.9375rem] text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[12px] leading-relaxed text-muted/70">{market.label}</p>
          </div>
        </div>
      </section>

      <div className="mt-14 flex flex-wrap gap-3 border-t border-border pt-8">
        <Link to={`/app/pipeline/${roleId}`} className="btn-secondary px-5 py-2.5">
          Back to pipeline
        </Link>
        <Link to={`/app/pipeline/${roleId}/report`} className="btn-secondary px-5 py-2.5">
          Weekly report
        </Link>
      </div>
    </div>
  );
}
