import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { RoleJourney, NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";

export default function Market() {
  const { roleId } = useParams();
  const { data, error, loading, reload } = useApi(
    () => Promise.all([api.role(roleId), api.market(roleId)]).then(([role, market]) => ({ role, market })),
    [roleId]
  );

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { role, market } = data;

  return (
    <PageTransition>
      <RoleJourney roleId={roleId} current="market" />
      <NextStepStrip
        label={market.below_market ? "Recalibrate compensation before the next sourcing wave" : "Generate the weekly hiring report"}
        detail={market.narrative}
        href={market.below_market ? `/app/pipeline/${roleId}/calibration` : `/app/pipeline/${roleId}/report`}
        secondary={{ label: "Pipeline health", href: `/app/pipeline/${roleId}/health` }}
      />

      <header>
        <Eyebrow>Deeper talent market intelligence</Eyebrow>
        <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em]">{role.title}</h1>
        <p className="mt-3 text-muted">{role.client_name} · {market.label}</p>
      </header>

      <section className="surface-card mt-10 grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Candidate supply", market.candidate_supply],
          ["Competition", market.competition],
          ["Expected salary", market.estimated_salary_range],
          ["Average notice", market.average_notice_period],
          ["Hiring difficulty", `${market.hiring_difficulty} / 10`],
          ["Time-to-hire benchmark", market.time_to_hire_benchmark],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="type-caption">{k}</p>
            <p className="mt-2 font-display text-[1.5rem] tracking-tight">{v}</p>
          </div>
        ))}
      </section>

      <p className="mt-6 max-w-3xl text-[1.0625rem] leading-relaxed">{market.competitor_density}</p>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <section className="surface-card p-8">
          <h2 className="font-display text-[1.5rem] tracking-tight">Skill demand</h2>
          <p className="mt-2 text-sm text-muted">Relative demand index for this profile family (sample).</p>
          <ul className="mt-6 space-y-4">
            {(market.skill_demand || []).map((row) => (
              <li key={row.skill}>
                <div className="flex justify-between text-[0.9375rem]">
                  <span>{row.skill}</span>
                  <span className="tabular-nums text-muted">{row.demand}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border/60">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${row.demand}%` }} />
                </div>
              </li>
            ))}
          </ul>
          {(market.scarce_skills_on_brief || []).length > 0 && (
            <p className="mt-6 border-t border-border pt-5 text-[13px] text-risk">
              Scarce skills on your brief:{" "}
              {market.scarce_skills_on_brief.map((s) => s.skill).join(", ")} — consider demoting to preferred.
            </p>
          )}
        </section>

        <section className="surface-card p-8">
          <h2 className="font-display text-[1.5rem] tracking-tight">Salary bands</h2>
          <p className="mt-2 text-sm text-muted">Sample distribution for comparable searches.</p>
          <dl className="mt-6 divide-y divide-border">
            {(market.salary_bands || []).map((band) => (
              <div key={band.band} className="flex justify-between py-3">
                <dt className="text-muted">{band.band}</dt>
                <dd className="font-display text-xl tabular-nums">{band.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 border-t border-border pt-5 text-[0.9375rem] leading-relaxed">{market.narrative}</p>
          <ul className="mt-4 space-y-2">
            {(market.recommendations || []).map((r) => (
              <li key={r} className="flex gap-2 text-[0.9375rem] text-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {r}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/app/pipeline/${roleId}/report`} className="btn-primary px-5 py-2.5">
          Weekly report
        </Link>
        <Link to={`/app/pipeline/${roleId}/calibration`} className="btn-secondary px-5 py-2.5">
          Recalibrate role
        </Link>
      </div>
    </PageTransition>
  );
}
