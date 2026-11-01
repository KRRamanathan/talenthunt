import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

const COLUMNS = ["To Do", "In Progress", "Done"];

const STATUS_TONE = {
  Done: "bg-track-soft text-track",
  "In Progress": "bg-accent-soft text-accent",
  "To Do": "bg-bg text-muted",
};

export default function Delivery() {
  const { data, error, loading, reload } = useApi(() => api.jiraBoard());

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const m = data.metrics;
  const active = data.active_sprint;

  return (
    <PageTransition>
      <NextStepStrip
        label="Triage synced role risks in the active sprint"
        detail={data.thesis}
        href="/app/pipeline?view=attention"
        secondary={{ label: "Integrations", href: "/app/integrations" }}
      />

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Jira · {data.project.key}</Eyebrow>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
            {data.project.name}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
            Scrum board for how TalentHunt was shipped — five sprints, epics for trust and transparency, and live
            sync of at-risk roles into the active sprint.
          </p>
        </div>
        <div className="pb-1 text-right text-[13px] text-muted">
          <p className="font-semibold text-ink">{active.name}</p>
          <p className="mt-1 max-w-xs">{active.goal}</p>
        </div>
      </header>

      <section className="surface-card mt-10 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {[
          ["Sprints done", m.sprints_completed],
          ["Stories done", m.stories_done],
          ["Points done", m.story_points_done],
          ["Avg velocity", m.avg_velocity],
          ["Synced risks", m.open_synced_risks],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-6">
            <p className="font-display text-[2rem] leading-none tabular-nums tracking-tight">{value}</p>
            <p className="mt-2 text-[13px] text-muted">{label}</p>
          </div>
        ))}
      </section>

      <p className="mt-4 text-[12.5px] text-muted">{data.project.label}</p>

      <section className="mt-12">
        <h2 className="font-display text-[1.5rem] tracking-tight">Epics</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {data.epics.map((epic) => (
            <li
              key={epic.key}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-paper px-3.5 py-1.5 text-[13px]"
            >
              <span className="font-semibold text-accent">{epic.key}</span>
              {epic.name}
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_TONE[epic.status] || STATUS_TONE["To Do"]}`}>
                {epic.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-[1.5rem] tracking-tight">Active sprint board</h2>
          <span className="text-[13px] text-muted">{data.active_issues.length} issues in {active.id}</span>
        </div>
        <div className="scroll-soft mt-5 flex gap-3 overflow-x-auto pb-3">
          {COLUMNS.map((col) => {
            const cards = (data.columns[col] || []).filter((i) => i.sprint === active.id || i.source === "role-sync");
            return (
              <div key={col} className="min-w-[15rem] flex-1 rounded-card border border-border bg-surface/60">
                <div className="flex items-center justify-between border-b border-border/70 px-3.5 py-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{col}</h3>
                  <span className="rounded-full bg-bg px-1.5 py-0.5 text-[11px] tabular-nums text-muted">
                    {cards.length}
                  </span>
                </div>
                <ul className="space-y-2.5 p-2.5">
                  {cards.length === 0 && (
                    <li className="px-2 py-6 text-center text-[12.5px] text-muted/60">Nothing here</li>
                  )}
                  {cards.map((issue) => (
                    <li key={issue.key} className="rounded-xl border border-border bg-paper p-3.5 shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-semibold text-accent">{issue.key}</span>
                        <span className="text-[11px] tabular-nums text-muted">{issue.points} pts</span>
                      </div>
                      <p className="mt-1.5 text-[0.9375rem] font-semibold leading-snug">{issue.summary}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="rounded-md bg-bg px-1.5 py-0.5">{issue.type}</span>
                        {issue.priority && <span>{issue.priority}</span>}
                        {issue.source === "role-sync" && (
                          <>
                            <StatusPill status={issue.priority === "Highest" ? "blocked" : "at_risk"} />
                            {issue.href && (
                              <Link to={issue.href} className="relative z-10 font-semibold text-accent">
                                Open role →
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-[1.5rem] tracking-tight">Sprint history</h2>
        <ol className="mt-5 space-y-3">
          {data.sprints.map((sprint) => (
            <li key={sprint.id} className="surface-card flex flex-wrap items-start justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-accent">{sprint.id}</p>
                <p className="mt-1 font-semibold">{sprint.name}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{sprint.goal}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    sprint.state === "active" ? "bg-accent-soft text-accent" : "bg-track-soft text-track"
                  }`}
                >
                  {sprint.state}
                </span>
                <p className="mt-2 text-[13px] tabular-nums text-muted">Velocity {sprint.velocity}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </PageTransition>
  );
}
