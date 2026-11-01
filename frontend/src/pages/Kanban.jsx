import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition, RoleJourney } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

const COLUMNS = [
  ["sourced", "Sourced", "bg-border"],
  ["shortlisted", "Shortlisted", "bg-sage"],
  ["client_review", "Client Review", "bg-accent"],
  ["interview", "Interview", "bg-track"],
  ["offer", "Offer", "bg-ink"],
];

const REASONS = [
  "Compensation mismatch",
  "Experience mismatch",
  "Skill gap",
  "Notice period",
  "Location",
  "Client rejected",
  "Candidate withdrew",
  "Other",
];

const SHORT = {
  sourced: "Sourced",
  shortlisted: "Shortlist",
  client_review: "Client",
  interview: "Interview",
  offer: "Offer",
};

export default function Kanban() {
  const { roleId } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi(
    () => Promise.all([api.role(roleId), api.candidates(roleId)]).then(([role, grouped]) => ({ role, grouped })),
    [roleId]
  );
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { role, grouped } = data;

  const relocate = (current, candidate, stage) => {
    const next = Object.fromEntries(
      Object.entries(current).map(([key, value]) =>
        Array.isArray(value) ? [key, value.filter((c) => c.id !== candidate.id)] : [key, value]
      )
    );
    next[stage] = [candidate, ...(next[stage] || [])];
    return next;
  };

  const move = async (candidate, stage, extra = {}, { undoable = true } = {}) => {
    if (candidate.stage === stage) return;
    const from = candidate.stage;
    const updated = { ...candidate, stage, ...extra, updated_at: new Date().toISOString() };
    setData((d) => ({ ...d, grouped: relocate(d.grouped, updated, stage) }));
    try {
      await api.patchCandidate(candidate.id, { stage, ...extra });
      toast.push(
        `${candidate.name} → ${SHORT[stage] || "Rejected"}`,
        "ok",
        undoable
          ? {
              actionLabel: "Undo",
              onAction: () =>
                move({ ...updated, rejection_reason: null }, from, {}, { undoable: false }),
            }
          : {}
      );
    } catch (err) {
      setData((d) => ({ ...d, grouped: relocate(d.grouped, candidate, from) }));
      toast.push(err.message, "error");
    }
  };

  const onDrop = (stage) => {
    if (dragging) move(dragging, stage);
    setDragging(null);
    setOver(null);
  };

  const totalActive = COLUMNS.reduce((n, [key]) => n + grouped[key].length, 0);

  const topShortlist = grouped.shortlisted?.[0];

  return (
    <PageTransition>
      <RoleJourney roleId={roleId} current="pipeline" />
      <NextStepStrip
        label={
          topShortlist
            ? `Review ${topShortlist.name} or send to client`
            : "Run matching to grow the shortlist"
        }
        detail={`${role.sla_label} · Health ${role.health_score}/100`}
        href={
          topShortlist
            ? `/app/candidates/${topShortlist.id}`
            : `/app/pipeline/${roleId}/matching`
        }
        secondary={{ label: "Weekly report", href: `/app/pipeline/${roleId}/report` }}
      />
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Eyebrow>{role.client_name}</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em]">{role.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
            <span>{role.sla_label}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="capitalize">{role.urgency} urgency</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="tabular-nums">{totalActive} in pipeline</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="tabular-nums">Health {role.health_score}/100</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <StatusPill status={role.health_status} />
          <Link to={`/client/roles/${roleId}`} className="text-[13px] font-semibold text-muted transition hover:text-ink">
            Preview as client →
          </Link>
        </div>
      </header>

      <p className="mt-8 text-[12.5px] text-muted">
        Drag cards between columns or use the stage buttons. Every move can be undone for a few seconds.
      </p>

      <div className="scroll-soft mt-4 flex gap-2.5 overflow-x-auto pb-5">
        {COLUMNS.map(([key, label, dot]) => (
          <section
            key={key}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(key);
            }}
            onDragLeave={() => setOver((o) => (o === key ? null : o))}
            onDrop={() => onDrop(key)}
            className={`flex min-w-[12.75rem] flex-1 flex-col rounded-card border transition duration-200 ${
              over === key ? "border-accent/50 bg-accent-soft/30" : "border-border bg-surface/60"
            }`}
          >
            <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3.5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
                <h2 className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</h2>
              </div>
              <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-[11px] tabular-nums text-muted">
                {grouped[key].length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 p-2.5">
              {grouped[key].length === 0 && (
                <p className="px-2 py-6 text-center text-[12.5px] leading-relaxed text-muted/60">
                  Nothing here yet
                </p>
              )}
              {grouped[key].map((candidate) => (
                <article
                  key={candidate.id}
                  draggable
                  onDragStart={() => setDragging(candidate)}
                  onDragEnd={() => setDragging(null)}
                  className={`group cursor-grab rounded-xl border border-border bg-paper p-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing ${
                    dragging?.id === candidate.id ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/app/candidates/${candidate.id}`}
                      className="min-w-0 text-[0.9375rem] font-semibold leading-snug transition hover:text-accent"
                    >
                      {candidate.name}
                    </Link>
                    <span className="shrink-0 font-display text-[1.0625rem] leading-none tracking-tight tabular-nums">
                      {candidate.fit_score}
                      <span className="text-[10px] text-muted">%</span>
                    </span>
                  </div>

                  <p className="mt-1.5 line-clamp-1 text-[12.5px] text-muted">{candidate.current_title}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {(candidate.skills || []).slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md bg-bg px-1.5 py-0.5 text-[10.5px] text-muted">
                        {s}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2.5 text-[10.5px] text-muted/70">
                    Updated{" "}
                    {new Date(candidate.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1 border-t border-border/70 pt-2.5">
                    {COLUMNS.filter(([stage]) => stage !== candidate.stage).map(([stage]) => (
                      <button
                        key={stage}
                        type="button"
                        className="rounded-md px-1.5 py-0.5 text-[10.5px] text-muted transition duration-150 hover:bg-ink hover:text-paper"
                        onClick={() => move(candidate, stage)}
                      >
                        {SHORT[stage]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ml-auto rounded-md px-1.5 py-0.5 text-[10.5px] text-muted transition duration-150 hover:bg-risk hover:text-paper"
                      onClick={() => setRejecting(candidate)}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {grouped.rejected.length > 0 && (
        <p className="text-[13px] text-muted">
          <span className="tabular-nums">{grouped.rejected.length}</span> rejected — tracked in{" "}
          <Link to={`/app/pipeline/${roleId}/health`} className="text-accent hover:underline">
            rejection analytics
          </Link>
          , not a Kanban column.
        </p>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="surface-card animate-rise w-full max-w-md overflow-hidden">
            <div className="border-b border-border px-7 py-5">
              <p className="type-caption text-risk">Reject candidate</p>
              <h3 className="mt-2 font-display text-[1.5rem] tracking-tight">{rejecting.name}</h3>
            </div>
            <div className="px-7 py-6">
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                A reason is required so the role can learn why the pipeline is leaking.
              </p>
              <select className="field mt-5" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-surface/60 px-7 py-4">
              <button className="btn-ghost" type="button" onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  move(rejecting, "rejected", { rejection_reason: reason });
                  setRejecting(null);
                }}
              >
                Confirm reject
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
