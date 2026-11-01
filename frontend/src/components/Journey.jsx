import { Link, useLocation } from "react-router-dom";

const ROLE_STEPS = [
  { id: "calibration", label: "Calibrate", path: "calibration" },
  { id: "matching", label: "Match", path: "matching" },
  { id: "pipeline", label: "Pipeline", path: "" },
  { id: "health", label: "Health", path: "health" },
  { id: "market", label: "Market", path: "market" },
  { id: "report", label: "Report", path: "report" },
];

export function RoleJourney({ roleId, current }) {
  const location = useLocation();
  const active =
    current ||
    ROLE_STEPS.find((s) => s.path && location.pathname.endsWith(`/${s.path}`))?.id ||
    (location.pathname.endsWith(`/pipeline/${roleId}`) ? "pipeline" : null);

  const activeIdx = Math.max(
    0,
    ROLE_STEPS.findIndex((s) => s.id === active)
  );

  return (
    <nav aria-label="Role journey" className="mb-8 overflow-x-auto scroll-soft">
      <ol className="flex min-w-max items-center gap-1 rounded-full border border-border bg-surface/80 p-1.5">
        {ROLE_STEPS.map((step, i) => {
          const href = step.path
            ? `/app/pipeline/${roleId}/${step.path}`
            : `/app/pipeline/${roleId}`;
          const state = i < activeIdx ? "done" : i === activeIdx ? "current" : "upcoming";
          return (
            <li key={step.id}>
              <Link
                to={href}
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition duration-200 ${
                  state === "current"
                    ? "bg-ink text-paper shadow-card"
                    : state === "done"
                    ? "text-ink hover:bg-ink/[0.04]"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    state === "done"
                      ? "bg-track-soft text-track"
                      : state === "current"
                      ? "bg-accent text-paper"
                      : "border border-border text-muted"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function NextStepStrip({ label, detail, href, secondary }) {
  if (!label) return null;
  return (
    <div className="animate-rise mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-accent/20 bg-accent-soft/40 px-5 py-4">
      <div className="min-w-0">
        <p className="type-caption text-accent">Suggested next step</p>
        <p className="mt-1 font-semibold leading-snug">{label}</p>
        {detail && <p className="mt-1 text-[13px] text-muted">{detail}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {secondary && (
          <Link to={secondary.href} className="btn-secondary px-4 py-2 text-[13px]">
            {secondary.label}
          </Link>
        )}
        {href && (
          <Link to={href} className="btn-primary px-4 py-2 text-[13px]">
            Continue →
          </Link>
        )}
      </div>
    </div>
  );
}

export function PageTransition({ children }) {
  return <div className="animate-rise page-enter">{children}</div>;
}
