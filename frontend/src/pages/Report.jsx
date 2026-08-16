import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";

export default function Report() {
  const { roleId } = useParams();
  const { data, error, loading, reload } = useApi(() => api.report(roleId), [roleId]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const top = Math.max(...data.funnel.map((f) => f.count), 1);
  const week = data.this_week;
  const generated = new Date(data.generated_at.replace("Z", ""));

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-9">
        <div>
          <Eyebrow>Weekly hiring report</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
            {data.role_title}
          </h1>
          <p className="mt-3 text-[1.0625rem] text-muted">{data.client_name}</p>
        </div>
        <div className="pb-1 text-right text-[13px] text-muted">
          <p>
            Generated{" "}
            {generated.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <p className="mt-1 max-w-[16rem] leading-relaxed text-muted/80">{data.label}</p>
        </div>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <section className="lg:col-span-7">
          <h2 className="font-display text-[1.75rem] tracking-tight">Pipeline funnel</h2>
          <ul className="mt-8 space-y-6">
            {data.funnel.map((row, i) => {
              const prev = i === 0 ? null : data.funnel[i - 1].count;
              const conv = prev && prev > 0 ? Math.round((row.count / prev) * 100) : null;
              return (
                <li key={row.stage}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.9375rem] font-medium">{row.stage}</span>
                    <span className="flex items-baseline gap-3">
                      {conv !== null && (
                        <span className="text-[12px] tabular-nums text-muted">{conv}% of previous</span>
                      )}
                      <span className="font-display text-[1.25rem] tabular-nums">{row.count}</span>
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max((row.count / top) * 100, row.count > 0 ? 4 : 0)}%`,
                        background: `rgba(180, 74, 40, ${1 - i * 0.15})`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="lg:col-span-5">
          <h2 className="font-display text-[1.75rem] tracking-tight">What changed this week</h2>
          <div className="surface-card mt-8 divide-y divide-border">
            {[
              ["Candidates sourced", week.sourced],
              ["Screened", week.screened],
              ["Shortlisted", week.shortlisted],
              ["Interviewed", week.interviewed],
              ["Offers", week.offers],
              ["Rejected", week.rejected],
            ].map(([label, n]) => (
              <div key={label} className="flex items-center justify-between px-6 py-4">
                <span className="text-[0.9375rem] text-muted">{label}</span>
                <span className="font-display text-[1.5rem] leading-none tabular-nums">{n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-14 overflow-hidden rounded-card border border-border bg-ink text-paper">
        <div className="grid gap-10 px-9 py-11 md:grid-cols-12 md:gap-12 md:px-12 md:py-14">
          <div className="md:col-span-7">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/50">
              <span className="h-px w-6 bg-accent" />
              Hiring insight
            </p>
            <p className="mt-6 font-display text-[1.75rem] leading-[1.35] tracking-tight">{data.insight}</p>
          </div>
          <div className="md:col-span-5 md:border-l md:border-paper/15 md:pl-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/50">Recommendation</p>
            <p className="mt-5 text-[1.0625rem] leading-[1.7] text-paper/90">{data.recommendation}</p>
          </div>
        </div>
      </section>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
        <p className="max-w-lg font-display text-[1.375rem] leading-snug tracking-tight text-muted">
          TalentHunt turns recruiter activity into hiring intelligence.
        </p>
        <div className="flex gap-3">
          <Link to={`/app/pipeline/${roleId}`} className="btn-secondary px-5 py-2.5">
            Back to role
          </Link>
          <Link to={`/app/pipeline/${roleId}/health`} className="btn-secondary px-5 py-2.5">
            Pipeline health
          </Link>
        </div>
      </div>
    </div>
  );
}
