import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { RoleJourney, NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Matching() {
  const { roleId } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi(
    () =>
      Promise.all([api.role(roleId), api.matches(roleId)]).then(([role, matches]) => ({
        role,
        matches,
      })),
    [roleId]
  );

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { role, matches } = data;

  const act = async (row, stage, label) => {
    try {
      await api.patchCandidate(row.candidate_id, { stage });
      toast.push(label);
      const next = await api.matches(roleId);
      setData({ role, matches: next });
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const top = matches.matches[0];

  return (
    <PageTransition>
      <RoleJourney roleId={roleId} current="matching" />
      <NextStepStrip
        label={top ? `Review ${top.name} (${top.fit_score}% match)` : "Open the pipeline board"}
        detail={matches.insight}
        href={top ? `/app/candidates/${top.candidate_id}` : `/app/pipeline/${roleId}`}
        secondary={{ label: "Pipeline board", href: `/app/pipeline/${roleId}` }}
      />

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Automated candidate matching</Eyebrow>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em]">{role.title}</h1>
          <p className="mt-3 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
            {role.client_name} · Ranked, explainable shortlist suggestions — not a black-box model.
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-[2rem] tabular-nums">{matches.ready_for_shortlist}</p>
          <p className="text-[13px] text-muted">ready for shortlist</p>
        </div>
      </header>

      <p className="mt-6 text-[12.5px] text-muted">{matches.label}</p>

      <div className="mt-10 space-y-4">
        {matches.matches.map((row, i) => (
          <article key={row.candidate_id} className="surface-card overflow-hidden transition hover:shadow-lift">
            <div className="grid gap-6 px-6 py-6 md:grid-cols-12 md:gap-8 md:px-8">
              <div className="md:col-span-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-[1.25rem] text-accent/50 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    to={`/app/candidates/${row.candidate_id}`}
                    className="font-display text-[1.5rem] tracking-tight hover:text-accent"
                  >
                    {row.name}
                  </Link>
                  <span className="rounded-full border border-border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {row.stage.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-2 text-[0.9375rem] text-muted">{row.current_title}</p>
                <p className="mt-4 max-w-xl text-[0.9375rem] leading-[1.7]">{row.why}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {row.must_have_covered.map((s) => (
                    <span key={s} className="rounded-full bg-track-soft px-2.5 py-1 text-[12px] text-track">
                      {s}
                    </span>
                  ))}
                  {row.must_have_gaps.map((s) => (
                    <span key={s} className="rounded-full bg-risk-soft px-2.5 py-1 text-[12px] text-risk">
                      gap · {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 border-t border-border pt-5 md:col-span-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-display text-[2.25rem] leading-none tabular-nums">
                      {row.fit_score}
                      <span className="text-[1.125rem] text-muted">%</span>
                    </p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      {row.confidence} confidence
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      row.confidence === "High"
                        ? "bg-track-soft text-track"
                        : row.confidence === "Strong"
                        ? "bg-accent-soft text-accent"
                        : "bg-bg text-muted"
                    }`}
                  >
                    {row.confidence}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed text-muted">{row.recommendation}</p>
                <div className="flex flex-wrap gap-2">
                  {row.stage === "sourced" && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 text-[13px]"
                      onClick={() => act(row, "shortlisted", `${row.name} shortlisted`)}
                    >
                      Shortlist
                    </button>
                  )}
                  {row.stage === "shortlisted" && (
                    <button
                      type="button"
                      className="btn-primary px-4 py-2 text-[13px]"
                      onClick={() => act(row, "client_review", `${row.name} sent to client`)}
                    >
                      Send to client
                    </button>
                  )}
                  <Link to={`/app/candidates/${row.candidate_id}`} className="btn-secondary px-4 py-2 text-[13px]">
                    Open profile
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageTransition>
  );
}
