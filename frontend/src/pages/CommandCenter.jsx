import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition } from "../components/Journey.jsx";
import TourCard from "../components/TourCard.jsx";
import { ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

const RAIL = {
  on_track: "bg-track",
  at_risk: "bg-accent",
  blocked: "bg-risk",
};

export default function CommandCenter() {
  const { data, error, loading, reload } = useApi(() => api.dashboard());

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const m = data.metrics;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const metrics = [
    ["Active roles", m.active_roles, "/app/pipeline"],
    ["Need action", m.candidates_awaiting_action, "/app/pipeline?view=attention"],
    ["Client pending", m.client_responses_pending, "/app/notifications"],
    ["Interviews", m.interviews_today, "/app/notifications"],
    ["At risk", m.roles_at_risk, "/app/pipeline?view=attention"],
  ];

  return (
    <PageTransition>
      <NextStepStrip
        label={data.next_step?.label}
        detail={data.next_step?.detail}
        href={data.next_step?.href}
        secondary={{ label: "Notifications", href: "/app/notifications" }}
      />

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Recruiter command center</Eyebrow>
          <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] tracking-[-0.03em] sm:text-[3.25rem]">
            {hello}, {data.greeting_name}.
          </h1>
          <p className="mt-4 max-w-lg text-[1.0625rem] leading-relaxed text-muted">
            What should you do next — not a wall of candidate records.
          </p>
        </div>
        <div className="pb-2 text-right">
          <p className="text-sm text-muted">{today}</p>
          {data.notifications_count > 0 && (
            <Link to="/app/notifications" className="mt-2 inline-flex text-[13px] font-semibold text-accent">
              {data.notifications_count} delivery alerts →
            </Link>
          )}
        </div>
      </header>

      <TourCard />

      <section className="surface-card mt-10 grid grid-cols-2 divide-x divide-y divide-border overflow-hidden sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {metrics.map(([label, value, href]) => (
          <Link key={label} to={href} className="group px-6 py-7 transition duration-200 hover:bg-surface/70">
            <p className="font-display text-[2.5rem] leading-none tracking-[-0.02em] tabular-nums">{value}</p>
            <p className="mt-3 flex items-center justify-between text-[13px] text-muted">
              {label}
              <span className="text-accent opacity-0 transition duration-200 group-hover:opacity-100" aria-hidden>
                →
              </span>
            </p>
          </Link>
        ))}
      </section>

      <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <section className="lg:col-span-7">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[1.75rem] tracking-tight">Attention needed</h2>
            <span className="text-[13px] text-muted">{data.attention.length} roles</span>
          </div>

          <div className="mt-5 space-y-3">
            {data.attention.map((item) => (
              <article
                key={item.role_id}
                className="surface-card group relative flex overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className={`w-1 shrink-0 ${RAIL[item.status] || "bg-border"}`} />
                <div className="min-w-0 flex-1 px-6 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="type-caption">{item.client_name}</p>
                      <Link
                        to={`/app/pipeline/${item.role_id}`}
                        className="mt-1.5 block font-sans text-[1.0625rem] font-semibold leading-snug transition after:absolute after:inset-0 group-hover:text-accent"
                      >
                        {item.title}
                      </Link>
                    </div>
                    <StatusPill status={item.status} />
                  </div>
                  <p className="mt-3 line-clamp-2 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
                    {item.reason}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-[12.5px] text-muted">
                    <span>{item.sla}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="tabular-nums">Health {item.score}/100</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="relative z-10 ml-auto flex gap-4">
                      <Link to={`/app/pipeline/${item.role_id}/matching`} className="font-semibold text-muted hover:text-ink">
                        Match
                      </Link>
                      <Link to={`/app/pipeline/${item.role_id}/report`} className="font-semibold text-accent">
                        Report →
                      </Link>
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="surface-card overflow-hidden lg:sticky lg:top-24">
            <div className="border-b border-border bg-surface/70 px-7 py-5">
              <p className="type-caption text-accent">Recruiter copilot</p>
              <h2 className="mt-2.5 font-display text-[1.375rem] leading-snug tracking-tight">
                {data.copilot.headline}
              </h2>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Rule-based actions. Not a chatbot, not a live model.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {data.copilot.actions.map((action) => (
                <li key={action.role_id + action.action} className="px-7 py-5">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        action.priority === "high" ? "bg-accent" : "bg-border"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-[0.9375rem] font-semibold leading-snug">{action.title}</p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{action.why}</p>
                      <Link
                        to={action.href}
                        className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent transition hover:gap-2.5"
                      >
                        {action.action}
                        <span aria-hidden>→</span>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-7 py-4">
              <Link to="/app/integrations" className="text-[13px] font-semibold text-muted hover:text-ink">
                Manage Slack · Jira · ATS →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </PageTransition>
  );
}
