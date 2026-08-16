import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { EmptyState, ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

export default function Pipeline() {
  const { data, error, loading, reload } = useApi(() => api.roles(0, 20));

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.items.length) {
    return (
      <EmptyState
        title="No open roles"
        body="Submit a brief to open the first pipeline."
        action={
          <Link to="/intake" className="btn-primary px-6 py-3">
            Submit a Role
          </Link>
        }
      />
    );
  }

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Client pipeline</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
            Every live search, at delivery altitude.
          </h1>
        </div>
        <p className="pb-2 text-[13px] tabular-nums text-muted">
          {data.items.length} of {data.total} roles
        </p>
      </header>

      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {data.items.map((role) => (
          <Link
            key={role.id}
            to={`/app/pipeline/${role.id}`}
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

            <div className="mt-6">
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="text-muted">Pipeline health</span>
                <span className="font-display text-[1.0625rem] tabular-nums">{role.health_score}/100</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    role.health_status === "on_track"
                      ? "bg-track"
                      : role.health_status === "at_risk"
                      ? "bg-accent"
                      : "bg-risk"
                  }`}
                  style={{ width: `${role.health_score}%` }}
                />
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/70 pt-5 text-[13px] sm:grid-cols-4">
              <Meta label="Urgency" value={role.urgency} />
              <Meta label="Candidates" value={role.candidate_count} />
              <Meta label="Day" value={role.days_active} />
              <Meta label="Mode" value={role.work_mode} />
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className="mt-1 capitalize tabular-nums">{value}</dd>
    </div>
  );
}
