import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { EmptyState, ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

export default function ClientPortal() {
  const { data, error, loading, reload } = useApi(() => api.roles(0, 20));

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.items.length) {
    return <EmptyState title="No active searches" body="Once a role is briefed, it will appear here." />;
  }

  const first = data.items[0];

  return (
    <PageTransition>
      <NextStepStrip
        label={first ? `Review ${first.title}` : "No active searches yet"}
        detail="You only see curated candidates — never internal recruiter notes."
        href={first ? `/client/roles/${first.id}` : "/app"}
      />
      <header className="max-w-2xl">
        <Eyebrow>Client portal · demo mode</Eyebrow>
        <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
          Your searches, without the recruiting back-office.
        </h1>
        <p className="mt-5 text-[1.0625rem] leading-[1.7] text-muted">
          Recommended candidates, interview requests, and hiring progress. Internal recruiter notes stay off this
          surface.
        </p>
      </header>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {data.items.map((role) => (
          <Link
            key={role.id}
            to={`/client/roles/${role.id}`}
            className="surface-card group flex flex-col p-7 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="type-caption">{role.client_name}</p>
                <h2 className="mt-2 font-display text-[1.5rem] leading-snug tracking-tight transition group-hover:text-accent">
                  {role.title}
                </h2>
              </div>
              <StatusPill status={role.health_status} />
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/70 pt-5 text-[13px] text-muted">
              <span className="tabular-nums">{role.candidate_count} in pipeline</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>{role.sla_label}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="capitalize">{role.work_mode}</span>
            </div>
          </Link>
        ))}
      </div>
    </PageTransition>
  );
}
