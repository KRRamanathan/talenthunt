import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { EmptyState, ErrorState, Eyebrow, PageSkeleton, StatusPill } from "../components/ui.jsx";

const VIEWS = [
  { id: "attention", label: "Needs attention", test: (r) => r.health_status !== "on_track" },
  { id: "on_track", label: "On track", test: (r) => r.health_status === "on_track" },
  { id: "all", label: "All roles", test: () => true },
];

const RANK = { blocked: 0, at_risk: 1, on_track: 2 };

export default function Pipeline() {
  const { data, error, loading, reload } = useApi(() => api.roles(0, 50));
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const view = VIEWS.find((v) => v.id === params.get("view")) || VIEWS[2];

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

  const q = query.trim().toLowerCase();
  const roles = data.items
    .filter(view.test)
    .filter((r) => !q || `${r.client_name} ${r.title} ${r.location}`.toLowerCase().includes(q))
    .sort((a, b) => RANK[a.health_status] - RANK[b.health_status] || a.health_score - b.health_score);

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Client pipeline</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
            Every live search, at delivery altitude.
          </h1>
          <p className="mt-4 text-[0.9375rem] text-muted">Riskiest roles first, so the top card is always the next one to open.</p>
        </div>
        <Link to="/intake" className="btn-secondary mb-1 px-4 py-2 text-[13px]">
          + New role
        </Link>
      </header>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface/80 p-1">
          {VIEWS.map((v) => {
            const count = data.items.filter(v.test).length;
            const active = v.id === view.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setParams(v.id === "all" ? {} : { view: v.id }, { replace: true })}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition duration-200 ${
                  active ? "bg-ink text-paper shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                {v.label}
                <span className={`ml-1.5 tabular-nums ${active ? "text-paper/60" : "text-muted/70"}`}>{count}</span>
              </button>
            );
          })}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by client, title, or city"
          className="field max-w-xs py-2 text-[13px]"
        />
      </div>

      {roles.length === 0 && (
        <p className="mt-10 rounded-card border border-dashed border-border px-6 py-10 text-center text-[13px] text-muted">
          No roles match this view.{" "}
          <button type="button" className="font-semibold text-accent" onClick={() => { setQuery(""); setParams({}); }}>
            Show all roles
          </button>
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roles.map((role) => (
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
